const express = require('express');
const Biketrail = require("../models/biketrail");
const User = require('../models/user')
const Comment = require("../models/comment");
const Image = require("../models/image");
const jwt = require('jsonwebtoken')

let middleware = {};

// middleware to test if user is logged in otherwise he can go to secret page via search line
middleware.isLoggedIn = (req,res,next) => {
    try{
        console.log("isLoggedIn called!");
        console.log(req.user)
        const token = req.headers.authorization.split(" ")[1]

        // evtl. if statement to check if token exists
        let decodedData = jwt.verify(token,process.env.JWT_SECRET)
        console.log(decodedData)
        req.userId = decodedData && decodedData.userId // check if this is userId or something else
        req.username = decodedData && decodedData.username
        next()
    } catch(err){
        console.error('ERROR IN AUTH: ',err)
    }
};

// check Biketrail and Image Ownership
middleware.checkBiketrailOwnership = async (req,res,next) => {

    try{
        console.log("check biketrailOwnership called!");
        const token = req.headers.authorization.split(" ")[1]
    
        // evtl. if statement to check if token exists
        let decodedData = jwt.verify(token,process.env.JWT_SECRET)

        if(decodedData){
            console.log(decodedData)
            const user_id = decodedData.userId // check if this is userId or something else
            console.log("user_id: ",user_id);
            const username = decodedData.username
            const foundBiketrail = await Biketrail.findById(req.params.id)
            console.log("Found Biketrail in middleware.checkBiketrailOwnership:");
            const currentUser = await User.findById(user_id)
            console.log('User: ',currentUser)
            const bikeTrailOwner_id = foundBiketrail.author.id;
            console.log("biketrailOwner_id: ",bikeTrailOwner_id);
            if(bikeTrailOwner_id && bikeTrailOwner_id.equals(user_id) || currentUser && currentUser.isAdmin){
                console.log("Biketrail Owner okay!");
                next();
            }
            else {
                console.log("You are not the bikeTrailOwner and are not allowed to do that!");
                // req.flash("error","You don't have permission to do that!");
                // res.redirect("back");
                res.status(300).json({message:'You are not the bikeTrailOwner and are not allowed to do that!'})
            }
        }
    } catch(error){
        console.error('ERROR IN middleware.checkBiketrailOwnership: ',error)
        res.status(404).send(error)
    }
};

// check Comment Ownership
middleware.checkCommentOwnership = (req,res,next) => {
    console.log("check commentOwnership called!");
    // console.log("Show req object:",req);
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id,(err,foundComment) => {
            // console.log("Found Commment in middleware.checkCommentOwnership:",foundComment);
            if(err){
                req.flash("error","Something went wrong when trying to access this comment!");
                console.log("Error in middleware.checkCommentOwnership",err);
            } else {
                const commentOwner_id = foundComment.author.id;
                const user_id = req.user._id;
                const currentUser = req.user;
                console.log("commentOwner_id: ",commentOwner_id);
                console.log("user_id: ",user_id);
                if(commentOwner_id !== undefined && commentOwner_id.equals(user_id) || currentUser && currentUser.isAdmin){
                    console.log("Comment Owner okay!");
                    next();
                }
                else {
                    console.log("You are not the CommentOwner and are not allowed to do that!");
                    req.flash("error","You don't have permission to do that!");
                    res.redirect("back");
                }
            }
        });
    } else {
        // temporary for dev without login
        console.log('--------------- call temporarily next() ----------------')
        next()
        // res.redirect("/login");
    }
};

module.exports = middleware;