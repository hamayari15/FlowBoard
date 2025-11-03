const express = require('express');
const Router = express.Router();

const taskController = require('../controllers/task.controller');


Router.post('/Add', taskController.createTask);

Router.get('/getByProject/:projectId', taskController.getByProject);

Router.get('/getUnassigned/:projectId', taskController.getUnassignedTasks);

Router.get('/getById/:id', taskController.getById);

Router.get('/getByBoard/:boardId', taskController.getByBoard);

Router.put('/Update/:id', taskController.Update);

Router.delete('/Delete/:id', taskController.Delete);

Router.patch('/updatePosition/:id', taskController.updatePosition);

Router.patch('/assignToBoard/:taskId', taskController.assignToBoard);

Router.patch('/removeFromBoard/:taskId', taskController.removeFromBoard);

Router.patch('/moveToBoard/:taskId', taskController.moveToBoard);

Router.post('/bulkUpdatePositions', taskController.bulkUpdatePositions);


module.exports = Router;