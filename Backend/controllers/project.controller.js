const Project = require("../models/Project");


exports.Add = async (req, res) => {
  try {
    const { name, description, workspace, owner, members, status } = req.body;

    if (!name || !workspace || !owner) {
      return res.status(400).json({ message: "Name, workspace, and owner are required!" });
    }

    const newProject = new Project({
      name,
      description,
      workspace,
      owner,
      members,
      status,
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);

  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
};


exports.getAll = async (req, res) => {
  try {
    const projects = await Project.find({ isArchived: false })
      .populate("owner", "name email")
      .populate("members", "name email");
    res.status(200).json(projects);

  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
};


exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findById(id)
      .populate("workspace", "name description")
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);

  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
};


exports.getByWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
    })
    .populate("owner", "name email")
    .populate("members", "name email");

    res.status(200).json(projects);

  } catch (err) {
    res.status(500).json({message: "Error fetching projects by workspace", error: err.message});
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    const updatedProject = await Project.findByIdAndUpdate(id, newData, {new: true});

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(updatedProject);

  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
};


exports.Archive = async (req, res) => {
  try {
    const id = req.params.id;

    const archivedProject = await Project.findByIdAndUpdate(id,{ isArchived: true },{ new: true });

    if (!archivedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project archived successfully", archivedProject });

  } catch (err) {
    res.status(500).json({ message: "Error archiving project", error: err.message });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully", deletedProject });

  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
};
