const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/flowBoard')
    .then(
        () => {
            console.log("Connected to DB");
        }
    ).catch(
        (err) => {
            console.log("Error connecting to DB", err)
        }
    )

module.exports = mongoose;