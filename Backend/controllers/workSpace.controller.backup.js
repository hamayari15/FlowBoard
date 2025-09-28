const workSpace = require("../models/Workspace");
const User = require("../models/User");

const { sendEmail, sendInvitationEmail } = require("../services/email");


exports.Add = async (req, res) => {
  try {
    const { name, description, owner, members } = req.body;

    if (!name || !owner) {
      return res.status(400).json({ message: "Name and owner are required !" });
    }

    const newWorkSpace = new workSpace({
      name,
      description,
      owner,
      members: members || [],
    });

    const ownerExists = await User.findById(owner);
    if (!ownerExists) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const duplicate = await workSpace.findOne({ name: name.trim(), owner });
    if (duplicate) {
      return res.status(409).json({ message: "Workspace name already exists !" });
    }

    const savedWorkSpace = await newWorkSpace.save();
    res.status(201).json(savedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error creating workspace", err });
  }
};


exports.inviteMember = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { email } = req.body;

    const wSpace = await workSpace.findById(workspaceId).populate("members");
    if (!wSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const user = await User.findOne({ email });

    if (user) {
      if (!wSpace.members.some(m => m._id.equals(user._id))) {
        wSpace.members.push(user._id);
        await wSpace.save();
      }

      await sendEmail(
        email,
        `Added to workspace ${wSpace.name}`,
        `<p style="color: green;">You were added to <b>${wSpace.name}</b>. <a href="http://localhost:4200/login">Login here</a></p>`
      );

      return res.status(200).json({ message: "User added to workspace and notified." });
    } else {
      await sendEmail(
        email,
        `Invitation to workspace ${wSpace.name}`,
        `<p>You’ve been invited to <b>${wSpace.name}</b>. <a href="http://localhost:4200/register?wsId=${wSpace._id}">Sign up here</a></p>`
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
    const workSpaces = await workSpace.find().populate("owner").populate("members");
    res.status(200).json(workSpaces);

  } catch (err) {
    res.status(500).json({ message: "Error fetching workSpaces", err });
  }
};  


exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const wSpace = await workSpace.findById(id).populate("owner").populate("members");

    if (!wSpace) {
      res.status(404).json({ message: "workSpace not found" });
    }
    res.status(200).json(wSpace);

  } catch (err) {
    res.status(500).json({ message: "Error fetching workSpace", err });
  }
};


exports.Update = async (req, res) => {
  try {
    const id = req.params.id;
    const newData = req.body;

    updatedWorkSpace = await workSpace.findByIdAndUpdate(id, newData, {new: true});

    if (!updatedWorkSpace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // const duplicate = await workSpace.findOne({ name: name.trim(), owner });
    // if (duplicate) {
    //   return res.status(409).json({ message: "Workspace name already exists !" });
    // }
    
    res.status(200).json(updatedWorkSpace);

  } catch (err) {
    res.status(500).json({ message: "Error updating workSpace" });
  }
};


exports.Delete = async (req, res) => {
  try {
    const id = req.params.id;
    deletedWorkSpace = await workSpace.findByIdAndDelete(id);

    if (!deletedWorkSpace) {
      return res.status(404).json({ message: "workSpace not found" });
    }
    res.status(200).json(deletedWorkSpace);
    
  } catch (err) {
    res.status(500).json({ message: "Error deleting workSpace" });
  }
};
