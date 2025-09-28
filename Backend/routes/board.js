const express = require('express');
const Router = express.Router();

const boardController = require('../controllers/board.controller');


Router.post('/Add', boardController.addBoard);

Router.get('/getAll', boardController.getAll);

Router.get('/getById', boardController.getById);

// Router.post('/Add', boardController.addBoard);

// Router.post('/Add', boardController.addBoard);

// Router.post('/Add', boardController.addBoard);



module.exports = Router;