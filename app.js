require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const app = express();
const flash = require('connect-flash');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook');
const findOrCreate = require("mongoose-findorcreate");


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))


app.use(session({ 
    secret:"secret KEY",
    resave:false,
    saveUninitialized: true
}));

app.use(flash());
// passport 초기화 위치 중요함.
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true})
mongoose.set("useCreateIndex",true);


//스키마생성
const userSchema = new mongoose.Schema({
    username:String,
    password:String,
    secret:String
    
    
});
//스키마 플러그인
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//모델생성
const User = new mongoose.model("User",userSchema);
//패스포트모듈 초기화
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    console.log("직렬화");
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
      console.log("병렬화");
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
  
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log('token:'+accessToKen);
    console.log("TOKEN함수");
    User.findOrCreate({ username: profile.id }, function (err, user) {
        console.log(profile);
        return cb(err, user); // google/auth/secrets의 passport함수로 들어가는것같음. (추정) 
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ username: profile.id}, function (err, user) {
        console.log(profile);
        return cb(err, user); //
    });
  }
));

//라우터
app.get("/", function (req, res) {
    res.render('home');
});

// ==========================구글 로그인===============================
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile']
}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("최종 성공 콜백 호출");
    res.redirect('/secrets');
  });
//=============================페이스북 로그인============================
app.get('/auth/facebook',passport.authenticate('facebook'));

app.get('/auth/facebook/secrets', passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

//=====================================================================
app.get("/secrets", function(req,res){
    User.find({"secret":{$ne: null}},function(err,foundUsers){
        if(err) {
            console.log(err);
        }else{
            if(foundUsers){
                res.render("secrets",{users: foundUsers});
            }
        }
    });
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
            passport.authenticate("local")(req,res,function(){ // 세션,쿠키에 저장됐을때 , passport.authenticate는 함수를 반환
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
                
                res.redirect("/secrets");
            });
        }
    });
   
    
});

app.get("/submit", function(req,res){ // 로그인 화면에서 submit 버튼을 누르면, 
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }else{
                res.redirect("/login");
            }
        }
    })
});


app.get("/logout",function(req,res){
    req.logout(); // 쿠키파괴,세션파괴
    res.redirect("/");
});


app.listen(3000, function () {
    console.log("Server 3000 ");
})