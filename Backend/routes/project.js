const express = require('express');
const Router = express.Router();

const projectController = require('../controllers/project.controller');


Router.post('/Add', projectController.createProject);

Router.post('/:id/addMember', projectController.inviteMember)

Router.post('/:id/bulkInvite', projectController.bulkInviteMembers)

Router.get('/getAll', projectController.getAll);

Router.get('/getById/:id', projectController.getById);

Router.get('/getByWorkspace/:workspaceId', projectController.getByWorkspace);

Router.put('/Update/:id', projectController.Update);

Router.patch('/Archive/:id', projectController.Archive);

Router.delete('/Delete/:id', projectController.Delete);


module.exports = Router;