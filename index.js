// getting express
const express = require('express');
const app = express();

// helps to find date 
const axios = require('axios');

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
const rateSchema = new mongoose.Schema({
    principal: Number, // Loan amount
    dateTaken: { type: Date, default: Date.now }, // Date when the loan was taken
    date_diff: {
        years: { type: Number, default: 0 },
        months: { type: Number, default: 0 },
        days: { type: Number, default: 0 },
        formatted: { type: String, default: "0000-00-00" } // Placeholder value
    },
    interest: { type: Number, default: 0 } // Placeholder value
});
const loanSchema = new mongoose.Schema({
    rateValue: Number,  // Fixed interest rate (e.g., 3%, 4%, 5%)
    rates: [rateSchema] // Array of loans taken under this rate
});
const customerSchema = new mongoose.Schema({
    name: String,
    phoneNumber: String,
    details: String,
    loans: [loanSchema] // Array of fixed-rate loans
});
const userSchema = new mongoose.Schema({
    Name:String,
    Pin:String,
    customers: [customerSchema]
})
const userMOdel = mongoose.model('user',userSchema);


// find date code ....
function dateDifference(start, end) {
    let startDate = new Date(start);
    let endDate = new Date(end);

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust if end day is smaller than start day
    if (days < 0) {
        months -= 1; // Borrow from months
        let prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
        days += prevMonth;
    }

    // Adjust if end month is smaller than start month
    if (months < 0) {
        years -= 1; // Borrow from years
        months += 12;
    }
    // Store values in an object
    let date_diff = {
        years: years,
        months: months,
        days: days,
        formatted: `${years} Years, ${months} Months, ${days} Days`
    };

    return date_diff;
}

// req to server 
app.get('/',(req,res)=>{
    res.render('index');
});
app.get('/customer',(req,res)=>{
    const Pin = req.session.user;
    if(Pin==null){
        res.redirect('invalidPin');
    }
    userMOdel.findOne({Pin:Pin}).then((users)=>{
        if(users==null){
            res.redirect('invalid')
        }
        else{
            const today_all = new Date();
            const today = today_all.toISOString().split('T')[0];
            users.customers.forEach(customer => {
                customer.loans.forEach(loan => {
                    const rateValue = (loan.rateValue)*0.01;
                    loan.rates.forEach(rate => {
                        const dateTaken = new Date(rate.dateTaken);
                        // Years difference
                        const yearsPassed = (today - dateTaken) / (1000 * 60 * 60 * 24 * 365);
                        rate.date_diff = dateDifference(rate.dateTaken, today);
                        const date_diff = rate.date_diff;
                        rate.interest = (rate.principal)*rateValue*(date_diff.years*12+date_diff.months+(date_diff.days/30));
                    });
                });
            });
            users.save();
            res.render('customer', { customers: users.customers });
        }
    })
});
app.get('/customer/:name/:phone', (req, res) => {
    const name = decodeURIComponent(req.params.name);  // FIXED!
    const phone = req.params.phone;
    const Pin = req.session.user;
    if(Pin==null){
        res.redirect('invalidPin');
    }
    userMOdel.find({Pin:Pin}).then((users)=>{
        if(users.length==0){
            res.redirect('invalidPin')
        }
        else{
            const customers = users[0].customers;
            const customer = customers.find(c => c.name === name && c.phoneNumber === phone);
            if (!customer) {
                res.redirect('invalid');
            } else {
                res.render('loans',{loans:customer.loans,customerName:name,customerPhoneNumber:phone});
            }
        }
    })
});
app.get('/customer/:name/:phoneNumber/:rateValue', (req, res) => {
    const name = decodeURIComponent(req.params.name);  // FIXED!
    const phoneNumber = req.params.phoneNumber;
    const rateValue = req.params.rateValue;
    const Pin = req.session.user;
    if(Pin==null){
        res.redirect('invalidPin');
    }
    userMOdel.find({Pin:Pin}).then((users)=>{
        if(users.length==0){
            res.redirect('invalidPin')
        }
        else{
            const customers = users[0].customers;
            const customer = customers.find(c => c.name === name && c.phoneNumber === phoneNumber);
            if (!customer) {
                res.redirect('invalid');
            } else {
                const loans = customer.loans;
                const rate = loans.find(c => c.rateValue == rateValue);
                console.log(rate);

                res.render('loandetails',{rate:rate,customerName:name,customerPhoneNumber:phoneNumber});
            }
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
