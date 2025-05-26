const mongoose = require('mongoose');

const fournisseurSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a supplier name'],
            trim: true,
        },
        contactPerson: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
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

module.exports = mongoose.model('Fournisseur', fournisseurSchema); 