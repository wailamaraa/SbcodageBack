const Item = require('../models/Item');

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

        // Search by name if provided
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
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
            .populate('category', 'name')
            .populate('fournisseur', 'name')
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
            .populate('category', 'name')
            .populate('fournisseur', 'name');

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

        res.status(201).json({
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

        item = await Item.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

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
        const { quantity, operation } = req.body;

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

        // Update quantity based on operation
        if (operation === 'add') {
            item.quantity += parseInt(quantity);
        } else {
            // Check if we have enough items
            if (item.quantity < parseInt(quantity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Not enough items in stock',
                });
            }
            item.quantity -= parseInt(quantity);
        }

        await item.save();

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