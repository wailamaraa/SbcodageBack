/**
 * Migration script to update existing items from single 'price' field to 'buyPrice' and 'sellPrice'
 * 
 * This script will:
 * 1. Read all existing items
 * 2. Convert 'price' to 'sellPrice'
 * 3. Set 'buyPrice' to 70% of sellPrice (you can adjust this ratio)
 * 4. Remove the old 'price' field
 * 
 * Run this script ONCE after deploying the new models
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(uri);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Define old schema for migration
const oldItemSchema = new mongoose.Schema({}, { strict: false });
const OldItem = mongoose.model('OldItem', oldItemSchema, 'items');

const migrateItems = async () => {
    try {
        await connectDB();

        console.log('Starting migration...');

        // Get all items
        const items = await OldItem.find({});
        console.log(`Found ${items.length} items to migrate`);

        let migrated = 0;
        let skipped = 0;

        for (const item of items) {
            // Check if item already has buyPrice and sellPrice
            if (item.buyPrice && item.sellPrice) {
                console.log(`Item ${item.name} already migrated, skipping...`);
                skipped++;
                continue;
            }

            // If item has old 'price' field
            if (item.price) {
                const buyPrice = item.price;
                const sellPrice = Math.round(buyPrice * 1.5 * 100) / 100;

                await OldItem.updateOne(
                    { _id: item._id },
                    {
                        $set: {
                            buyPrice: buyPrice,
                            sellPrice: sellPrice
                        },
                        $unset: { price: 1 }
                    }
                );

                console.log(`Migrated: ${item.name} - Buy: ${buyPrice}, Sell: ${sellPrice}`);
                migrated++;
            } else {
                console.log(`Item ${item.name} has no price field, skipping...`);
                skipped++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total items: ${items.length}`);
        console.log(`Migrated: ${migrated}`);
        console.log(`Skipped: ${skipped}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

// Run migration
migrateItems();
