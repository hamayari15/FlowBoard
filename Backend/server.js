const express = require('express')
const app = express()

app.use(express.json())

const cors = require('cors')
app.use(cors())

require('./config/connect')

require('dotenv').config();


const userRouter = require('./routes/user')
app.use('/userRouter', userRouter)
const workSpaceRouter = require('./routes/workSpace')
app.use('/workSpaceRouter', workSpaceRouter)

app.use('/getImages', express.static('uploads'))


app.listen('3000', () => {
    console.log("Server works !")
})