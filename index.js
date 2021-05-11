require('dotenv').config()

const express = require('express')
const helmet = require('helmet');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const cors = require('cors')
const biketrailRoutes = require('./routes/biketrails')
const commentRoutes = require('./routes/comments')
const imageRoutes = require('./routes/images')
const indexRoutes = require('./routes/index')
const User = require("./models/user");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocal = require('passport-local').Strategy;

const expressSession = require('express-session')
const cookieParser = require('cookie-parser')

const app = express();

app.use(helmet());

app.use(bodyParser.json()) // limit: "30mb",{extended:true}
app.use(bodyParser.urlencoded({extended:true,strict:false})) // test: true -> false; limit: "30mb",
app.use(express.static(__dirname + "/public"));
app.use(cors())
//app.use(cors({
//    origin: 'http://localhost:3000', // client
//    credentials: true,
//}));

app.use(function(req, res, next) {
    console.log('set access control headers') // see http://http://cyh.herokuapp.com/cyh
    res.header("Access-Control-Allow-Origin", 'http://localhost:3000'); //"https://biketrailshg-mpv1.netlify.app");// 'http://localhost:3000'
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('X-Xss-Protection','1; mode=block');
    res.header('Cache-Control','no-cache, no-store, must-revalidate');
    res.header('Pragma','no-cache');
    res.header('Expires','-1');
    res.header('X-Permitted-Cross-Domain-Policies','master-only');
    res.header('Content-Security-Policy',"default-src 'self'"); // add also: Add 'report-uri /csp_report_parser. 
    next();
});



// ------PASSPORT CONFIGURATION ---------

app.use(expressSession({
    secret:process.env.MYSECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(cookieParser(process.env.MYSECRET)) // from https://github.com/woodburydev/passport-local-video/blob/master/backend/server.js

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// passport.use(User.createStrategy()); // see https://www.npmjs.com/package/passport-local-mongoose

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// require('./configuration/passportConfig')(passport)


app.use('/biketrails',biketrailRoutes);
app.use('/biketrails/:id/comments',commentRoutes)
app.use('/biketrails/:id/images',imageRoutes)
app.use('/',indexRoutes)

// temporary:
app.use(function(req,res,next){
    res.locals.currentUser = req.user; 
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    // res.locals.helper = helper;
    console.log('index.js/server 65: REQ.SESSION: ',req.session)
    console.log('index.js/server 66: CURRENT USER: ',req.user)
    next();
});



// connect do DB
const connectionString = process.env.DATABASEURL;
// mongoose.connect("mongodb://localhost/bike_camp",{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.connect(connectionString || "mongodb://localhost/bike_camp",{
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex:true}).then(() => {
        console.log("connected to DB!");
    }).catch(err => {
        console.log("ERROR:",err.message);
    });



app.listen(process.env.PORT || 3001,() => console.log("Server listen on port 3001"));