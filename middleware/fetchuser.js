var jwt = require("jsonwebtoken");
require('dotenv').config()
const BankUser=require('../schema/users');
const users = require("../schema/users");

const fetchuser = async (req, res, next) => {
  //Get the user from JWT token and add id to thse reqd object
  try {
    token = req.header("auth-token");
    if (!token) {
      return res.status(401).send({ "err": "Authenticate using a valid token" });
    }  
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId= data.userId;
    //console.log(token, req.userId)
    next();
  }
  catch (error) {
    console.error(error.message);
    return res.status(401).json({error:"Internal Server Error Occured"})
  }
};

module.exports = fetchuser;