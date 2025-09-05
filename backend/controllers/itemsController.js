const Item = require('../models/item');

exports.getItems = async (req, res) => {
    try {
        const items = await Item.findAll();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, value } = req.body;
        const newItem = await Item.create({ name, value });
        res.json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};
