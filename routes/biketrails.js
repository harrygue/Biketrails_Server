const express = require('express');
const router = express.Router();
const path = require('path');
const middleware = require("../middleware/index");
const {getBikeTrails,getBikeTrail,editBikeTrail,createBikeTrail,updateBikeTrail,deleteBikeTrail} = require('../controllers/biketrails');
const { update } = require('../models/image');

// File upload configuration => whole block moved to routes
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req,file,callback){
        console.log(file)
        callback(null,Date.now() + file.originalname);
    }
});

var gpxFilter = function(req,file,cb){
    // accept gpx files only
    console.log("gpxFilter called");
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("gpxFilter called", ext);
    if (!file.originalname.match(/\.(gpx)$/i)){
        // cb(new Error('Only .gpx files are allowed!'));
        return cb(new Error('Only .gpx files are allowed!'),false);
    }  
    cb(null, true)
};
var gpxUpload = multer({ 
    storage: storage, 
    fileFilter: gpxFilter
});

router.get('/',getBikeTrails)
router.get("/:id",getBikeTrail)
router.get("/:id/edit",middleware.checkBiketrailOwnership,editBikeTrail)
router.post("/",middleware.isLoggedIn,gpxUpload.single('gpxFile'),createBikeTrail) 
// router.post("/",middleware.isLoggedIn,gpxUpload.any(),createBikeTrail) // test
router.put("/:id",middleware.checkBiketrailOwnership,gpxUpload.single('gpxFile'),updateBikeTrail)
router.delete("/:id",middleware.checkBiketrailOwnership,deleteBikeTrail)

module.exports = router;
