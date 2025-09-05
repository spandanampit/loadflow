const Element = require('../models/Element');
const ElementProperty = require('../models/ElementProperty');

// Get elements with properties
// exports.getElementsWithProperties_ = async (req, res) => {
//     try {
//         //res.status(200).json({ result: 'yes' });
//         const elements = await Element.findAll({
//             include: [{ model: ElementProperty }]
//         });
//         console.log("Fetched Element:", elements);
//         res.json(elements);
//     } catch (error) {
//         console.error('Error fetching elements:', error);
//         res.status(500).json({ error: 'Error fetching elements and properties' });
//     }
// };

exports.getElementsWithProperties_ = async (req, res) => {
    try {
        const elements = await Element.findAll({
            include: [
                {
                    model: ElementProperty,
                    as: 'ElementProperties', // Match the alias defined in the model association
                },
            ],
        });

        if (elements.length === 0) {
            return res.status(404).json({ message: 'No elements found' });
        }

        res.status(200).json(elements);
    } catch (error) {
        console.error('Error fetching elements with properties:', error);
        res.status(500).json({ error: 'Error fetching elements with properties' });
    }
}
exports.getElementsWithProperties = async (req, res) => {
    try {
        const elements = await Element.findAll({
            include: [
                {
                    model: ElementProperty,
                    as: 'properties', // Match the alias defined in the model association
                },
            ],
        });

        if (elements.length === 0) {
            return res.status(404).json({ message: 'No elements found' });
        }

        res.status(200).json(elements);
    } catch (error) {
        console.error('Error fetching elements with properties:', error);
        res.status(500).json({ error: 'Error fetching elements with properties' });
    }
};


exports.getElementsByCategory = async (req, res) => {
    console.log("before try in getElementsByCategory");
    try {
        console.log("before findAll");
        const elements = await Element.findAll(); // Fetching all elements from the database
        console.log("before res");
        console.log(elements);
        res.status(200).json(elements); // Return elements in JSON format with a 200 status
    } catch (error) {
        console.error('Error fetching elements:', error); // Log the error for debugging purposes
        res.status(500).json({ error: 'Error fetching elements' }); // Respond with a 500 error message
    }
};

exports.createElementProperty = async (req, res) => {
    console.log("before try in createElementProperty");
    try {
        console.log("before findAll");
        console.log("req",req.query);
        const jsonData =[
            {
              "elementId": 5,
              "propertyLabelName": "No",
              "propertyName": "iShuntID",
              "propertyType": "integer",
              "defaultValue": 1,
              "propertyValue": 1,
              "minValue": 1,
              "maxValue": 1000,
              "editable": 0,
              "isIncremental": 1,
              "orderProperties": 1
            },
            {
              "elementId": 5,
              "propertyLabelName": "Shunt Element Name",
              "propertyName": "sShuntName",
              "propertyType": "String",
              "defaultValue": "Shunt",
              "propertyValue": "Shunt",
              "minValue": 1,
              "maxValue": 100000,
              "editable": 0,
              "isIncremental": 1,
              "orderProperties": 2
            },
            {
              "elementId": 5,
              "propertyLabelName": "Busbar Name shunt is connected to",
              "propertyName": "sShuntBus",
              "propertyType": "String",
              "defaultValue": "Bus1",
              "propertyValue": "Bus1",
              "minValue": 1,
              "maxValue": 12,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 3
            },
            {
              "elementId": 5,
              "propertyLabelName": "Unit Number",
              "propertyName": "iUnitNo",
              "propertyType": "integer",
              "defaultValue": 1,
              "propertyValue": 1,
              "minValue": 1,
              "maxValue": 20,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 4
            },
            {
              "elementId": 5,
              "propertyLabelName": "Status",
              "propertyName": "iStatus",
              "propertyType": "Integer",
              "defaultValue": 1,
              "propertyValue": 1,
              "minValue": 0,
              "maxValue": 1,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 5
            },
            {
              "elementId": 5,
              "propertyLabelName": "Rating (MVA)",
              "propertyName": "fMVArating",
              "propertyType": "double",
              "defaultValue": 100,
              "propertyValue": 100,
              "minValue": 0.1,
              "maxValue": 100000,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 6
            },
            {
              "elementId": 5,
              "propertyLabelName": "Circuit Parameters in per unit based on",
              "propertyName": "scktBase",
              "propertyType": "string",
              "defaultValue": "COMMON",
              "propertyValue": "COMMON",
              "minValue": 0,
              "maxValue": 100000,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 7
            },
            {
              "elementId": 5,
              "propertyLabelName": "Resistance (p.u.)",
              "propertyName": "fR",
              "propertyType": "double",
              "defaultValue": 0,
              "propertyValue": 0,
              "minValue": 0,
              "maxValue": 100000,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 8
            },
            {
              "elementId": 5,
              "propertyLabelName": "Reactance (p.u.)",
              "propertyName": "fX",
              "propertyType": "double",
              "defaultValue": 0,
              "propertyValue": 0,
              "minValue": 0,
              "maxValue": 100000,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 9
            },
            {
              "elementId": 5,
              "propertyLabelName": "Susceptance (p.u.)",
              "propertyName": "fB",
              "propertyType": "double",
              "defaultValue": 1,
              "propertyValue": 1,
              "minValue": 0,
              "maxValue": 100000,
              "editable": 1,
              "isIncremental": 0,
              "orderProperties": 10
            }
          ]
          ;
          console.log("jsonData",jsonData.length);
        // const elements = await ElementProperty.create({
        //     elementId: req.query.elementId,
        //     propertyName: req.query.propertyName,
        //     propertyValue: req.query.propertyValue,
        //     propertyType: req.query.propertyType,
        //     propertyLabelName: req.query.propertyLabelName
        //   }); // Fetching all elements from the database

        const elements = await ElementProperty.bulkCreate(jsonData);
        console.log("before res");
        console.log(elements);
        res.status(200).json(elements); // Return elements in JSON format with a 200 status
    } catch (error) {
        console.error('Error fetching elements:', error); // Log the error for debugging purposes
        res.status(500).json({ error: 'Error fetching elements' }); // Respond with a 500 error message
    }
};


