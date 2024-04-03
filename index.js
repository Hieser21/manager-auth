//express starter with mongoose 
const express = require('express');
require('dotenv').config();
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { generateRandomString } = require('random-string-generator-library');
const jwt = require("jsonwebtoken");
const User = require('./models/user')
const messageSender = require('./utils/messageSender')
app.use(express.json());
//trust proxy
app.enable('trust proxy')
app.use(cors({
  origin: ['http://localhost:3000']
}));
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {console.log("[INFO] CONNECTED TO MONGODB")}).catch(err => console.error("[ERROR] ERROR CONNECTING TO MONGODB", err))

app.post('/register', async (req, res) => {
  const { name, phone } = req.body;
  let ip = req.ip
  const user = await User.findOne({ phone });

  if (user) {
    console.log("[ERROR] REGISTER USER EXISTS: " + user.email);
    return res.status(401).json({
      success: false,
      message: "User already exists"
    });
  } else {
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const int = randInt(100, 999);
    
    const email = name + int + "manager@acs.com" 
    console.log(ip, req.ip)
    const password = generateRandomString(10);
    const newUser = new User({
      name: name,
      phone: phone,
      reqIPs: [ip],
      email: email,
      password: password
    });
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    await newUser.save();

    await messageSender(phone, `Your Apars Manager Credentials are: 
Username: ${email}
Password: ${password}`)
    console.log("[INFO] USER REGISTERED", newUser);
    return res.status(200).json({
      success: true,
      message: "User created successfully"
    });
  }

})
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    if (bcrypt.compare(user.password, password)) {
      //create access token using jsonwebtoken
      let date = Date.now() + 86400000
            let expiry = new Date(date)
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 86400000});
      const accessToken = jwt.sign({ email: email }, process.env.ACCESS_SECRET, { expiresIn: '30m' });
      if (user.reqIPs.includes(ip) === false && user.reqIPs.length === 5) { return res.status(403).json({ success: false, message: "Max number of devices reached!" }) }
      if (user.reqIPs.includes(ip) === false) { let updated = await User.updateOne({ email: email }, { $addToSet: { reqIPs: ip } }); console.log("[INFO] USER LOGIN", updated) }
      res.cookie('token', token, { httpOnly: true, expires: expiry, sameSite: 'lax' });
      res.cookie('access_token', accessToken, { httpOnly: true,  expires: new Date(Date.now() + 1800000), sameSite: 'lax' })
      res.header('Access-Control-Allow-Origin', "*")
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: user
      });
      
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Invalid email"
    });
  }
})
app.post('/cookies', async (req, res) => {
  let token = req.cookies.token;
  let email = req.body.email
  let user = await User.findOne({ email: email })

  let isValid = jwt.verify(token, process.env.JWT_SECRET)
  if (!isValid) {
      await User.findOneAndUpdate({ email: email }, { $pull: { 'reqIPs': req.ip } })
      return res.status(401).json({ success: false, message: "Refresh Token Expired!" })
  }
  User.password = undefined;
  User.reqIPs = undefined;
  let accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_SECRET, { expiresIn: '30m' })
    res.header('Access-Control-Allow-Origin', "*")
  return res.status(200).cookie('access_token', accessToken, { httpOnly: true, expires: new Date(Date.now() + 1800000), sameSite: 'lax' }).json({ success: true, User, message: "Token valid!" })

})
// Start the server
app.listen(8000, () => {
  console.log("[INFO] SERVER STARTED");
});