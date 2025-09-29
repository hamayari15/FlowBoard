const express = require('express');
const app = express();

require('./config/connect')

app.use(express.json())

const cors = require('cors')
app.use(cors())

require('dotenv').config()


const userRouter = require('./routes/user')
const workSpaceRouter = require('./routes/workSpace')
const projectRouter = require('./routes/project')
const boardRouter = require('./routes/board')

app.use('/userRouter', userRouter)
app.use('/workSpaceRouter', workSpaceRouter)
app.use('/projectRouter', projectRouter)
app.use('/boardRouter', boardRouter)

app.use('/getImages', express.static('uploads'))


app.listen('3000', () => {
    console.log("Server works !")
});