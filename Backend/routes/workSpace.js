const express = require('express')
const Router = express.Router()

const workSpaceController = require('../controllers/workSpace.controller')


Router.post('/Add', workSpaceController.Add)

Router.get('/getAll', workSpaceController.getAll)


module.exports = Router