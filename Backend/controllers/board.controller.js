const Board = require('../models/Board');
const Project = require('../models/Project');


exports.createBoard = async (req, res) => {
  try {
    const { name, description, project, projectId, columns } = req.body;
    
    const actualProjectId = projectId || project;

    if (!name || !actualProjectId) {
      return res.status(400).json({ message: "Board name and project are required" });
    }

    const projectDoc = await Project.findById(actualProjectId);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    const defaultColumns = columns || [
      { name: "To Do", order: 0 },
      { name: "In Progress", order: 1 },
      { name: "In Review", order: 2 },
      { name: "Done", order: 3 }
    ];

    const board = new Board({
      name: name.trim(),
      description,
      project: actualProjectId,
      columns: defaultColumns
    });

    const savedBoard = await board.save();
    res.status(201).json(savedBoard);
    console.log('Board created successfully:', savedBoard);

  } catch (err) {
    console.error('Error creating board:', err);
    res.status(500).json({ message: "Failed to create board", error: err.message });
  }
};


exports.getById = async (req, res) => {
  try {
    const boardId = req.params.id;
    const board = await Board.findById(boardId).populate('project', 'name description');

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }
    res.status(200).json(board);

  } catch (err) {
    res.status(500).json({ message: "Error fetching board", err });
  }
};


exports.getByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const boards = await Board.find({ project: projectId }).populate('project', 'name description');
    res.status(200).json(boards);

  } catch (err) {
    res.status(500).json({ message: "Error fetching boards by project", err });
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    const updatedBoard = await Board.findByIdAndUpdate(id, newData, { new: true });
    if (!updatedBoard) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.status(200).json(updatedBoard);

  } catch (err) {
    res.status(500).json({ message: "Error updating board", err });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedBoard = await Board.findByIdAndDelete(id);

    if (!deletedBoard) {
      return res.status(404).json({ message: "Board not found" });
    }
    res.status(200).json(deletedBoard);

  } catch (err) {
    res.status(500).json({ message: "Error Deleting Board", err });
  }
};