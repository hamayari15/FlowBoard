const express = require('express');
const app = express();

require('dotenv').config()
require('./config/connect')

app.use(express.json())

const cors = require('cors')
app.use(cors())



const userRouter = require('./routes/user')
const workSpaceRouter = require('./routes/workSpace')
const projectRouter = require('./routes/project')
const boardRouter = require('./routes/board')
const taskRouter = require('./routes/task')
const commentRouter = require('./routes/comment')

app.use('/userRouter', userRouter)
app.use('/workSpaceRouter', workSpaceRouter)
app.use('/projectRouter', projectRouter)
app.use('/boardRouter', boardRouter)
app.use('/taskRouter', taskRouter)
app.use('/commentRouter', commentRouter)

app.use('/getImages', express.static('uploads'))


app.listen('3000', () => {
    console.log("Server works !")
});