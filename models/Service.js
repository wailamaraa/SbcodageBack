const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a service name'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Please add a service price'],
        },
        duration: {
            type: Number,
            description: 'Estimated duration in hours',
        },
        category: {
            type: String,
            enum: ['maintenance', 'repair', 'diagnostic', 'bodywork', 'other'],
            default: 'maintenance',
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
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

module.exports = mongoose.model('Service', serviceSchema); 