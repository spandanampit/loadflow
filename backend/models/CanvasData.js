const { DataTypes } = require('sequelize');
const db = require('../database/dbConfig');

const CanvasData = db.define('CanvasData', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    thumbnail_image: {
        type: DataTypes.TEXT,
        allowNull: false, 
    },
    canvas_object: {
        type: DataTypes.TEXT,
        allowNull: false
    },
},{
    tableName: 'canvas_data'
  });



module.exports = CanvasData;
