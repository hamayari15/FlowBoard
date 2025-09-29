const express = require('express');
const Router = express.Router();

const boardController = require('../controllers/board.controller');


Router.post('/Add', boardController.addBoard);

Router.get('/getAll', boardController.getAll);

Router.get('/getById/:id', boardController.getById);

Router.get('/getByProject/:id', boardController.getByProject);

Router.Update('/Update/:id', boardController.Update);

Router.delete('/Delete/:id', boardController.Delete);


module.exports = Router;