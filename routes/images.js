const express = require("express");
const router = express.Router({mergeParams:true});
const middleware = require("../middleware");
const {createImage,getImages,getImage,updateImage,deleteImage} = require('../controllers/images')

// File upload configuration
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req,file,callback){
        callback(null,Date.now() + file.originalname);
    }
});
var imageFilter = function(req,file,cb){
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error('Only image files are allowed!'),false);
    }  
    cb(null, true)
};
var upload = multer({ 
    storage: storage, 
    fileFilter: imageFilter
});

// CLOUDINARY CONFIG
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dlxmy2ytu',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post("/",middleware.checkBiketrailOwnership,upload.single('image'),createImage)
router.get("/",middleware.checkBiketrailOwnership,getImages)
router.get("/:image_id",middleware.checkBiketrailOwnership,getImage)
router.put("/:image_id",middleware.checkBiketrailOwnership,updateImage)
router.delete("/:image_id",middleware.checkBiketrailOwnership,deleteImage)

module.exports = router;