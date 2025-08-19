const workSpace = require('../models/Workspace');


exports.Add = async (req, res) => {
    
    try {
        const { name, description, owner, members } = req.body;

        if(!name || !owner) {
            return res.status(400).json({message: "Name and owner are required !"})
        }

        const newWorkSpace = new workSpace ({
            name, 
            description,
            owner,
            members
        })

        const savedWorkSpace = await newWorkSpace.save()
        res.status(201).json(savedWorkSpace)

    } catch (err) {
        res.status(500).json({ message: "Error creating workspace", err });
    }
}

exports.getAll = async (req, res) => {

    try {

        const workSpaces = await workSpace.find()
        res.status(200).json(workSpaces)

    } catch(err) {
        res.status(500).json({message: "Error fetching workSpaces", err})
    }
} 