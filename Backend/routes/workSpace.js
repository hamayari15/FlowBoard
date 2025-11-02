const express = require('express');
const Router = express.Router();

const workSpaceController = require('../controllers/workSpace.controller');


Router.post('/Add', workSpaceController.createWorkSpace);

Router.post('/:id/addMember', workSpaceController.inviteMember);

Router.post('/:id/bulkInvite', workSpaceController.bulkInviteMembers);

Router.get('/getAll', workSpaceController.getAll);

Router.get('/getById/:id', workSpaceController.getById);

Router.get('/getWorkspaceStats/:id', workSpaceController.getWorkspaceStats);

Router.put('/Update/:id', workSpaceController.Update);

Router.delete('/Delete/:id', workSpaceController.Delete);


module.exports = Router;