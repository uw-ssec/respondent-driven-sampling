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
    lon:     { type: Number, required: true},
    lat:     { type: Number, required: true},
    type:    { type: String, required: true },
    loctype: { type: String, required: true },
    address: { type: String, required: true },
    north:   { type: Number, required: true},
    south:   { type: Number, required: true},
    east:    { type: Number, required: true},
    west:    { type: Number, required: true}
}, { timestamps: false });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;