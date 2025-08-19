const express = require('express');
const Router = express.Router();

const projectController = require('../controllers/project.controller');

Router.post('/Add', projectController.Add);

Router.get('/getAll', projectController.getAll);

Router.get('/getById/:id', projectController.getById);

Router.get('/getByWorkspace/:workspaceId', projectController.getByWorkspace);

Router.put('/Update/:id', projectController.Update);

Router.put('/Archive/:id', projectController.Archive);

Router.delete('/Delete/:id', projectController.Delete);

module.exports = Router;