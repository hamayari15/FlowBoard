const express = require('express');
const Router = express.Router();

const taskController = require('../controllers/task.controller');

Router.post('/Add', taskController.createTask);

Router.get('/getAll', taskController.getAll);

Router.get('/getById/:id', taskController.getById);

Router.get('/getByBoard/:boardId', taskController.getByBoard);

Router.put('/Update/:id', taskController.Update);

Router.delete('/Delete/:id', taskController.Delete);

Router.patch('/updatePosition/:id', taskController.updatePosition);

Router.patch('/assign/:id', taskController.assignTask);

Router.post('/bulkUpdatePositions', taskController.bulkUpdatePositions);

module.exports = Router;
