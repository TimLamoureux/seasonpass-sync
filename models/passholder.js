

const Sequelize = require("sequelize");

class Passholder extends Sequelize.Model {
    static init(sequelize, DataTypes) {
        return super.init(
            {
                masterlist_id: {
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
                    defaultValue: false
                },
                passType: {
                    type: Sequelize.STRING,
                },
                emergencyContact: {
                    type: Sequelize.STRING(14)
                },
                photoSource: {
                    type: Sequelize.STRING
                },
                photo: {
                    type: Sequelize.BLOB
                },
                pickedUp: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                notes: {
                    type: Sequelize.TEXT
                },
                platform: {
                    type: Sequelize.STRING,
                    defaultValue: "unknown"
                }
            },
            { sequelize }
        );
    }
}





// TODO: Missing its own ID?
module.exports = Passholder;