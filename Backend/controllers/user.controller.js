const User = require("../models/User");

const workSpace = require("../models/Workspace");
const Project = require("../models/Project");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    const { userName, firstName, lastName, email, password, wsId, projectId } = req.body;
    
    const usr = new User({
      userName, 
      firstName, 
      lastName, 
      email, 
      password
    });

    const salt = await bcrypt.genSalt(10);
    const cryptedPassword = await bcrypt.hash(usr.password, salt);
    usr.password = cryptedPassword;
    
    const registredUser = await usr.save();

    if (wsId) {
      const workspace = await workSpace.findById(wsId);
      workspace.members.push(registredUser._id);
      await workspace.save();
    }

    if (projectId) {
      const project = await Project.findById(projectId).populate('workspace');
      project.members.push(registredUser._id);
      await project.save();
      
      const workspace = await workSpace.findById(project.workspace._id);
      workspace.members.push(registredUser._id);
      await workspace.save();
    }
    
    res.status(201).json(registredUser);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const data = req.body;
    const user = await User.findOne({ email: data.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { 
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ myToken: token });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
