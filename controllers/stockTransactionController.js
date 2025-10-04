const StockTransaction = require('../models/StockTransaction');
const Item = require('../models/Item');

// @desc    Get all stock transactions
// @route   GET /api/stock-transactions
// @access  Private
exports.getStockTransactions = async (req, res) => {
    try {
        const query = {};

        // Filter by item
        if (req.query.item) {
            query.item = req.query.item;
        }

        // Filter by type
        if (req.query.type) {
            query.type = req.query.type;
        }

        // Filter by reparation
        if (req.query.reparation) {
            query.reparation = req.query.reparation;
        }

        // Filter by date range
        if (req.query.startDate) {
            query.createdAt = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            query.createdAt = query.createdAt || {};
            query.createdAt.$lte = new Date(req.query.endDate);
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        // Sorting
        let sort = { createdAt: -1 };
        if (req.query.sort) {
            const sortField = req.query.sort.replace('-', '');
            const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
            sort = { [sortField]: sortOrder };
        }

        const total = await StockTransaction.countDocuments(query);
        const transactions = await StockTransaction.find(query)
            .populate('item', 'name itemCode')
            .populate('reparation', 'description status')
            .populate('fournisseur', 'name')
            .populate('createdBy', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: transactions.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single stock transaction
// @route   GET /api/stock-transactions/:id
// @access  Private
exports.getStockTransaction = async (req, res) => {
    try {
        const transaction = await StockTransaction.findById(req.params.id)
            .populate('item', 'name itemCode buyPrice sellPrice')
            .populate('reparation', 'description status')
            .populate('fournisseur', 'name contactPerson phone email')
            .populate('createdBy', 'name email');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Stock transaction not found',
            });
        }

        res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Create manual stock transaction
// @route   POST /api/stock-transactions
// @access  Private
exports.createStockTransaction = async (req, res) => {
    try {
        const { item: itemId, type, quantity, reference, notes } = req.body;

        if (!itemId || !type || !quantity) {
            return res.status(400).json({
                success: false,
                error: 'Please provide item, type, and quantity',
            });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        const oldQuantity = item.quantity;
        let newQuantity;
        let transactionQuantity = parseInt(quantity);

        // Determine new quantity based on transaction type
        switch (type) {
            case 'purchase':
            case 'adjustment':
                newQuantity = oldQuantity + transactionQuantity;
                break;
            case 'damage':
            case 'return_to_supplier':
                if (oldQuantity < transactionQuantity) {
                    return res.status(400).json({
                        success: false,
                        error: 'Not enough items in stock',
                    });
                }
                newQuantity = oldQuantity - transactionQuantity;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid transaction type for manual entry',
                });
        }

        // Update item quantity
        await Item.findByIdAndUpdate(
            itemId,
            { quantity: newQuantity },
            { new: true, runValidators: true }
        );

        // Create transaction
        const transaction = await StockTransaction.create({
            item: itemId,
            type,
            quantity: transactionQuantity,
            quantityBefore: oldQuantity,
            quantityAfter: newQuantity,
            unitPrice: type === 'purchase' ? item.buyPrice : item.sellPrice,
            totalAmount: (type === 'purchase' ? item.buyPrice : item.sellPrice) * transactionQuantity,
            fournisseur: req.body.fournisseur,
            reference: reference || '',
            notes: notes || '',
            createdBy: req.user?._id,
        });

        const populatedTransaction = await StockTransaction.findById(transaction._id)
            .populate('item', 'name itemCode')
            .populate('fournisseur', 'name')
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            data: populatedTransaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get stock transaction statistics
// @route   GET /api/stock-transactions/stats
// @access  Private
exports.getStockTransactionStats = async (req, res) => {
    try {
        const stats = await StockTransaction.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
