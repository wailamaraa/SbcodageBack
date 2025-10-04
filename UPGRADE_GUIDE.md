# Inventory Management System Upgrade Guide

## Overview
This upgrade adds dual pricing (buy/sell), stock transaction tracking, and improved inventory management to your repair shop system.

## Key Changes

### 1. **Item Model Upgrades**
- **Old**: Single `price` field
- **New**: Separate `buyPrice` and `sellPrice` fields
- **Added**: Virtual fields for `profitMargin` and `profitMarginPercent`
- **Removed**: 'used' status (items are either available, low_stock, or out_of_stock)

### 2. **New Stock Transaction Model**
- Tracks all inventory movements
- Types: purchase, sale, adjustment, reparation_use, reparation_return, damage, return_to_supplier
- Links to reparations, suppliers, and users
- Records quantity before/after, prices, and totals

### 3. **Reparation Model Upgrades**
- Items now store both `buyPrice` and `sellPrice` at time of use
- Added `totalProfit` field to track profit from parts
- Each item has `totalPrice` calculated automatically
- Better cost breakdown (partsCost, servicesCost, laborCost, totalCost)

## Deployment Steps

### Step 1: Backup Your Database
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

### Step 2: Replace Model Files
```bash
# Backup old files
Copy-Item models\Item.js models\Item.old.js
Copy-Item models\Reparation.js models\Reparation.old.js

# Replace with upgraded versions
Copy-Item models\Item_upgraded.js models\Item.js
Copy-Item models\Reparation_upgraded.js models\Reparation.js
```

### Step 3: Replace Controller Files
```bash
# Backup old files
Copy-Item controllers\itemController.js controllers\itemController.old.js
Copy-Item controllers\reparationController.js controllers\reparationController.old.js

# Replace with upgraded versions
Copy-Item controllers\itemController_upgraded.js controllers\itemController.js
Copy-Item controllers\reparationController_upgraded.js controllers\reparationController.js
```

### Step 4: Replace Route Files
```bash
# Backup old file
Copy-Item routes\items.js routes\items.old.js

# Replace with upgraded version
Copy-Item routes\items_upgraded.js routes\items.js
```

### Step 5: Update server.js
Add the stock transactions route:
```javascript
const stockTransactionRoutes = require('./routes/stockTransactions');
app.use('/api/stock-transactions', stockTransactionRoutes);
```

### Step 6: Run Migration Script
This converts existing items from single `price` to `buyPrice`/`sellPrice`:
```bash
node scripts/migrateItemPrices.js
```

**Note**: The script sets `buyPrice` to 70% of the original `price`. Adjust the ratio in the script if needed.

### Step 7: Restart Your Server
```bash
npm start
```

### Step 8: Verify the Upgrade
1. Check that existing items now have `buyPrice` and `sellPrice`
2. Create a test item with the new pricing structure
3. Create a test reparation and verify stock is deducted
4. Check stock transaction history

## Breaking Changes

### API Request Changes

#### Creating Items (POST /api/items)
**Old**:
```json
{
  "name": "Oil Filter",
  "price": 25,
  "quantity": 10,
  "category": "categoryId",
  "fournisseur": "fournisseurId"
}
```

**New**:
```json
{
  "name": "Oil Filter",
  "buyPrice": 15,
  "sellPrice": 25,
  "quantity": 10,
  "category": "categoryId",
  "fournisseur": "fournisseurId"
}
```

#### API Response Changes
Items now return:
```json
{
  "buyPrice": 15,
  "sellPrice": 25,
  "profitMargin": 10,
  "profitMarginPercent": "66.67"
}
```

Reparations now include profit tracking:
```json
{
  "items": [{
    "item": "itemId",
    "quantity": 2,
    "buyPrice": 15,
    "sellPrice": 25,
    "totalPrice": 50
  }],
  "partsCost": 50,
  "totalProfit": 20,
  "totalCost": 50
}
```

## New Features

### 1. Stock Transaction Tracking
Every inventory change is now logged:
- GET `/api/stock-transactions` - List all transactions
- GET `/api/stock-transactions/stats` - Get statistics
- POST `/api/stock-transactions` - Create manual transaction
- GET `/api/items/:id/history` - Get item's transaction history

### 2. Low Stock Alerts
- GET `/api/items/low-stock` - Get items that are low or out of stock

### 3. Profit Tracking
- Reparations now calculate and store profit from parts
- Virtual fields show profit margins on items

## Frontend Updates Needed

### 1. Update Item Forms
- Replace single price input with buyPrice and sellPrice inputs
- Display profit margin and percentage
- Update validation

### 2. Update Item Display
- Show both buy and sell prices
- Display profit margin
- Update tables/cards

### 3. Add Stock History View
- Create component to display item transaction history
- Show quantity changes over time

### 4. Update Reparation Display
- Show profit information
- Display item buy/sell prices

### 5. Add Stock Transaction Management
- Create interface for manual stock adjustments
- Display transaction history

## Rollback Plan

If you need to rollback:

1. Restore database from backup:
```bash
mongorestore --uri="your_mongodb_uri" ./backup
```

2. Restore old files:
```bash
Copy-Item models\Item.old.js models\Item.js
Copy-Item models\Reparation.old.js models\Reparation.js
Copy-Item controllers\itemController.old.js controllers\itemController.js
Copy-Item controllers\reparationController.old.js controllers\reparationController.js
Copy-Item routes\items.old.js routes\items.js
```

3. Remove stock transaction route from server.js

4. Restart server

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Check that migration script completed successfully
