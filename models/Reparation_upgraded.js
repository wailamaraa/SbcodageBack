const mongoose = require('mongoose');

const reparationSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: [true, 'Please add a car'],
        },
        description: {
            type: String,
            required: [true, 'Please add repair description'],
            trim: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
        },
        technician: {
            type: String,
            trim: true,
        },
        items: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                },
                buyPrice: {
                    type: Number,
                    description: 'Buy price at time of use',
                },
                sellPrice: {
                    type: Number,
                    description: 'Sell price charged to client',
                },
                totalPrice: {
                    type: Number,
                    description: 'Total price for this item (sellPrice * quantity)',
                },
            },
        ],
        services: [
            {
                service: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Service',
                },
                price: {
                    type: Number,
                },
                notes: {
                    type: String,
                    trim: true,
                }
            },
        ],
        totalCost: {
            type: Number,
            default: 0,
        },
        partsCost: {
            type: Number,
            default: 0,
        },
        laborCost: {
            type: Number,
            default: 0,
        },
        servicesCost: {
            type: Number,
            default: 0,
        },
        totalProfit: {
            type: Number,
            default: 0,
            description: 'Total profit from parts (sum of (sellPrice - buyPrice) * quantity)',
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

// Calculate total cost and profit from parts, services, and labor
reparationSchema.pre('save', async function (next) {
    let partsCost = 0;
    let totalProfit = 0;
    let servicesCost = 0;

    if (this.items && this.items.length > 0) {
        this.items.forEach(item => {
            const itemTotal = (item.sellPrice || 0) * item.quantity;
            item.totalPrice = itemTotal;
            partsCost += itemTotal;
            
            // Calculate profit if we have both buy and sell prices
            if (item.buyPrice && item.sellPrice) {
                totalProfit += (item.sellPrice - item.buyPrice) * item.quantity;
            }
        });
    }

    if (this.services && this.services.length > 0) {
        this.services.forEach(service => {
            servicesCost += (service.price || 0);
        });
    }

    this.partsCost = partsCost;
    this.servicesCost = servicesCost;
    this.totalProfit = totalProfit;
    this.totalCost = partsCost + servicesCost + (this.laborCost || 0);
    next();
});

module.exports = mongoose.model('Reparation', reparationSchema);
