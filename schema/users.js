const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    pwd:{
        type: String,
        required: true
    },
    bankBalance:{
        type: Number,
        default: 0
    },
    bankAccountNumber:{
        type: String
    },
    pin:{
        type: String
    }
})
module.exports = mongoose.model('BankUser', userSchema)