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
        res.status(401).send({error})
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
                res.send({message:'not authorized'})
            }
        }
    } catch(error){
        console.error('ERROR IN middleware.checkBiketrailOwnership: ',error)
        res.status(401).json({error})
    }
};

// check Comment Ownership
middleware.checkCommentOwnership = async (req,res,next) => {
    try{
        console.log("checkCommentOwnership called!");
        const token = req.headers.authorization.split(" ")[1]
    
        // evtl. if statement to check if token exists
        let decodedData = jwt.verify(token,process.env.JWT_SECRET)

        if(decodedData){
            console.log(decodedData)
            const user_id = decodedData.userId // check if this is userId or something else
            console.log("user_id: ",user_id);
            const username = decodedData.username
            const foundComment = await Comment.findById(req.params.comment_id)
            console.log("Found Comment in middleware.checkCommentOwnership:");
            const currentUser = await User.findById(user_id)
            console.log('User: ',currentUser)
            const commentOwner_id = foundComment.author.id;
            console.log("commentOwner_id: ",commentOwner_id);
            if(commentOwner_id && commentOwner_id.equals(user_id) || currentUser && currentUser.isAdmin){
                console.log("Comment Owner okay!");
                next();
            }
            else {
                console.log("You are not the commentOwner and are not allowed to do that!");
                res.send({message:'not authorized'})
            }
        }
    } catch(error){
        console.error('ERROR IN middleware.checkBiketrailOwnership: ',error)
        res.status(401).json({error})
    }
}


module.exports = middleware;