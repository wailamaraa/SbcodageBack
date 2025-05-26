const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
    {
        make: {
            type: String,
            required: [true, 'Please add a car make'],
            trim: true,
        },
        model: {
            type: String,
            required: [true, 'Please add a car model'],
            trim: true,
        },
        year: {
            type: Number,
            required: [true, 'Please add a car year'],
        },
        licensePlate: {
            type: String,
            trim: true,
        },
        vin: {
            type: String,
            trim: true,
        },
        owner: {
            name: {
                type: String,
                trim: true,
                required: [true, 'Please add an owner name'],
            },
            phone: {
                type: String,
                trim: true,
            },
            email: {
                type: String,
                trim: true,
                lowercase: true,
            }
        },
        notes: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Car', carSchema); 