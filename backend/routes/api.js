const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const elementController = require('../controllers/elementController');
const canvasController = require('../controllers/canvasController');

router.get('/items', itemsController.getItems);
router.post('/items', itemsController.createItem);

router.get('/elements', elementController.getElementsByCategory);
router.get('/elements-with-properties', elementController.getElementsWithProperties);


router.post('/create-properties',elementController.createElementProperty);

router.post('/saveCanvas',canvasController.storeCanvas);
router.get('/getAllCanvas',canvasController.getAllCanvas);

module.exports = router;
