const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');


exports.createTask = async (req, res) => {
  try {
    const { title, description, board, project, status, assignee, priority, labels, dueDate } = req.body;
    const userId = req.user?.id || req.body.createdBy;

    if (!title || !project) {
      return res.status(400).json({ message: "Task title and project are required" });
    }

    const taskStatus = status || 'to-do';
    const highestPositionTask = await Task.findOne({ project, board: null }).sort({ position: -1 });
    const position = highestPositionTask ? highestPositionTask.position + 1 : 0;

    const task = new Task({
      title: title.trim(),
      description,
      project,
      board: board || null,
      status: taskStatus,
      position,
      assignee: assignee || null,
      createdBy: userId,
      priority: priority || 'medium',
      labels: labels || [],
      dueDate: dueDate || null,
    });

    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('board', 'name')
      .populate('project', 'name');

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
};

exports.getByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('board', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks by project", error: err.message });
  }
};

exports.getUnassignedTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ project: projectId, board: null })
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching unassigned tasks", error: err.message });
  }
};

exports.assignToBoard = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { boardId } = req.body;

    if (!boardId) {
      return res.status(400).json({ message: "Board ID is required" });
    }

    const boardExists = await Board.findById(boardId);
    if (!boardExists) {
      return res.status(404).json({ message: "Board not found" });
    }

    const highestPositionTask = await Task.findOne({ board: boardId }).sort({ position: -1 });
    const newPosition = highestPositionTask ? highestPositionTask.position + 1 : 0;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { board: boardId, position: newPosition },
      { new: true }
    )
    .populate('assignee', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('board', 'name')
    .populate('project', 'name');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error assigning task to board", error: err.message });
  }
};

exports.removeFromBoard = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { board: null, position: 0, status: 'to-do' },
      { new: true }
    )
    .populate('assignee', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('project', 'name');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error removing task from board", error: err.message });
  }
};

exports.moveToBoard = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { boardId, position } = req.body;

    if (!boardId) {
      return res.status(400).json({ message: "Board ID is required" });
    }

    const boardExists = await Board.findById(boardId);
    if (!boardExists) {
      return res.status(404).json({ message: "Board not found" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { board: boardId, position: position || 0 },
      { new: true }
    )
    .populate('assignee', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('board', 'name')
    .populate('project', 'name');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error moving task to board", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId)
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error fetching task", error: err.message });
  }
};

exports.getByBoard = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const tasks = await Task.find({ board: boardId })
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('board', 'name')
      .populate('project', 'name')
      .sort({ position: 1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks by board", error: err.message });
  }
};

exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true })
      .populate('board', 'name description')
      .populate('assignee', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('project', 'name');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
};

exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
};

exports.updatePosition = async (req, res) => {
  try {
    const id = req.params.id;
    const { position } = req.body;

    if (position === undefined || position === null) {
      return res.status(400).json({ message: "Position is required" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { position },
      { new: true }
    )
    .populate('assignee', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName email avatar')
    .populate('project', 'name');

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error updating task position", error: err.message });
  }
};

exports.bulkUpdatePositions = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: "Tasks array is required" });
    }

    const bulkOps = tasks.map(task => ({
      updateOne: {
        filter: { _id: task.id },
        update: { 
          position: task.position,
          ...(task.status && { status: task.status })
        }
      }
    }));

    await Task.bulkWrite(bulkOps);
    res.status(200).json({ message: "Task positions updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating task positions", error: err.message });
  }
};