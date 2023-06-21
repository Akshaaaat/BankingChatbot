const mongoose = require('mongoose')

const systemLogsSchema = new mongoose.Schema({
    status:{
        type: String,
        required: true
    }
}, {strict: false})

module.exports = mongoose.model('SystemLogs', systemLogsSchema)