const express = require('express');
const { getAllItems, addItem } = require('../controllers/itemController');

const router = express.Router();

router.get('/price', getAllItems);  // Get all items with prices
router.post('/price', addItem); // Add new item (optional)

module.exports = router;
