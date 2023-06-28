const express=require('express')
const bcrypt= require("bcrypt")
const jwt=require('jsonwebtoken')
require('dotenv').config()
const BankUser=require('../schema/users')
const SystemLogs = require('../schema/systemlogs')
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

router.post('/transfer', fetchuser, async (req, res)=>{
    try {
        const {toEmail, amount}=req.body
        const userId=req.userId
        const username= await BankUser.findById(userId)
        if(amount<0)
            return res.status(404).json({"err": "One should send a positive amount (where positive means any number greater than zero"})
        if(!username)
            return res.status(404).send({"err": "user not found"})

        const recipient = await BankUser.findOne({email: toEmail})
        if(!recipient)
        return res.status(404).send({"err": "Recipient with the given credentials not found"})
        
        if(username.bankBalance<amount)
        return res.status(401).json({"err": "Insufficient bank balance"})
        
        const deductMoney = await BankUser.findByIdAndUpdate(userId, {bankBalance: username.bankBalance-amount})
        if(!deductMoney)
            return res.status(401).json({"err": "Error occured. Money has not been deducted"})

        const recievedMoney = await BankUser.findOneAndUpdate({email: toEmail}, {bankBalance: recipient.bankBalance+amount})
        if(!recievedMoney){
            console.log('Couldnt transfer money to the given account...However money has been deducted')
            return res.status(401).json({"err": "Money deducted but can't be credited to the given account"})
        } 
        
        const tranId = randomGenerator(15)

        let newTransaction = await Transactions.create({
            transactionId: tranId,
            fromEmail: username.email,
            toEmail: toEmail,
            fromBank: username.bankAccountNumber,
            toBank: recipient.bankAccountNumber,
            amount
        })
        return res.status(201).json({newTransaction})
    } catch (error) {
        return res.status(400).send('Internal Server Error')
    }  
})

router.post('/addmoney', fetchuser, async (req, res)=>{
    try {
        const {amount}=req.body
        const userId=req.userId
        const username= await BankUser.findById(userId)
        if(amount<0)
            return res.status(404).json({"err": "One should send a positive amount (where positive means any number greater than zero"})
        if(!username)
            return res.status(404).send({"err": "user not found"})
            const deductMoney = await BankUser.findByIdAndUpdate(userId, {bankBalance: username.bankBalance+amount})
            if(!deductMoney)
            return res.status(401).json({"err": "Error occured. Money has not been deducted"}) 
        
        const tranId = randomGenerator(16)
        let newTransaction = await Transactions.create({
            transactionId: tranId,
            fromEmail: "N.A.",
            toEmail: username.email,
            fromBank: "-",
            toBank: username.bankAccountNumber,
            amount
        })
        console.log("added money to", newTransaction.toEmail, newTransaction.amount)
        return res.status(201).json({newTransaction})
    } catch (error) {
        return res.status(400).send('Internal Server Error')
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
                "message": "Logs not found",
                req
            })
            return res.status(404).send("Logs Found'nt")
        }
        
        if(req.body.date){  //We filter out the data before this date
            var cutoff = new Date(Date.parse(req.body.date))
            
            logList = logList.filter((eee)=>{
                    return (cutoff<=eee.date)
                })
        }

        SystemLogs.create({
            "status": "success",
            "action": "Get Transaction Logs",
            "message": "Successfully fetched logs",
            "req": JSON.parse(JSON.stringify(req.body))
        })
        return res.status(200).send(logList)
    } catch (error) {
        return res.status(401).json({"err": "Internal Server Error"})
    }
})

router.get('/getdetails', fetchuser, async (req, res)=>{
    try {
        const userId = req.userId
        const username = await BankUser.findById(userId).select('-pwd')
        
        if(!username){
            SystemLogs.create({
                "status": "err",
                "action": "Get User Details",
                "message": "User Not Found",
                "req": JSON.parse(JSON.stringify(req.body))
            })
            return res.status(400).json({"err": "Cannot Find User"})
        }
        SystemLogs.create({
            "status": "success",
            "action": "Get User Details",
            "message": "Successfully Fetched all Details",
            "req": JSON.parse(JSON.stringify(req.body))
        })
        return res.status(200).send(username)

    } catch (error) {
        return res.status(400).json({"err": "Internal Server Error"})
    }
})

// router.get('/systemlogs', fetchuser, async (req, res) =>{
//     try {
//         const {email} = req.body
//         const userId = req.userId


       
        
//         // if(req.body.date){  //We filter out the data before this date
//         //     var cutoff = new Date(Date.parse(req.body.date))
            
//         //     logList = logList.filter((eee)=>{
//         //             return (cutoff<=eee.date)
//         //         })
//         // }

//         SystemLogs.create({
//             "status": "success",
//             "action": "Get Transaction Logs",
//             "message": "Successfully fetched logs",
//             "req": JSON.parse(JSON.stringify(req.body))
//         })
//         return res.status(200).send(logList)
//     } catch (error) {
//         return res.status(401).json({"err": "Internal Server Error"})
//     }
// })

module.exports=router