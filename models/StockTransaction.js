const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: [true, 'Please add an item'],
        },
        type: {
            type: String,
            enum: ['purchase', 'sale', 'adjustment', 'reparation_use', 'reparation_return', 'damage', 'return_to_supplier'],
            required: [true, 'Please add transaction type'],
        },
        quantity: {
            type: Number,
            required: [true, 'Please add quantity'],
        },
        quantityBefore: {
            type: Number,
            required: true,
        },
        quantityAfter: {
            type: Number,
            required: true,
        },
        unitPrice: {
            type: Number,
            description: 'Price per unit at the time of transaction',
        },
        totalAmount: {
            type: Number,
            description: 'Total transaction amount',
        },
        reparation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reparation',
            description: 'Related reparation if type is reparation_use or reparation_return',
        },
        fournisseur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fournisseur',
            description: 'Supplier for purchase transactions',
        },
        reference: {
            type: String,
            trim: true,
            description: 'Invoice number, PO number, or other reference',
        },
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
stockTransactionSchema.index({ item: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1 });
stockTransactionSchema.index({ reparation: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
