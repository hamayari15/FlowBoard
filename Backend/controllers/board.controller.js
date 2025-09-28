const Board = require('../models/Board');
const Project = require('../models/Project');


exports.createBoard = async (req, res) => {
  try {
    const { name, description, projectId } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({ message: "Board name and project are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const board = new Board({
      name: name.trim(),
      description,
      project: projectId,
      columns: [
        { name: "To Do", order: 1 },
        { name: "In Progress", order: 2 },
        { name: "Done", order: 3 }
      ]
    });

    const savedBoard = await board.save();
    res.status(201).json(savedBoard);

  } catch (err) {
    console.error("Error creating board:", err);
    res.status(500).json({ message: "Failed to create board" });
  }
};