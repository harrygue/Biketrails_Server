const express = require("express");
const router = express.Router({mergeParams:true});
const middleware = require("../middleware");
const {createComment,getComment,updateComment,deleteComment,updateCommentLikes} = require('../controllers/comments');


// router.get("/new",middleware.isLoggedIn,
router.post("/",middleware.isLoggedIn,createComment)
router.get("/:comment_id",middleware.checkCommentOwnership,getComment)
router.put("/:comment_id",middleware.checkCommentOwnership,updateComment)
router.delete("/:comment_id",middleware.checkCommentOwnership,deleteComment)
router.put("/:comment_id/updateLikes",updateCommentLikes)

module.exports = router;

