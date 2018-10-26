//const config = require('config');
const Sequelize = require('sequelize');
/*const request = require('request').defaults({ encoding: null });*/
const fetch = require('node-fetch');

const masterlist = require('./masterlist');
const photos = require('./photos');
const helpers = require('./helpers');

const passholderModel = require('./models/passholder');


class AppSPS {

    constructor(params) {
        Object.assign(this, params);
        this.sequelize = new Sequelize('passholders', this.config.get('database.login'), this.config.get('database.password'), {
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
            storage: this.config.get('database.file'),
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
                .then(res => this.masterlist.init()),
            this.sequelize.authenticate()
        ])
            .then(() => {
                let phPromises = this.masterlist.passholders.reduce((acc, ph) => {
                    acc.push(new Promise((resolve, reject) => {
                            this.models.Passholder.findOrBuild({
                                where: {
                                    masterlistId: ph.masterlistId,
                                }
                            }).then((found) => {
                                if (found[0].isNewRecord) {
                                    found[0].dataValues = Object.assign(found[0].dataValues, ph);
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

        this.models.Passholder.findAll({where: {photo: null}}).then(passholders => {

            passholders.map(async (ph, i) => {

                let noImport = this.config.get('photos.no_import');
                let photoSource = ph.photoSource;

                // photoSource contains a keyword which mentions to not attempt importing a photo
                if (photoSource != null && noImport.includes(photoSource)) {
                    return;
                }

                // It is a URL and need to retrieve BLOB
                if (helpers.isURL(photoSource)) {
                    try {
                        /*let blob = await blobUtil.imgSrcToBlob(photoSource);
                        ph.update({
                            photo: blob
                        });*/
                        /*request.get(photoSource, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                let data = new Buffer(body).toString('base64');
                                let byte[] decodedByte = Base64.decode(data, 0);
                                console.log(data);
                            }
                        });*/
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
                    ph.update({
                        photo: blob
                    });
                    return;

                } catch (e) {
                    // non critical error. Photo not found
                }


                /*photos.findPhoto(ph.firstName, ph.lastName, this.config.get('photos.folders')).then(
                    (photo) => {
                        photos.toBlob(photo[0]).then( blob => {


                            let stop;
                        }, err => {
                            console.error(`Error trying to convert ${photo[0]} to Blob`);
                        });
                    },
                    (err) => {
                        //console.error(err);
                    }
                );*/


            });
        })
    }
}

module.exports = AppSPS;