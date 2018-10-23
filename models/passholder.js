
const config = require('config');
const Sequelize = require("sequelize");
const helpers = require('../helpers');

const bindings = config.get('masterlist.bindings');

class Passholder extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                masterlistId: {
                    type: Sequelize.INTEGER
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
                    defaultValue: false
                },
                notes: {
                    type: Sequelize.TEXT
                },
                platform: {
                    type: Sequelize.STRING,
                    defaultValue: "unknown"
                },
                amnt_paid: {
                    type: Sequelize.FLOAT,
                    defaultValue: 0
                }
            },
            { sequelize }
        );
    }

    static bindFromRow({
        titles = null,
        data = null,
                 }) {

        return new Promise( (resolve, reject) => {
            if ( null == titles || null == data )
                reject("Must provide titles and data");

            let passholder;
            try {
                passholder = Object.keys(bindings).reduce( (acc, binding, bindingIndex) => {
                    let i = titles.indexOf(binding);
                    if (i<0)
                        return acc;
                    acc[bindings[binding]] = data[i];
                    return acc;
                }, {});
            } catch (e) {
                console.error(`Binding error between Spreadsheet and Database. ${e}`);
                reject(e);
            }

            try {
                if (
                    passholder.firstName != "" &&
                    passholder.lastName != "" &&
                    passholder.firstName != null &&
                    passholder.lastName != null
                ) {
                    this.create(passholder)
                        .then( (something) => {
                            resolve("Passholder created")
                        });
                }
            } catch (e) {
                console.error(`Error adding passholder to DB. ${e}\n${e.stack}`);
                reject(e);
            }
        });
    }
}





// TODO: Missing its own ID?
module.exports = Passholder;