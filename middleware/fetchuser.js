var jwt = require("jsonwebtoken");
require('dotenv').config()
const BankUser=require('../schema/users')

const fetchuser = async (req, res, next) => {
  //Get the user from JWT token and add id to thse reqd object
  try {

    const token = req.header("auth-token");
    if (!token) {
      return res.status(401).json({ error: "Authenticate using a valid token" });
    }
    const email=req.body.email

    const findUser = await BankUser.findOne({email: email})
    if(!findUser)
      return res.status(404).send("Innvalid User Credentials")
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId= data.userId;

    next();
  }
  catch (error) {
    console.error(error.message);
    return res.status(401).json({error:"Internal Server Error Occured"})
  }
};

module.exports = fetchuser;