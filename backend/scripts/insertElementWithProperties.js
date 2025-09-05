const db = require('../database/dbConfig');
const Element = require('../models/Element');
const ElementProperty = require('../models/ElementProperty');

// Function to insert Element and ElementProperty
async function insertElementWithProperties() {
    try {
        // Sync database (ensure tables exist)
        await db.sync();

        // Insert a new element
        const newElement1 = await Element.create({
            name: 'AVIEMORE-221',
            category: 'Bus',
            svgPath: '/assets/svg/BusVertical.svg' // Example path to an SVG file
        });

        // Insert corresponding element properties
        const newProperties = await ElementProperty.create({
            elementId: newElement1.id, // Link the properties to the newly created element
            sBusName: 'AVIEMORE-221',
            iAreaNo: 8,
            iStatus: 1,
            fBuskV: 220,
            fVmagPU: 1,
            fVangDeg: 0
        });

        console.log('Element and properties added successfully');
    } catch (error) {
        console.error('Error adding element and properties:', error);
    }
}

// Execute the function to insert data
insertElementWithProperties();
