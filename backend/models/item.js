const { DataTypes } = require('sequelize');
const db = require('../database/dbConfig');

const Item = db.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Item;
