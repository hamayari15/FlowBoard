const express = require('express');
const Router = express.Router();

const workSpaceController = require('../controllers/workSpace.controller');


Router.post('/Add', workSpaceController.Add)

Router.post('/:id/addMember', workSpaceController.inviteMember)

Router.get('/getAll', workSpaceController.getAll)

Router.get('/getById/:id', workSpaceController.getById)

Router.put('/Update/:id', workSpaceController.Update)

Router.delete('/Delete/:id', workSpaceController.Delete)


module.exports = Router;