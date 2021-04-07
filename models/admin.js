const mongoose = require("mongoose");

let adminSchema = new mongoose.Schema({
    categories: ['Bike','Roadbike','Hike','Skitour']
});

module.exports = mongoose.model("Admin",adminSchema);