// getting express
const express = require('express');
const app = express();

// helps to work .env
require('dotenv').config();

//session making to remember user
const session = require("express-session");
// getting third party middlware
const morgan = require('morgan');
app.use(morgan('dev'));
const bodyParser = require("body-parser");


//Configure express-session
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } // Set true in production with HTTPS
    })
);

// express cant read post data so to help it 
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// helps to add css and javascript 
app.use(express.static(__dirname + '/public'));

// helps to add html/ejs file 
app.set("views",__dirname+"/views");
app.set("view engine",'ejs');


// Database work
const mongoose = require('mongoose');
const connection = mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Connected To DataBase")
})
const customerSchema = new mongoose.Schema({
    name: String,
    phoneNumber: String,
    details: String
});
const userSchema = new mongoose.Schema({
    Name:String,
    Pin:String,
    customers: [customerSchema]
})
const userMOdel = mongoose.model('user',userSchema);




// req to server 
app.get('/',(req,res)=>{
    res.render('index');
});
app.get('/customer',(req,res)=>{
    const Pin = req.session.user;
    if(Pin==null){
        res.redirect('invalidPin');
    }
    userMOdel.find({Pin:Pin}).then((users)=>{
        if(users.length==0){
            res.redirect('invalidPin')
        }
        else{
            res.render('customer', { customers: users[0].customers });
        }
    })
});





//post to server 
app.post('/get-form-data',async (req,res)=>{
    console.log(req.body);
    const {Email,password} = req.body;
    const newUser = await userMOdel.create({
        Email:Email,
        Password:password
    })
    res.send(newUser);
});
app.post('/login',(req,res)=>{
    const {Pin} = req.body;
    req.session.user = Pin;
    userMOdel.find({Pin:Pin}).then((users)=>{
        if(users.length==0){
            res.redirect('invalidPin')
        }
        else{
            res.redirect('customer');
        }
    })
});







//starting the server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
