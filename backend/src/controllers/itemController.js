const Item = require('../models/itemModel');

// Get all items with prices
exports.getAllItems = async (req, res) => {
    try {
        const items = await Item.find(); // Fetch all items
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Add a new item (Optional)
exports.addItem = async (req, res) => {
    try {
        const { name, price } = req.body;
        const newItem = new Item({ name, price });
        await newItem.save();
        res.status(201).json({ message: "Item added successfully", item: newItem });
    } catch (error) {
        res.status(500).json({ error: "Failed to add item" });
    }
};
