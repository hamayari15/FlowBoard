const workSpace = require('../models/Workspace');


exports.Add = async (req, res) => {
    
    try {

        const { name, description, owner, members } = req.body

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
        res.status(500).json({ message: "Error creating workspace", err })
    }
};



exports.getAll = async (req, res) => {

    try {

        const workSpaces = await workSpace.find()
        res.status(200).json(workSpaces)

    } catch(err) {
        res.status(500).json({message: "Error fetching workSpaces", err})
    }
};



exports.getById = async (req, res) => {

    try {

        const id = req.params.id
        const wSpace = await workSpace.findById(id)

        if(!wSpace) {
            res.status(404).json({message: 'workSpace not found'})
        }
        res.status(200).json(wSpace)

    } catch (err) {
        res.status(500).json({message: "Error fetching workSpace", err})
    }
};



exports.Update = async (req, res) => {

    try {

        const id = req.params.id
        const newData = req.body

        updatedWorkSpace = await workSpace.findByIdAndUpdate(id, newData, {new: true})

        if (!updatedWorkSpace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.status(200).json(updatedWorkSpace)

    } catch (err) {
        res.status(500).json({message: "Error updating workSpace"})
    }
};



exports.Delete = async (req, res) => {

    try {
        
        const id = req.params.id
        deletedWorkSpace = await workSpace.findByIdAndDelete(id)
        
        if (!deletedWorkSpace) {
            return res.status(404).json({ message: "workSpace not found" });
        }
        res.status(200).json(deletedWorkSpace)

    } catch (err) {
        res.status(500).json({message: "Error deleting workSpace"})
    }
};