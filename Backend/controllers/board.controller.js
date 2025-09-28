const Board = require('../models/Board');


exports.addBoard = async (req, res) => {
    try {
        
    } catch (err) {
        res.status(500).json({ message: "Error creating board", error: err.message });
    }
}