const express = require('express');
const Router = express.Router();

const boardController = require('../controllers/board.controller');


Router.post('/Add', boardController.createBoard);

Router.get('/getById/:id', boardController.getById);

Router.get('/getByProject/:projectId', boardController.getByProject);

Router.get('/getMembersByBoardId/:id/members', boardController.getMembersByBoardId);

Router.put('/Update/:id', boardController.Update);

Router.delete('/Delete/:id', boardController.Delete);


module.exports = Router;