const express = require('express')

const app = express()

app.use(express.json())

require('./config/connect')

require('dotenv').config();


const userRouter = require('./routes/user')
app.use('/userRouter', userRouter)

app.use('/getImages', express.static('./uploads'))


app.listen('3000', () => {
    console.log("Server works !")
})