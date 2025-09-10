const express = require('express');
const app = express();

app.use(express.json())

const cors = require('cors')
app.use(cors())

require('./config/connect')

require('dotenv').config()


const userRouter = require('./routes/user')
const workSpaceRouter = require('./routes/workSpace')
const projectRouter = require('./routes/project')
const testEmailRouter = require('./routes/testEmail');

app.use('/userRouter', userRouter)
app.use('/workSpaceRouter', workSpaceRouter)
app.use('/projectRouter', projectRouter)
app.use('/testEmail', testEmailRouter);


app.use('/getImages', express.static('uploads'))


app.listen('3000', () => {
    console.log("Server works !")
});