const db = require('../database/dbConfig');
const Elements = require('../models/Element');

const elementsData = [
    { name: 'Bus', category: 'Shunt', svgPath: '/svg/bus.svg' },
    { name: 'Generator', category: 'Shunt', svgPath: '/svg/generator.svg' },
    { name: 'Load', category: 'Shunt', svgPath: '/svg/load.svg' },
    { name: 'Induction Motor', category: 'Shunt', svgPath: '/svg/induction_motor.svg' },
    { name: 'Shunt Device', category: 'Shunt', svgPath: '/svg/shunt_device.svg' },
    { name: 'Filter', category: 'Shunt', svgPath: '/svg/filter.svg' },
    { name: 'Transmission Line', category: 'Series', svgPath: '/svg/transmission_line.svg' },
    { name: 'Two Winding Transformer', category: 'Series', svgPath: '/svg/transformer.svg' },
];

// Insert data
const insertElements = async () => {
    try {
        await db.sync(); // Ensure the DB is synced
        for (const element of elementsData) {
            await Elements.create(element);
        }
        console.log('Elements inserted successfully');
    } catch (error) {
        console.error('Error inserting elements:', error);
    }
};

insertElements();
