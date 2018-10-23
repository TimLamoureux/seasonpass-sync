//const config = require('config');
const Sequelize = require('sequelize');

const masterlist = require('./masterlist');

const passholderModel = require('./models/passholder');


class AppSPS {

    constructor(params) {
        Object.assign(this, params);
        this.sequelize = new Sequelize('passholders', this.config.get('database.login'), this.config.get('database.password'), {
            host: 'localhost',
            dialect: 'sqlite',
            operatorsAliases: false,
            logging: false,

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
    }

    async sync({source = "", destination = ""}) {
        this.masterlist = new masterlist({app: this});

        Promise.all([
            this.masterlist.authorize(this.config.get('google_api.credentials'))
                .then(res => this.masterlist.init()),
            this.sequelize.authenticate()
                .then(() => {
                    this.sequelize.sync();
                })
                .catch(err => {
                    console.error('Unable to connect to the database:', err);
                })
        ])
            .then(values => {
                console.log("Ready to sync...");
            })
            .catch(err => {
                console.error(`There was an issue connecting to services. ${err}`);
            });

    }
}

module.exports = AppSPS;