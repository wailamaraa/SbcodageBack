const Item = require('../models/Item');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
    try {
        // Build query
        const query = {};

        // Filter by category if provided
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by fournisseur if provided
        if (req.query.fournisseur) {
            query.fournisseur = req.query.fournisseur;
        }

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search by name or itemCode if provided
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { itemCode: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
        const skip = limit ? (page - 1) * limit : 0;

        // Sorting
        let sort = { createdAt: -1 };
        if (req.query.sort) {
            const sortField = req.query.sort.replace('-', '');
            const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
            sort = { [sortField]: sortOrder };
        }

        const total = await Item.countDocuments(query);
        const items = await Item.find(query)
            .populate('category', 'name description')
            .populate('fournisseur', 'name contactPerson phone email')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: items.length,
            total,
            page: limit ? page : 1,
            pages: limit ? Math.ceil(total / limit) : 1,
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
exports.getItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id)
            .populate('category', 'name description')
            .populate('fournisseur', 'name contactPerson phone email address');

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
    try {
        const item = await Item.create(req.body);

        // Create initial stock transaction if quantity > 0
        if (item.quantity > 0) {
            await StockTransaction.create({
                item: item._id,
                type: 'purchase',
                quantity: item.quantity,
                quantityBefore: 0,
                quantityAfter: item.quantity,
                unitPrice: item.buyPrice,
                totalAmount: item.buyPrice * item.quantity,
                fournisseur: item.fournisseur,
                notes: 'Initial stock',
                createdBy: req.user?._id,
            });
        }

        const populatedItem = await Item.findById(item._id)
            .populate('category', 'name description')
            .populate('fournisseur', 'name contactPerson phone email');

        res.status(201).json({
            success: true,
            data: populatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
    try {
        let item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        const oldQuantity = item.quantity;

        item = await Item.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate('category', 'name description')
            .populate('fournisseur', 'name contactPerson phone email');

        // If quantity changed, create stock transaction
        if (req.body.quantity !== undefined && req.body.quantity !== oldQuantity) {
            const quantityDiff = req.body.quantity - oldQuantity;
            await StockTransaction.create({
                item: item._id,
                type: 'adjustment',
                quantity: Math.abs(quantityDiff),
                quantityBefore: oldQuantity,
                quantityAfter: req.body.quantity,
                unitPrice: item.buyPrice,
                totalAmount: item.buyPrice * Math.abs(quantityDiff),
                notes: `Manual adjustment: ${quantityDiff > 0 ? 'added' : 'removed'} ${Math.abs(quantityDiff)} units`,
                createdBy: req.user?._id,
            });
        }

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update item quantity (increase or decrease)
// @route   PUT /api/items/:id/quantity
// @access  Private
exports.updateItemQuantity = async (req, res) => {
    try {
        const { quantity, operation, reference, notes } = req.body;

        if (!quantity || !['add', 'subtract'].includes(operation)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide quantity and valid operation (add/subtract)',
            });
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        const oldQuantity = item.quantity;
        let newQuantity;

        // Update quantity based on operation
        if (operation === 'add') {
            newQuantity = oldQuantity + parseInt(quantity);
            item.quantity = newQuantity;
        } else {
            // Check if we have enough items
            if (item.quantity < parseInt(quantity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Not enough items in stock',
                });
            }
            newQuantity = oldQuantity - parseInt(quantity);
            item.quantity = newQuantity;
        }

        await item.save();

        // Create stock transaction
        await StockTransaction.create({
            item: item._id,
            type: operation === 'add' ? 'purchase' : 'adjustment',
            quantity: parseInt(quantity),
            quantityBefore: oldQuantity,
            quantityAfter: newQuantity,
            unitPrice: item.buyPrice,
            totalAmount: item.buyPrice * parseInt(quantity),
            reference: reference || '',
            notes: notes || `Stock ${operation === 'add' ? 'added' : 'removed'}`,
            createdBy: req.user?._id,
        });

        const populatedItem = await Item.findById(item._id)
            .populate('category', 'name description')
            .populate('fournisseur', 'name contactPerson phone email');

        res.status(200).json({
            success: true,
            data: populatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get item stock history
// @route   GET /api/items/:id/history
// @access  Private
exports.getItemHistory = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found',
            });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const query = { item: req.params.id };
        if (req.query.type) {
            query.type = req.query.type;
        }

        const total = await StockTransaction.countDocuments(query);
        const transactions = await StockTransaction.find(query)
            .populate('reparation', 'description status')
            .populate('fournisseur', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
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

// @desc    Get low stock items
// @route   GET /api/items/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
    try {
        const items = await Item.find({
            $or: [
                { status: 'low_stock' },
                { status: 'out_of_stock' }
            ]
        })
            .populate('category', 'name')
            .populate('fournisseur', 'name contactPerson phone email')
            .sort({ quantity: 1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};