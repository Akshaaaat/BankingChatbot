const express=require('express')
const bcrypt= require("bcrypt")
const jwt=require('jsonwebtoken')
require('dotenv').config()
const BankUser=require('../schema/users')
const Transactions= require('../schema/transaction')
const fetchuser= require('../middleware/fetchuser')
const router= express.Router()

let randomGenerator = (n) => {
    let res = Math.floor(Math.random()*Math.pow(10, n))+1
    res = String(res)
    while(res.length<n)
        res = res+String(Math.floor(10*Math.random())+1)
    return res
}

const stringdate = () =>{
    const currentDate = new Date();
    const date = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear().toString().slice(-2);
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0'); 
    return `${date}:${month}:${year} ${hours}:${minutes}`;
}

router.post('/transfer', fetchuser, async (req, res)=>{
    try {
        const {toEmail, amount}=req.body
        const userId=req.userId
        const username= await BankUser.findById(userId)
        if(amount<0)
            return res.status(404).send({"err": "Amount Should be Positive"})
        if(!username)
            return res.status(404).send({"err": "User not found"})

        const recipient = await BankUser.findOne({
            $or: [ { email: toEmail }, { bankAccountNumber: toEmail }]
        })
       
        if(!recipient)
        return res.status(404).send({"err": "Recipient with the given credentials not found"})
        
        if(username.bankBalance<amount)
        return res.status(401).json({"err": "Insufficient bank balance"})
        
        const deductMoney = await BankUser.findByIdAndUpdate(userId, {bankBalance: username.bankBalance-amount})
        if(!deductMoney)
            return res.status(401).send({"err": "Transaction Failed. Money has not been deducted"})

        const recievedMoney = await BankUser.findOneAndUpdate({
            $or: [ { email: toEmail }, { bankAccountNumber: toEmail }]
        }, {
            bankBalance: recipient.bankBalance+amount
        })

        if(!recievedMoney){
            return res.status(401).send({"err": "Money deducted but can't be credited to the given account"})
        } 
        
        const tranId = randomGenerator(15)
        let newTransaction = await Transactions.create({
            transactionId: tranId,
            fromEmail: username.email,
            toEmail: recipient.email,
            fromBank: username.bankAccountNumber,
            toBank: recipient.bankAccountNumber,
            amount ,
            date: stringdate()
        })
        return res.status(201).json({newTransaction})
    } catch (error) {
        return res.status(400).send({"err": "Internal Server Error"})
    }  
})

router.post('/addmoney', fetchuser, async (req, res)=>{
    try {
        const {amount}=req.body
        const userId=req.userId
        const username= await BankUser.findById(userId)
        if(amount<0)
            return res.status(404).json({"err": "Send Positive Amount"})
        if(!username)
            return res.status(404).send({"err": "User Not Found"})
            const deductMoney = await BankUser.findByIdAndUpdate(userId, {bankBalance: username.bankBalance+amount})
            if(!deductMoney)
            return res.status(401).json({"err": "Transaction Failed"}) 
        
        const tranId = randomGenerator(16)
        let newTransaction = await Transactions.create({
            transactionId: tranId,
            fromEmail: "N.A.",
            toEmail: username.email,
            fromBank: "-",
            toBank: username.bankAccountNumber,
            amount
        })
        return res.status(201).json({newTransaction})
    } catch (error) {
        return res.status(400).send({"err": 'Internal Server Error'})
    }  
})

router.get('/list', fetchuser, async (req, res)=>{
    try {
        const userId = req.userId
        const bankuser= await BankUser.findById(userId)
        const email = bankuser.email
        let logList  = await Transactions.find({
            $or: [
                { fromEmail: email },
                { toEmail: email }
            ]
        })
        if(!logList){
            SystemLogs.create({
                "status": "err",
                "action": "Get Transaction Logs",
                "message": "Logs Not Found",
                req
            })
            return res.status(404).send({err: "Logs Found'nt"})
        }
        
        if(req.body.date){  //We filter out the data before this date
            var cutoff = new Date(Date.parse(req.body.date))
            
            logList = logList.filter((eee)=>{
                    return (cutoff<=eee.date)
                })
        }
        //This function return the upto 10 logs
        return res.status(200).send((logList.reverse()).slice(0, 10))
    } catch (error) {
        return res.status(401).json({"err": "Internal Server Error"})
    }
})

router.get('/getdetails', fetchuser, async (req, res)=>{
    try {
        const userId = req.userId
        const username = await BankUser.findById(userId).select('-pwd')
        
        if(!username){
            return res.status(400).json({"err": "Cannot Find User"})
        }
        return res.status(200).send(username)

    } catch (error) {
        return res.status(400).json({"err": "Internal Server Error"})
    }
})

module.exports=router