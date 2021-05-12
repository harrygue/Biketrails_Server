const Biketrail = require("../models/biketrail");
const Image = require("../models/image");

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
// 
// Image - create
// router.post("/",middleware.checkBiketrailOwnership,upload.single('image'),
const createImage = async(req,res) => {
    try {
        // console.log('HIT CREATE IMAGE ROUTE')
        // console.log(req.file)
        // console.log(req.body)
        let result = await cloudinary.uploader.upload(req.file.path);
        req.body.image = result.secure_url;
        req.body.image_id = result.public_id;
        let newImage = req.body;
        // console.log("newImage: ",newImage);
        let foundBiketrail = await Biketrail.findById(req.params.id);
        let image = await Image.create(newImage);
        foundBiketrail.images.push(image);
        foundBiketrail.save();
        // console.log("created new image for Biketrail ",foundBiketrail.name);
        // req.flash("success","Image added");
        // res.redirect("/biketrails/"+req.params.id);
        res.status(201).json({biketrail:foundBiketrail})
    } catch (error) {
        console.log("ERROR: cannot upload image! ",error);
//         res.status(409).json({error})
    }
};

// Show Images
// router.get("/",middleware.checkBiketrailOwnership,
const getImages = async(req,res) => {
    try {
        // console.log("hit Show images route");
        // don't forget populate("images").exec otherwise pictures are not displayed in ejs view !!!
        let foundBiketrail = await Biketrail.findById(req.params.id).populate("images").exec();
        // console.log("found Biketrail: ",foundBiketrail);
        if(req.isAuthenticated()){
            // console.log("is Authenticated !");
            user_id = req.user._id;
        }
        // return res.render("images/image_show",{biketrail:foundBiketrail, user_id:user_id});
        res.status(200).json({biketrail:foundBiketrail, user_id:user_id})
    } catch (error) {
        console.log("ERROR: cannot show images! ",error);
        // req.flash("error","ERROR: cannot show images!");
        // res.redirect("/biketrails");
        res.status(404).json({"ERROR":error})
    }
};

// Edit Images

// router.get("/:image_id/edit",middleware.checkBiketrailOwnership,
const getImage = async(req,res) => {
    try {
        // // console.log("hit images/edit route!!!");
        // // console.log("Edit images - req.params.id: ",req.params.id);
        // // console.log("Edit images - req.params.image_id: ",req.params.image_id);

        let image = await Image.findById(req.params.image_id);

        // // console.log("load image edit form");
        // // console.log("update image: ",image);

        // res.render("images/edit",{image:image, biketrail_id:req.params.id});
        res.status(200).json({image:image, biketrail_id:req.params.id})
    } catch (error) {
        console.log("ERROR: cannot edit image!",error);
        // req.flash("error","ERROR: cannot edit image!");
        // res.redirect("/biketrails");
        res.status(404).json({"ERROR":error})
    }
};

// Update image location
// router.put("/:image_id",middleware.checkBiketrailOwnership,
const updateImage = async(req,res) => {
    try {
        // console.log("hit update route");

        let image = await Image.findByIdAndUpdate(req.params.image_id,req.body.image);

        // console.log("Image Title updated");
        // console.log(req.body.image);
        // console.log(req.params.image_id);


        res.status(200).json({"success":"successfully updated Image Title!"})
    } catch (error) {
        console.log("ERROR: cannot update image!: ",error);
//         res.status(404).json({"ERROR":error})
    }
};

// Destroy Image
// router.delete("/:image_id",middleware.checkBiketrailOwnership,
const deleteImage = async(req,res) => {
    try {
        // console.log("hit delete route");

        let image = await Image.findByIdAndDelete(req.params.image_id);

        // console.log(req.params);
        // console.log(`image: ${image}`);
        // console.log(`image.image_id: ${image.image_id}, \nreq.params.image_id: ${req.params.image_id} \nreq.params.id: ${req.params.id}`); 

        await cloudinary.v2.uploader.destroy(image.image_id);
        res.status(200).json({message:"Image deleted!"})
    } catch (error) {
        console.log("ERROR: cannot delete image! ",error);
        res.status(404).json({"ERROR":error})
    }
};

module.exports = {createImage,getImages,getImage,updateImage,deleteImage};