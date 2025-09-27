const Project = require("../models/Project");
const User = require("../models/User");
const Workspace = require("../models/Workspace");

const { sendEmail, sendInvitationEmail } = require("../services/email");


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


exports.inviteMember = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email } = req.body;

    const project = await Project.findById(projectId).populate("members workspace");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const user = await User.findOne({ email });

    if (user) {
      if (!project.members.some(m => m._id.equals(user._id))) {
        project.members.push(user._id);
        await project.save();
      }

      const workspace = await Workspace.findById(project.workspace._id);
      if (!workspace.members.some(m => m.equals(user._id))) {
        workspace.members.push(user._id);
        await workspace.save();
      }

      await sendEmail(
        email,
        `Added to project ${project.name}`,
        `<p style="color: green;">You were added to <b>${project.name}</b>. <a href="http://localhost:4200/login">Login here</a></p>`
      );

      return res.status(200).json({ message: "User added to project and workspace, notification sent." });
    } else {
      await sendEmail(
        email,
        `Invitation to project ${project.name}`,
        `<p>You’ve been invited to <b>${project.name}</b>. <a href="http://localhost:4200/register?projectId=${project._id}">Sign up here</a></p>`
      );

      return res.status(200).json({ message: "Invitation sent. User must sign up first." });
    }

  } catch (err) {
    console.error("Error inviting user:", err);
    res.status(500).json({ message: "Error inviting user", err });
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
