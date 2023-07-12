const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    transactionId:{
        type: String,
        required: true
    },
    fromEmail:{
        type: String,
        required: true
    },
    toEmail:{
        type: String,
        required: true
    },
    fromBank:{
        type: String,
        required:true
    },
    toBank:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    date:{
        type: String
    }
})

module.exports = mongoose.model('Transactions', transactionSchema)