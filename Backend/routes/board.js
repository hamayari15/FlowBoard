const express = require('express');
const Router = express.Router();

const boardController = require('../controllers/board.controller');


Router.post('/Add', boardController.createBoard);

Router.get('/getById/:id', boardController.getById);

Router.get('/getMembersByBoardId/:id/members', boardController.getMembersByBoardId);

Router.put('/Update/:id', boardController.Update);

Router.delete('/Delete/:id', boardController.Delete);

// Sprint-specific routes
Router.get('/active/:projectId', boardController.getActiveSprints);

Router.get('/status/:projectId/:status', boardController.getSprintsByStatus);

Router.put('/complete/:id', boardController.completeSprint);

Router.put('/start/:id', boardController.startSprint);

Router.get('/stats/:id', boardController.getSprintStats);


module.exports = Router;