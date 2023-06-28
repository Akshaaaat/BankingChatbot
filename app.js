const express= require('express')
const connectToDb=require('./db')
const auth=require('./routes/auth')
const transactions = require('./routes/transaction')
require('dotenv').config()
const port= 3000;
const cors = require('cors')
const app = express()
app.use(express.json())
app.use(cors())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    //res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

app.get('/', (req, res)=>{
    res.send('Welcome to the Wolf Pack')
})

app.use('/api/auth', auth)
app.use('/api/transactions', transactions)

const start = async () =>{
    try {
        await connectToDb(process.env.MONGO_URI)
        app.listen(port, console.log( `Listening on PORT ${port} `))
    } catch (error) {
        console.log(err)
    }
}

start()