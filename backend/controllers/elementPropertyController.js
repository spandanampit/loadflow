const ElementProperty = require('../models/ElementProperty');



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