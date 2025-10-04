# Quick Start Guide - Inventory System Upgrade

## 🚀 Quick Deployment (5 Steps)

### 1. Backup Database
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

### 2. Replace Files
```powershell
# Backup originals
Copy-Item models\Item.js models\Item.backup.js
Copy-Item models\Reparation.js models\Reparation.backup.js
Copy-Item controllers\itemController.js controllers\itemController.backup.js
Copy-Item controllers\reparationController.js controllers\reparationController.backup.js
Copy-Item routes\items.js routes\items.backup.js

# Replace with upgraded versions
Copy-Item models\Item_upgraded.js models\Item.js
Copy-Item models\Reparation_upgraded.js models\Reparation.js
Copy-Item controllers\itemController_upgraded.js controllers\itemController.js
Copy-Item controllers\reparationController_upgraded.js controllers\reparationController.js
Copy-Item routes\items_upgraded.js routes\items.js
```

### 3. Update server.js
Add this line after other route imports:
```javascript
const stockTransactionRoutes = require('./routes/stockTransactions');
app.use('/api/stock-transactions', stockTransactionRoutes);
```

### 4. Run Migration
```bash
node scripts/migrateItemPrices.js
```

### 5. Restart Server
```bash
npm start
```

---

## 📋 What Changed?

### Items Now Have:
- **buyPrice**: What you pay the supplier
- **sellPrice**: What you charge the client
- **profitMargin**: Automatic calculation (sellPrice - buyPrice)
- **profitMarginPercent**: Profit percentage

### Reparations Now Track:
- Buy and sell prices at time of use
- Total profit from parts
- Individual item totals

### New Feature: Stock Transactions
- Every inventory change is logged
- View complete history per item
- Track all movements (purchases, sales, reparations, adjustments)

---

## 🔧 API Changes for Frontend

### Creating Items (OLD vs NEW)

**OLD:**
```javascript
{
  "name": "Oil Filter",
  "price": 25,
  "quantity": 10,
  "category": "categoryId",
  "fournisseur": "supplierId"
}
```

**NEW:**
```javascript
{
  "name": "Oil Filter",
  "buyPrice": 15,    // ← Changed
  "sellPrice": 25,   // ← Changed
  "quantity": 10,
  "category": "categoryId",
  "fournisseur": "supplierId"
}
```

### Item Response Now Includes:
```javascript
{
  "_id": "...",
  "name": "Oil Filter",
  "buyPrice": 15,
  "sellPrice": 25,
  "profitMargin": 10,           // ← New
  "profitMarginPercent": "66.67", // ← New
  "quantity": 25,
  // ... other fields
}
```

---

## 🆕 New Endpoints

### Low Stock Items
```javascript
GET /api/items/low-stock
// Returns items that are low or out of stock
```

### Item History
```javascript
GET /api/items/:id/history
// Returns all stock transactions for an item
```

### Stock Transactions
```javascript
GET /api/stock-transactions
GET /api/stock-transactions/:id
POST /api/stock-transactions
GET /api/stock-transactions/stats
```

---

## ✅ Testing Checklist

After deployment, test these:

- [ ] Create a new item with buyPrice and sellPrice
- [ ] View the item and see profit margin
- [ ] Create a reparation using the item
- [ ] Check that stock was deducted
- [ ] View item history to see the transaction
- [ ] Update the reparation
- [ ] Delete the reparation
- [ ] Verify stock was returned
- [ ] Check low stock items endpoint
- [ ] View stock transaction statistics

---

## 🔴 Rollback (If Needed)

```powershell
# Restore database
mongorestore --uri="your_mongodb_uri" ./backup

# Restore files
Copy-Item models\Item.backup.js models\Item.js
Copy-Item models\Reparation.backup.js models\Reparation.js
Copy-Item controllers\itemController.backup.js controllers\itemController.js
Copy-Item controllers\reparationController.backup.js controllers\reparationController.js
Copy-Item routes\items.backup.js routes\items.js

# Remove stock transaction route from server.js
# Restart server
```

---

## 📚 Documentation Files

- **`UPGRADE_GUIDE.md`** - Detailed deployment guide
- **`docs/API_DOCUMENTATION.md`** - Complete API reference
- **`docs/REACT_INTEGRATION_GUIDE.md`** - React integration examples
- **`IMPLEMENTATION_SUMMARY.md`** - Technical overview

---

## 🎯 Key Benefits

1. **Profit Tracking**: Know exactly how much you make on each part
2. **Stock History**: Complete audit trail of all inventory movements
3. **Automatic Management**: Stock updates automatically with reparations
4. **Better Pricing**: Separate buy and sell prices for accurate accounting
5. **Low Stock Alerts**: Never run out of critical parts

---

## 💡 Quick Tips

- Set buyPrice to your actual purchase cost
- Set sellPrice to what you charge customers
- The system calculates profit automatically
- Stock transactions are created automatically
- All reparation operations manage stock correctly

---

## ⚠️ Important Notes

1. **Migration is one-time**: Run the migration script only once
2. **Backup first**: Always backup before upgrading
3. **Test thoroughly**: Test in development before production
4. **Update frontend**: Frontend needs updates to use new fields
5. **Train users**: Show users the new dual pricing system

---

## 🆘 Common Issues

**Q: Migration script fails?**
A: Check MongoDB connection string in .env file

**Q: Stock not updating?**
A: Ensure upgraded controllers are in place

**Q: Profit showing as 0?**
A: Make sure both buyPrice and sellPrice are set

**Q: Old items not showing?**
A: Run the migration script to convert old items

---

## 📞 Need Help?

1. Check the detailed guides in the docs folder
2. Review the API documentation
3. Test each endpoint individually
4. Check server logs for errors

---

**Ready to upgrade? Start with step 1 above! 🚀**
