require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 5;



app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true})
app.get("/", function (req, res) {
    res.render("home");
})

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});



const User = new mongoose.model("User",userSchema);
app.get("/login", function (req, res) {
    res.render('login');
})
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username}, function(err,foundUser){
        if (err) {
            console.log(err);
        }else{
            if(foundUser){
                console.log(foundUser.password)
                bcrypt.compare(password,foundUser.password , function(err, result) {
                    if(result == true){
                        res.render("secrets");
                    }else{
                        console.log("비번틀림");
                        res.redirect("login");
                    }
                    
                });

            }
        }
    });
})
app.get('/register', function (req, res) {
    res.render('register');
})

app.post('/register',function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username}, function(err,foundUser){
        if (err){
            console.log(err);
        }else{
            if(foundUser){ // 유저가있으면 , 중복처리
                console.log("아이디중복");
                res.redirect("register");
            }else{ //회원가입처리
                bcrypt.hash(req.body.password, saltRounds,function(err,hash){
                    const newUser = new User({
                        email: req.body.username,
                        password:hash
                    });
                
                    newUser.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            res.render("secrets");
                        }
                
                    })
                });

            }
        }
    });
    
    
});

app.listen(3000, function () {
    console.log("Server 3000 ");
})