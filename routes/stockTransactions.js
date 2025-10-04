const express = require('express');
const router = express.Router();
const {
    getStockTransactions,
    getStockTransaction,
    createStockTransaction,
    getStockTransactionStats
} = require('../controllers/stockTransactionController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Stats route must come before :id route
router.get('/stats', getStockTransactionStats);

router.route('/')
    .get(getStockTransactions)
    .post(createStockTransaction);

router.route('/:id')
    .get(getStockTransaction);

module.exports = router;
