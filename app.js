require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))

// 세션설정을 먼저 해줘야함
app.use(session({ 
    secret:"secret KEY",
    resave:false,
    saveUninitialized: false
}));
// passport 초기화 위치 중요함.
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true})
mongoose.set("useCreateIndex",true);


//스키마생성
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});
//스키마 플러그인
userSchema.plugin(passportLocalMongoose);
//모델생성
const User = new mongoose.model("User",userSchema);
//패스포트모듈 초기화
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//라우터
app.get("/", function (req, res) {
    res.render("home");
})

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){ //쿠키에 세션id확인
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/login", function (req, res) {
    res.render('login');
})


app.post("/login",function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){ // 세션,쿠키에 저장됐을때
                
                res.redirect("/secrets");
            });
        }
    });
})

app.get('/register', function (req, res) {
    res.render('register');
})

app.post('/register',function(req,res){
    
    User.register({username:req.body.username},req.body.password, function(err,user){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){ // 세션,쿠키에 저장됐을때
                
                res.redirect("/secret");
            });
        }
    });
   
    
});

app.get("/logout",function(req,res){
    req.logout(); // 쿠키파괴,세션파괴
    res.redirect("/");
});


app.listen(3000, function () {
    console.log("Server 3000 ");
})