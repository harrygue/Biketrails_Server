require('dotenv').config();
// const ejsLint = require('ejs-lint');
const { Mongoose } = require('mongoose');
const Biketrail = require("../models/biketrail");
const path = require('path');
const passport = require("passport");
const Comment = require("../models/comment");
const Image = require("../models/image");
const Admin = require("../models/admin");
const middleware = require("../middleware/index");
// const moment = require("moment");
// const helper = require("../public/helperFunctions"); // added to app.locals
const fsExtra = require("fs-extra");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const haversine = require('haversine-distance');
const DOMParser = require('xmldom').DOMParser;
const togeojson = require("@mapbox/togeojson");

// temporary hardcoded, later make db cluster
const categories = [{'categoryID':0,'categoryName':'All'},
                    {'categoryID':1,'categoryName':'Mountain Bike'},
                    {'categoryID':2,'categoryName':'Road Bike / Strassenrad'},
                    {'categoryID':3,'categoryName':'Hike / Wanderung'},
                    {'categoryID':4,'categoryName':'Skitour'},
                    {'categoryID':5,'categoryName':'Schneeschuh Tour'},
                    {'categoryID':6,'categoryName':'Jogging'},
                    {'categoryID':7,'categoryName':'Walking'}];

var NodeGeocoder = require('node-geocoder')

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

                 
// CLOUDINARY CONFIG
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'dlxmy2ytu',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Index page with fuzzy search
const getBikeTrails = async(req,res) => {
    console.log("hit getBikeTrails")
    console.log(req.query);
    try {
        if(req.query.search && req.query.search != ""){
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            let filteredBiketrails = await Biketrail.find({name:regex}).populate("images").exec();
            res.status(200).json({
                biketrails:filteredBiketrails,
                categories:JSON.stringify(categories), // for the category dropdown on the biketrails/index page
                categoryID:req.query.categoryID // send categoryID to show selected Dropdown category
            });
        } else if (req.query.categoryID && req.query.categoryID != "" && req.query.categoryID != "0"){
            let categoryName = categories[req.query.categoryID].categoryName;
            let biketrailsByCategory = await Biketrail.find({category:categoryName}).populate("images").exec();
            res.status(200).json({
                biketrails:biketrailsByCategory,
                categories:JSON.stringify(categories),
                categoryID:req.query.categoryID // send categoryID to show selected Dropdown category
            });
        } else {
            let allBiketrails = await Biketrail.find({}).populate("images").exec();
            res.status(200).json({
                biketrails:allBiketrails,
                categories:JSON.stringify(categories), // for the category dropdown on the biketrails/index page
                categoryID:"0" // send categoryID to show selected Dropdown category
            });
        }

    } catch(error) {
        console.log("Error at Index route: ",error.message);
        // req.flash("error","ERROR: cannot get biketrails!");
        res.json({error})
    }
};

// ASYNC/AWAIT
// SHOW Biketrail form
// router.get("/:id",
const getBikeTrail = async(req,res) => {
    console.log(req.params.id)
    // console.log(await Biketrail.findById(req.params.id))
    try {
        let user_id = undefined;
        let foundBiketrail = await Biketrail.findById(req.params.id).populate("comments").populate("images").exec();
        
        console.log("Inside Show Route: ",foundBiketrail.name);
        if(req.isAuthenticated()){
            console.log("is Authenticated !");
            // res.render("biketrails/show",{biketrail:foundBiketrail,user_id:req.user._id});
            user_id = req.user._id;
        }

        res.status(200).json({
            biketrail:foundBiketrail,
        });

    } catch (error){
        console.log("Error at show route: ",error.message);
        // req.flash("error","ERROR: cannot show biketrail!");
        res.status(404).json({error})
    }
};

