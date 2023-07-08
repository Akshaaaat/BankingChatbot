const express=require('express')
const bcrypt= require("bcrypt")
const jwt=require('jsonwebtoken')
require('dotenv').config()
const router= express.Router()
const BankUser=require('../schema/users')

let randomGenerator = (n) => {
    let res = Math.floor(Math.random()*Math.pow(10, n))+1
    res = String(res)
    while(res.length<n)
        res = res+String(Math.floor(10*Math.random())+1)
    return res
}

const isItValidPin = (str) =>{
    if (typeof str != "string" || str.length!=6) return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

router.post('/createuser',async (req, res)=>{
    try {
        const {email, name, pwd}= req.body
        

        // if(!isItValidPin(pin) )      
        //     return res.status(400).send({"err": "Invalid PIN type"})

        let newUser= await BankUser.findOne({email: email})
        if(newUser){
            return res.status(401).json({"err": "A user alredy exists with this email"})
        }
        const bankAccountNumber = randomGenerator(12)

        //Hashing Password
        const salt = await bcrypt.genSaltSync(10);
        const securePwd = await bcrypt.hash(req.body.pwd, salt);

        newUser= await BankUser.create({email, name, pwd: securePwd, bankAccountNumber})

        const userId= newUser.id;
        const auth_token= jwt.sign({userId}, process.env.JWT_SECRET)
        res.status(201).send({email, name, 'auth-token':auth_token, bankAccountNumber})

    } catch (error) {
        return res.status(401).send({"err": "Internal Server Error"})
    }
})

router.post('/login', async (req, res)=>{
    try {
        const {email, pwd}=req.body
        const findUser= await BankUser.findOne({email: email})
        if(!findUser)
        return res.status(404).send({"err": "Invalid User Credentials"})
        
        const passwordCompare = await bcrypt.compare(pwd, findUser.pwd)
        if(!passwordCompare)
        return res.status(404).send({"err": "Invalid User Credentials"})
        
        const userId=findUser._id
        const auth_token=jwt.sign({'userId':userId}, process.env.JWT_SECRET)
        res.status(201).send({'auth-token': auth_token, email:email, name: findUser.name})

    } catch (error) {
        return res.status(401).send({'err': 'Internal Server Error'})
    }
})

module.exports= router