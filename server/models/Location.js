const mongoose = require('mongoose');

// Location schema definition
// This schema defines the structure used to keep track of survey locations.
// The fields are copied from the given list of locations, possibly up to change.
const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    lon:     { type: Double, required: true},
    lat:     { type: Double, required: true},
    type:    { type: String, required: true },
    loctype: { type: String, required: true },
    address: { type: String, required: true },
    north:   { type: Double, required: true},
    south:   { type: Double, required: true},
    east:    { type: Double, required: true},
    west:    { type: Double, required: true}
}, { timestamps: false });

const Location = mongoose.model('User', locationSchema);
module.exports = Location;