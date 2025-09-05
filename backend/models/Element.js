const { DataTypes } = require('sequelize');
const db = require('../database/dbConfig');

const Element = db.define('Elements', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    svgPath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});



module.exports = Element;

