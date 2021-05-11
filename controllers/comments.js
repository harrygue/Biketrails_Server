const Biketrail = require("../models/biketrail");
const Comment = require("../models/comment");
const moment = require("moment");
const { read } = require("fs");
const { copySync } = require("fs-extra");

// Comments - New Form

// router.post("/",middleware.isLoggedIn,
const createComment = async(req,res) => {
    console.log('hit Create Comment')
    console.log(req.body)
    try {
        let newComment = {}
        newComment.text = req.body.comment;
        newComment.creation_date = moment().format();
        newComment.author = {id:req.userId,userName:req.username};// {id:req.user._id,userName:req.user.username};
        let foundBiketrail = await Biketrail.findById(req.params.id);
        console.log(newComment)
        let comment = await Comment.create(newComment);
        foundBiketrail.comments.push(comment);
        foundBiketrail.save();
        console.log("created new comment for biketrail: \n",foundBiketrail.name);
        res.status(201).json({message:'Created Comment'})
    } catch (error){
        console.log("Error at post new comment route in find biketrail: ",error);
        res.status(409).json({error})
    }
};

// Edit comment - get
// router.get("/:comment_id/edit",middleware.checkCommentOwnership,
const getComment = async(req,res) => {
    try{
        // console.log(req.params.id);
        // console.log(req.params.comment_id);

        let comment  = await Comment.findById(req.params.comment_id);

        // console.log("load comment edit form");
        // console.log("update comment: ",comment);

        //res.render("comments/edit",{comment:comment, biketrail_id:req.params.id});
        res.status(200).json({comment:comment, biketrail_id:req.params.id})

    } catch (error) {
        console.log("ERROR: cannot get edit view!",error);
        // req.flash("error","ERROR: cannot get edit view!");
        // res.redirect("/biketrails");
        res.status(409).json({error})
    }
};

// UPDATE COMMENT LIKES
const updateCommentLikes = async(req,res) => {
    try{
        const {newLikes,userId} = req.body
        console.log('LIKES: ',newLikes)
        console.log('userId: ',userId)
        let existingComment = await Comment.findById(req.params.comment_id)
        console.log(existingComment.author.id)
        if (existingComment.author.id !== userId && !existingComment.likesUserIds.includes(userId)){
            const updatedComment = existingComment
            updatedComment.likes = newLikes
            updatedComment.likesUserIds.push(userId)
            let comment = await Comment.findByIdAndUpdate(req.params.comment_id,updatedComment,{new:true}); // new option to return updated biketral
            res.status(200).json({comment});
        }
    } catch(error){
        console.log("Error in edit Biketrail: ",error);
        res.status(409).json({error})
    }
}

// Update comment - put
const updateComment = async(req,res) => {
    try {
        console.log("hit update route; ",req.body.comment);
        let commentToUpdate = await Comment.findById(req.params.comment_id)
        commentToUpdate.text = req.body.comment
        let comment = await Comment.findByIdAndUpdate(req.params.comment_id,commentToUpdate);
        console.log("Comment updated");
        res.status(200).json({message:'Comment updated!'})
    } catch (error) {
        console.log("ERROR: cannot update comment! ",error);
        // req.flash("error","ERROR: cannot update comment!");
        // res.redirect("/biketrails");
        res.status(404).json({error})
    }
};

// Delete comment - delete
// router.delete("/:comment_id",middleware.checkCommentOwnership,
const deleteComment = async(req,res) => {
    console.log('hit delete Comment')
    try {
        await Comment.findByIdAndDelete(req.params.comment_id);
        console.log("Comment deleted");
        res.status(200).json({message:'Comment deleted'})
    } catch (error) {
        console.log("ERROR: cannot delete comment! ",error);
        res.status(409).json({error})
    }
};

module.exports = {createComment,getComment,updateComment,deleteComment,updateCommentLikes}
