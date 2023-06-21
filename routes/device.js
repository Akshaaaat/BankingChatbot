const express=require('express')
const bcrypt= require("bcrypt")
const jwt=require('jsonwebtoken')
require('dotenv').config()
const fetch = require('node-fetch')
const BankUser=require('../schema/users')
const Transactions= require('../schema/transaction')
const fetchuser= require('../middleware/fetchuser')
const router= express.Router()

const randomGenerator = (n) => {
    let res = Math.floor(Math.random()*Math.pow(10, n))+1
    res = String(res)
    return res
}

router.post('/new', fetchuser, async (req, res)=>{    //PC compare pwd here also..same as login
    try {
        const {email, bank, toBank, toEmail, amount}=req.body
        const userId=req.userId
        const username= await BankUser.findById(userId)
        if(amount<0)
            return res.status(404).json({"err": "One should send a positive amount (where positive means any number greater than zero"})
        if(!username || username.bankAccountNumber!=bank)
            return res.status(404).send({"err": "user not found"})

        const recipient = await BankUser.findOne({email: toEmail})
        if(!recipient || recipient.bankAccountNumber!=toBank)
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
            fromEmail: email,
            toEmail: toEmail,
            fromBank: bank,
            toBank: toBank,
            amount
        })
        return res.status(201).json({newTransaction})
    } catch (error) {
        return res.status(400).send('Internal Server Error')
    }  
})

router.get('/list', fetchuser, async (req, res)=>{
    try {
        const {email, bank} = req.body
        const userId = req.userId

        let logList  = await Transactions.find({
            $or: [
                { fromEmail: email },
                { toEmail: email }
            ]
        })
        if(!logList)
            return res.status(404).send("Found'nt")
        
        if(req.body.date){  //We filter out the data before this date
            var cutoff = new Date(Date.parse(req.body.date))
            
            logList = logList.filter((eee)=>{
                    return (cutoff<=eee.date)
                })
        }
        
        return res.status(200).send(logList)
    } catch (error) {
        return res.status(401).json({"err": "Internal Server Error"})
    }
})

module.exports=router