const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add an item name'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        quantity: {
            type: Number,
            required: [true, 'Please add quantity'],
            default: 0,
        },
        buyPrice: {
            type: Number,
            required: [true, 'Please add a buy price'],
            description: 'Price at which we purchase this item from supplier',
        },
        sellPrice: {
            type: Number,
            required: [true, 'Please add a sell price'],
            description: 'Price at which we charge the client in reparations',
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Please add a category'],
        },
        fournisseur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fournisseur',
            required: [true, 'Please add a supplier'],
        },
        status: {
            type: String,
            enum: ['available', 'low_stock', 'out_of_stock'],
            default: 'available',
        },
        threshold: {
            type: Number,
            default: 5,
            description: 'Low stock threshold',
        },
        location: {
            type: String,
            trim: true,
        },
        itemCode: {
            type: String,
            unique: true,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for profit margin
itemSchema.virtual('profitMargin').get(function() {
    if (this.buyPrice && this.sellPrice) {
        return this.sellPrice - this.buyPrice;
    }
    return 0;
});

// Virtual for profit margin percentage
itemSchema.virtual('profitMarginPercent').get(function() {
    if (this.buyPrice && this.sellPrice && this.buyPrice > 0) {
        return ((this.sellPrice - this.buyPrice) / this.buyPrice * 100).toFixed(2);
    }
    return 0;
});

// Create item code before saving (if not provided)
itemSchema.pre('save', async function (next) {
    if (!this.itemCode) {
        // Generate a unique code based on name and current timestamp
        this.itemCode = `ITEM-${this.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    }
    next();
});

// Update status based on quantity and threshold
itemSchema.pre('save', async function (next) {
    if (this.quantity <= 0) {
        this.status = 'out_of_stock';
    } else if (this.quantity <= this.threshold) {
        this.status = 'low_stock';
    } else {
        this.status = 'available';
    }
    next();
});

// Automatically update status on findOneAndUpdate
itemSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    let newQuantity;
    // Check for direct set, $set, or $inc
    if (update) {
        if (update.quantity !== undefined) {
            newQuantity = update.quantity;
        } else if (update.$set && update.$set.quantity !== undefined) {
            newQuantity = update.$set.quantity;
        } else if (update.$inc && typeof update.$inc.quantity === 'number') {
            const docToUpdate = await this.model.findOne(this.getQuery());
            newQuantity = docToUpdate.quantity + update.$inc.quantity;
        }
        if (newQuantity !== undefined) {
            // Get threshold (from update or from doc)
            let threshold = 5;
            if (update.threshold !== undefined) {
                threshold = update.threshold;
            } else if (update.$set && update.$set.threshold !== undefined) {
                threshold = update.$set.threshold;
            } else {
                const docToUpdate = await this.model.findOne(this.getQuery());
                if (docToUpdate && docToUpdate.threshold !== undefined) {
                    threshold = docToUpdate.threshold;
                }
            }
            let newStatus = 'available';
            if (newQuantity <= 0) {
                newStatus = 'out_of_stock';
            } else if (newQuantity <= threshold) {
                newStatus = 'low_stock';
            }
            // Merge new status into update
            if (update.$set) {
                update.$set.status = newStatus;
            } else {
                update.status = newStatus;
            }
            this.setUpdate(update);
        }
    }
    next();
});

module.exports = mongoose.model('Item', itemSchema);
