const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URl)
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