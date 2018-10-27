//const config = require('config');
const Sequelize = require('sequelize');
/*const request = require('request').defaults({ encoding: null });*/
const fetch = require('node-fetch');

const masterlist = require('./masterlist');
const photos = require('./photos');
const helpers = require('./helpers');

const passholderModel = require('./models/passholder');

let updateCount = 0;


class AppSPS {

    constructor(params) {
        Object.assign(this, params);
        this.sequelize = new Sequelize('passholders', this.config.get('card_db.login'), this.config.get('card_db.password'), {
            host: 'localhost',
            dialect: 'sqlite',
            operatorsAliases: false,
            logging: false,
            retry: {
                match: [
                    /SQLITE_BUSY/,
                ],
                name: 'query',
                max: 5
            },

            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },

            // SQLite only
            storage: this.config.get('card_db.file'),
            typeValidation: true
        });

        //TODO: Fetch all files in models dir dynamically.
        this.models = {
            Passholder: passholderModel.init(this.sequelize, Sequelize)
        };

        // Sync all defined models to the DB.
        this.sequelize.sync();


    }

    async sync({source = "", destination = ""}) {
        this.masterlist = new masterlist({app: this});

        Promise.all([
            this.masterlist.authorize(this.config.get('google_api.credentials'))
                .then(res => {
                    console.log(res)
                    return this.masterlist.init()
                }),
            this.sequelize.authenticate().then( (res) => {
                console.log("Connected to DB");
            }).catch( (e) => {
                console.error(e); 
            } )
        ])
            .then(async (done) => {
                /*this.models.Passholder.findAll({ where: {
                    masterlistId: {
                        [this.sequelize.Op.gt]: 0
                      }
                }}).then( (some) => {
                    console.log(`There are ${some.length} records in the DB`)
                })*/

                let phPromises = this.masterlist.passholders.reduce((acc, ph) => {
                    acc.push(new Promise((resolve, reject) => {
                            this.models.Passholder.findOrBuild({
                                where: {
                                    masterlistId: ph.masterlistId,
                                }
                            }).then((found) => {
                                // found[1] is same as found[0].isNewRecord
                                //TODO: Remove me in the future
                                if (found[0].dataValues.masterlistId == 938 || 
                                    found[0].dataValues.masterlistId == 939 ) {
                                    let stop;
                                }

                                if (found[0].isNewRecord) {
                                    found[0].dataValues = Object.assign(found[0].dataValues, ph);
                                    console.log(`Creating new DB record for (${ph.masterlistId}) ${ph.firstName} ${ph.lastName}`)
                                }
                                else {

                                }
                                resolve(found[0]);
                            }, (err) => {
                                reject(err);
                            })
                        })
                    );
                    return acc;
                }, []);

                Promise.all(phPromises).then((some) => {
                    some.map( (ph) => ph.save() );
                });
            })
            .catch(err => {
                console.error(`There was an issue connecting to services. ${err}`);
            });

    }

    async photo({action, options}) {
        await this.sequelize.authenticate()
            .then(() => {
                this.sequelize.sync();
                console.log(`Connected to database and database synced`);
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            })

        let maxFetch = 100;
        let currentFetch = 0;

        this.models.Passholder.findAll({where: {photo: null, printed: false}}).then(passholders => {

            passholders.map(async (ph, i) => {

                if (currentFetch >= maxFetch)
                    return;
                
                

                let noImport = this.config.get('photos.dont_import');
                let photoSource = ph.photoSource;

                // photoSource contains a keyword which mentions to not attempt importing a photo
                for (let refuse of noImport) {
                    if (photoSource != null && photoSource.startsWith(refuse))
                        return;
                }

                //Rate limiting
                this.updateCount++;

                // It is a URL and need to retrieve BLOB
                if (helpers.isURL(photoSource)) {
                    try {
                        (async () => {
                            let res = await fetch(photoSource);
                            let blob = await res.buffer();
                            await ph.update({
                                photo: blob
                            }).then((some) => {

                            });
                        })()
                    } catch (e) {
                        console.error(e);
                        return;
                    }
                }

                try {
                    let photo = await photos.findPhoto(ph.firstName, ph.lastName, this.config.get('photos.folders'));
                    
                    let blob = await photos.toBlob(photo[0]);
                    
                    currentFetch++;

                    ph.update({
                        photo: blob
                    }).then((updated) => {
                        console.log(`Added photo for (${updated.masterlistId}) ${updated.firstName} ${updated.lastName}`);
                      })
                      .catch( (e) => {
                          console.error(e);
                      });
                    return;

                } catch (e) {
                    // non critical error. Photo not found
                    //console.error(e);
                }
            });
        })
    }
}

module.exports = AppSPS;