// CREATE NEW BIKETRAIL AND UPLOAD GPX TRACKS (ASYNC/AWAIT)
// -------------------------------------------------------------------------
// router.post("/",middleware.isLoggedIn,gpxUpload.single('gpx'),
const createBikeTrail = async(req,res) => {
    // upload gpx tracks
    console.log("CREATE")
    console.log(req.body)
    console.log(req.file)
    try {
        let newBiketrail = req.body;
        newBiketrail.author = {id:req.userId,userName:req.username}; // {id:"5e1b376eebb09a36303fbdb6",userName:"Adminuser"}// {id:req.user._id,userName:req.user.username};

        if(req.file){
            const file = fsExtra.readFileSync(req.file.path,'utf-8'); 
            newBiketrail.gpxFile = file;
            newBiketrail.gpxFileName = req.file.path;
        }
        // req.body.biketrail return the categoryID instead of categoryName
        // newBiketrail.category = categories[req.body.biketrail.category].categoryName;

        // was req.body.location
        let geoData = newBiketrail.location ? await geocoder.geocode(newBiketrail.location) : null;
        console.log(geoData)
        if(!geoData){
            console.log("no geodata"); // biketrail will be created anyway
        } else {
            console.log("geocode data found!");
            newBiketrail.lat = geoData[0].latitude;
            newBiketrail.lng = geoData[0].longitude;
            newBiketrail.location = geoData[0].formattedAddress;
        }

        let biketrail = await Biketrail.create(newBiketrail);
        // res.status(200).json({"message":"Successfully created new biketrail:"});
        
        res.status(200).json({biketrail});

    } catch (error){
        console.log("ERROR IN CREATE NEW BIKETRAIL: ",error);
        res.status(409).json({error}) // conflict
    }  
};

// UPATE BIKETRAIL  with GPX files (ASYNC / AWAIT)
// router.put("/:id",middleware.checkBiketrailOwnership,gpxUpload.single('gpx'),
const updateBikeTrail = async(req,res) => {
    try {
        console.log('HIT UPDATE BT')
        console.log('req.body:',req.body)

        let updatedBiketrail = req.body;

        if(req.file){
            console.log('req.file',req.file)
            const file = fsExtra.readFileSync(req.file.path,'utf-8'); 
            updatedBiketrail.gpxFile = file;
            updatedBiketrail.gpxFileName = req.file.path;
        } else {
            const existingBiketrail = await Biketrail.findById(req.params.id)
            if(existingBiketrail && existingBiketrail.gpxFile){
                console.log('take existing gpx File')
                updatedBiketrail.gpxFile = existingBiketrail.gpxFile
                updatedBiketrail.gpxFileName = existingBiketrail.gpxFileName
            }
        }

        let geoData = req.body.location && await geocoder.geocode(req.body.location);
        if(!geoData){
            console.log("no geodata");
            res.status(204).json({message:'No Geodata'})
        } else {
            console.log("geocode data found!");
            updatedBiketrail.lat = geoData[0].latitude;
            updatedBiketrail.lng = geoData[0].longitude;
            updatedBiketrail.location = geoData[0].formattedAddress;
        }

        let biketrail = await Biketrail.findByIdAndUpdate(req.params.id,updatedBiketrail);
        console.log('UPDATED biketrail: ',biketrail.gpxFileName)
        console.log(biketrail.name)
        res.status(200).json({biketrail});

    } catch (error) {
        console.log("Error in edit Biketrail: ",error);
        res.status(409).json({error})
    }
};

// -------------------------------------------------------------------------
// Destroy Biketrail with GPX files (ASYNC / AWAIT)
// router.delete("/:id",middleware.checkBiketrailOwnership,
const deleteBikeTrail = async(req,res) => {
    try {
        let biketrail = await Biketrail.findById(req.params.id);
        await Comment.deleteMany({_id: { $in: biketrail.comments}});
        console.log("Biketrail comments deleted!");

        // loop through images and if last one has been deleted redirect
        let i=0;
        const len = biketrail.images.length;
        console.log("number of images: ",len);
        if(len ===0){
            await Biketrail.findByIdAndDelete(req.params.id);
            console.log("there were no images!");
            // req.flash("success","Biketrail and comments deleted, no images found!");
            return res.status(200).json({"message":"biketrail successfully deleted"});
        } 

        biketrail.images.map(async (image) => {
            console.log("image inside biketrail delete: ",image);
            let foundImage = await Image.findById(image);
            if(foundImage != null){
                await cloudinary.v2.uploader.destroy(foundImage.image_id);
                console.log("image" + foundImage.image_id + "deleted in cloudinary");
            }

            i++;
            console.log(i);
            if(i===len){
                await Image.deleteMany({_id: { $in: biketrail.images}});
                await Biketrail.findByIdAndDelete(req.params.id);
                console.log("Biketrail, comments and all images deleted!");
                // req.flash("success","Biketrail, comments and all images deleted!");
                return res.status(200).json({"message":"biketrail successfully deleted"});
            }
        });

    } catch (error){
        console.log("Error in delete Biketrail: ",error);
        res.status(409).json({error})
    }
};

// https://stackoverflow.com/questions/38421664/fuzzy-searching-with-mongodb
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = {getBikeTrails,getBikeTrail,createBikeTrail,updateBikeTrail,deleteBikeTrail}