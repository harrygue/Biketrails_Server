const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Root Route
// Landing page
router.get('/',async(req,res) => {
    console.log("hit index route")
    res.status(200).json({message:`==================LANDING PAGE IN WORK==================\n
    - all middleware isLoggedIn and CheckOwnership bypassed for development`});
    // res.send("Landing Page in Work ....!!!")
})

// -------AUTHENICATION ROUTES ---------------

// NEW REGISTER
// router.post('/register',(req,res)=>{
//     console.log('HIT REGISTER: ',req.body)
//     User.findOne({
//         username: req.body.username
//     }, async (err,doc) => {
//         if(err) throw err;
//         if(doc) res.send('User Already Exists')
//         if(!doc) {
//             const hashedPassword = await bcrypt.hash(req.body.password,10)
//             const newUser = new User({
//                 username: req.body.username,
//                 password: hashedPassword
//             })
//             await newUser.save()
//             res.send('User Created')
//         }
//     })
// })

// OLD REGISTER
router.post("/register",(req,res) => {
    console.log('hit register route');
    let newUser = new User({username: req.body.username});
    // eval(require('locus'));
    // console.log(newUser);
    // console.log(req.body);
    if(req.body.adminCode === process.env.ADMIN){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log("Hoppla \n", err);
            // req.flash("error",err.message);
            // return res.render("register");
            res.status(401).json("error",err.message)
        }
        passport.authenticate("local")(req,res,function(){
            const token = jwt.sign({username: req.user.username,userId:req.user._id},process.env.JWT_SECRET,{expiresIn:'1h'})
            res.status(200).send({message:req.user,token})
        });
    });
});

// NEW LOGIN
router.post('/login',(req,res,next) => {
    console.log('HIT LOGIN: ',req.body)
    passport.authenticate('local',(err,user,info) => {
        if(err) throw err;
        if(!user) res.send({message:'No User Exists'});
        else {
            req.login(user, (err) => {
                if(err) throw err;
                const token = jwt.sign({username: req.user.username,userId:req.user._id},process.env.JWT_SECRET,{expiresIn:'1h'})
                res.status(200).send({message:req.user,token})
            })
        }
    })(req,res,next)
})

// LOGOUT ROUTES
router.get("/logout",function(req,res){
    req.logout();
    res.status(200).send({message:'You logged out, see you next time!'})
});

module.exports = router;
