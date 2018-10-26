const config = require('config');
const Sequelize = require("sequelize");
const helpers = require('../helpers');

const bindings = config.get('masterlist.bindings');

class Passholder extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                masterlistId: {
                    type: Sequelize.STRING
                },
                firstName: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                lastName: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                printed: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    set(val) {
                        this.setDataValue('printed', helpers.strToBool(val));
                    }
                },
                passType: {
                    type: Sequelize.STRING,
                },
                phone: {
                    type: Sequelize.STRING(14)
                },
                emergencyContact: {
                    type: Sequelize.STRING(14)
                },
                email: {
                    type: Sequelize.STRING
                },
                photoSource: {
                    type: Sequelize.STRING
                },
                photo: {
                    type: Sequelize.BLOB
                },
                waiver: {
                    type: Sequelize.BOOLEAN,
                    set(val) {
                        this.setDataValue('waiver', helpers.strToBool(val));
                    }
                },
                pickedUp: {
                    type: Sequelize.BOOLEAN,
                    set(val) {
                        this.setDataValue('pickedUp', helpers.strToBool(val));
                    },
                },
                notes: {
                    type: Sequelize.TEXT
                },
                platform: {
                    type: Sequelize.STRING,
                    defaultValue: "unknown",
                    set(val) {
                        this.setDataValue('platform', (val == undefined || val == null || val == "" ? "unknown" : val));
                    }
                },
                amnt_paid: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0
                }
            },
            {
                sequelize,
                timestamps: false
            }
        );
    }

    static bindFromRow_old({titles = null, data = null}) {

        if (null == titles || null == data)
            return null;

        let passholder;
        try {
            return Object.keys(bindings).reduce((acc, binding, bindingIndex) => {
                let i = titles.indexOf(binding);
                if (i < 0)
                    return acc;
                acc[bindings[binding]] = data[i];
                return acc;
            }, {});

        } catch (e) {
            console.error(`Binding error between Spreadsheet and Database. ${e}`);
            return null;
        }
    }

    upsert2() {
        return Promise((resolve, reject) => {
            if (
                this.firstName != "" &&
                this.lastName != "" &&
                this.firstName != null &&
                this.lastName != null
            ) {
                this.findOrCreate({
                    where: {
                        firstName: this.firstName,
                        lastName: this.lastName
                    }
                })
                    .spread((ph, isCreated) => {
                        if (isCreated)
                            resolve(`Imported (${ph.masterlistId}) ${ph.firstName} ${ph.lastName} is the Card Database`);
                        else
                            reject(`(${ph.masterlistId}) ${ph.firstName} ${ph.lastName} existed already, didn't touch`);
                    });
            }
        });
    }
}


// TODO: Missing its own ID?
module.exports = Passholder;