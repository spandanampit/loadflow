const { DataTypes } = require('sequelize');
const db = require('../database/dbConfig');
const Element = require('./Element');

// const ElementProperty = db.define('ElementProperty', {
//     elementId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: Element,
//             key: 'id',
//         },
//     },
//     sBusName: {
//         type: DataTypes.STRING(12), // Limits the length to a maximum of 12 characters
//         allowNull: false,
//         defaultValue: 'Bus-1',
//         validate: {
//             len: [1, 12], // Ensures the length is between 1 and 12 characters
//         },
//     },
//     iAreaNo: {
//         type: DataTypes.INTEGER, // Defines the column as an integer
//         allowNull: false,
//         defaultValue: 0, // Sets the default value to 0
//         validate: {
//             min: 1, // Ensures the value is at least 1
//             max: 12, // Ensures the value is no more than 12
//         },
//     },
//     iStatus: {
//         type: DataTypes.INTEGER, // Defines the column as an integer
//         allowNull: false,
//         defaultValue: 1, // Sets the default value to 1
//         validate: {
//             min: 0, // Ensures the value is at least 0
//             max: 1, // Ensures the value is no more than 1
//         },
//     },
//     fBuskV: {
//         type: DataTypes.DOUBLE, // Defines the column as a double (floating-point)
//         allowNull: false,
//         defaultValue: 220, // Sets the default value to 220
//         validate: {
//             min: 0.01, // Ensures the value is greater than 0
//             max: 1000, // Ensures the value is no more than 1000
//         },
//     },
//     fVmagPU: {
//         type: DataTypes.DOUBLE, // Defines the column as a double (floating-point)
//         allowNull: false,
//         defaultValue: 1, // Sets the default value to 1
//         validate: {
//             min: 0, // Ensures the value is at least 0
//             max: 2, // Ensures the value is no more than 2
//         },
//     },
//     fVangDeg: {
//         type: DataTypes.DOUBLE, // Defines the column as a double (floating-point)
//         allowNull: false,
//         defaultValue: 0, // Sets the default value to 0
//         validate: {
//             min: -180, // Ensures the value is at least -180
//             max: 180, // Ensures the value is no more than 180
//         },
//     },
// });

const ElementProperty = db.define('ElementProperty', {
    propertyName: { type: DataTypes.STRING, allowNull: false },
    propertyLabelName: { type: DataTypes.STRING, allowNull: false },
    propertyValue: { type: DataTypes.STRING, allowNull: false },
    propertyType: { type: DataTypes.STRING },
    minValue: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    maxValue: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    isIncremental: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    editable: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    defaultValue: {
        type: DataTypes.STRING,
        allowNull: true
    },
    orderProperties: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
  }, {
    tableName: 'ElementProperties'
  });

ElementProperty.belongsTo(Element, { foreignKey: 'elementId' });

module.exports = ElementProperty;
