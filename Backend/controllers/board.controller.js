const Board = require('../models/Board');
const Project = require('../models/Project');


exports.createBoard = async (req, res) => {
  try {
    const { name, description, project, projectId, columns, startDate, endDate, goal, status } = req.body;
    
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

    const boardData = {
      name: name.trim(),
      description,
      project: actualProjectId,
      columns: defaultColumns
    };

    // Add sprint-specific fields if provided
    if (startDate) {
      console.log('Setting startDate:', startDate);
      boardData.startDate = startDate;
    }
    if (endDate) {
      console.log('Setting endDate:', endDate);
      boardData.endDate = endDate;
    }
    if (goal) boardData.goal = goal;
    if (status) boardData.status = status;

    console.log('Creating board with data:', boardData);
    const board = new Board(boardData);

    const savedBoard = await board.save();
    console.log('Board/Sprint created successfully:', savedBoard);
    res.status(201).json(savedBoard);

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
    res.status(500).json({ message: "Error fetching board", error: err.message });
  }
};


exports.getMembersByBoardId = async (req, res) => {
  try {
    const boardId = req.params.id;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const project = await Project.findById(board.project).populate('members', 'firstName lastName email');
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project.members);

  } catch (err) {
    console.error('Error fetching members by board:', err);
    res.status(500).json({ message: "Failed to fetch project members", error: err.message });
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
    res.status(500).json({ message: "Error updating board", error: err.message });
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
    res.status(500).json({ message: "Error Deleting Board", error: err.message });
  }
};


// Sprint-specific functionality
exports.getActiveSprints = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const activeSprints = await Board.find({ 
      project: projectId, 
      status: 'active' 
    }).sort({ startDate: -1 });
    
    res.status(200).json(activeSprints);
  } catch (err) {
    console.error('Error fetching active sprints:', err);
    res.status(500).json({ message: "Error fetching active sprints", error: err.message });
  }
};


exports.getSprintsByStatus = async (req, res) => {
  try {
    const { projectId, status } = req.params;
    const query = { project: projectId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const sprints = await Board.find(query).sort({ createdAt: -1 });
    res.status(200).json(sprints);
  } catch (err) {
    console.error('Error fetching sprints by status:', err);
    res.status(500).json({ message: "Error fetching sprints", error: err.message });
  }
};


exports.completeSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const updatedSprint = await Board.findByIdAndUpdate(
      sprintId, 
      { status: 'completed' }, 
      { new: true }
    );
    
    if (!updatedSprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }
    
    res.status(200).json(updatedSprint);
  } catch (err) {
    console.error('Error completing sprint:', err);
    res.status(500).json({ message: "Error completing sprint", error: err.message });
  }
};


exports.startSprint = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const updatedSprint = await Board.findByIdAndUpdate(
      sprintId, 
      { status: 'active', startDate: new Date() }, 
      { new: true }
    );
    
    if (!updatedSprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }
    
    res.status(200).json(updatedSprint);
  } catch (err) {
    console.error('Error starting sprint:', err);
    res.status(500).json({ message: "Error starting sprint", error: err.message });
  }
};


exports.getSprintStats = async (req, res) => {
  try {
    const sprintId = req.params.id;
    const Task = require('../models/Task');
    
    const sprint = await Board.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }
    
    const tasks = await Task.find({ board: sprintId });
    
    const stats = {
      total: tasks.length,
      toDo: tasks.filter(t => t.status === 'to-do').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      inReview: tasks.filter(t => t.status === 'in-review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
      sprint: sprint
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching sprint stats:', err);
    res.status(500).json({ message: "Error fetching sprint statistics", error: err.message });
  }
};