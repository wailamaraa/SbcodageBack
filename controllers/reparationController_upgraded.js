const asyncHandler = require('express-async-handler');
const Reparation = require('../models/Reparation');
const Car = require('../models/Car');
const Item = require('../models/Item');
const Service = require('../models/Service');
const StockTransaction = require('../models/StockTransaction');

// @desc    Create a new reparation
// @route   POST /api/reparations
// @access  Private
const createReparation = asyncHandler(async (req, res) => {
    const { car, description, items, services, technician, laborCost, notes } = req.body;

    // Check if car exists
    const carExists = await Car.findById(car);
    if (!carExists) {
        res.status(404);
        throw new Error('Car not found');
    }

    // Validate and prepare items with current prices
    let preparedItems = [];
    if (items && items.length > 0) {
        for (const itemData of items) {
            const item = await Item.findById(itemData.item);
            if (!item) {
                res.status(404);
                throw new Error(`Item with ID ${itemData.item} not found`);
            }

            // Check if enough stock is available
            if (item.quantity < itemData.quantity) {
                res.status(400);
                throw new Error(`Not enough stock for ${item.name}. Available: ${item.quantity}`);
            }

            preparedItems.push({
                item: item._id,
                quantity: itemData.quantity,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                totalPrice: item.sellPrice * itemData.quantity
            });
        }
    }

    // Validate and prepare services with current price
    let preparedServices = [];
    if (services && services.length > 0) {
        for (const serviceData of services) {
            const service = await Service.findById(serviceData.service);
            if (!service) {
                res.status(404);
                throw new Error(`Service with ID ${serviceData.service} not found`);
            }

            preparedServices.push({
                service: service._id,
                price: service.price,
                notes: serviceData.notes || ''
            });
        }
    }

    // Create reparation
    const reparation = await Reparation.create({
        car,
        description,
        technician,
        laborCost: laborCost || 0,
        items: preparedItems,
        services: preparedServices,
        notes,
        createdBy: req.user._id,
        status: 'pending',
        startDate: new Date()
    });

    // Update stock levels for used items and create stock transactions
    if (items && items.length > 0) {
        for (const itemData of items) {
            const item = await Item.findById(itemData.item);
            const oldQuantity = item.quantity;
            const newQuantity = oldQuantity - itemData.quantity;

            await Item.findByIdAndUpdate(
                itemData.item,
                { $inc: { quantity: -itemData.quantity } },
                { new: true, runValidators: true }
            );

            // Create stock transaction
            await StockTransaction.create({
                item: itemData.item,
                type: 'reparation_use',
                quantity: itemData.quantity,
                quantityBefore: oldQuantity,
                quantityAfter: newQuantity,
                unitPrice: item.sellPrice,
                totalAmount: item.sellPrice * itemData.quantity,
                reparation: reparation._id,
                notes: `Used in reparation for ${carExists.make} ${carExists.model}`,
                createdBy: req.user._id,
            });
        }
    }

    // Populate and return
    const populatedReparation = await Reparation.findById(reparation._id)
        .populate('car')
        .populate({ path: 'items.item', model: 'Item' })
        .populate({ path: 'services.service', model: 'Service' })
        .populate('createdBy', 'name');

    res.status(201).json({
        success: true,
        data: populatedReparation
    });
});

// @desc    Get all reparations
// @route   GET /api/reparations
// @access  Private
const getReparations = asyncHandler(async (req, res) => {
    const query = {};
    
    // Filtering
    if (req.query.car) query.car = req.query.car;
    if (req.query.status) query.status = req.query.status;
    if (req.query.technician) query.technician = { $regex: req.query.technician, $options: 'i' };
    if (req.query.startDate) query.startDate = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
        query.endDate = query.endDate || {};
        query.endDate.$lte = new Date(req.query.endDate);
    }
    if (req.query.search) {
        query.description = { $regex: req.query.search, $options: 'i' };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sort) {
        const sortField = req.query.sort.replace('-', '');
        const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
        sort = { [sortField]: sortOrder };
    }

    const total = await Reparation.countDocuments(query);
    const reparations = await Reparation.find(query)
        .populate('car')
        .populate({ path: 'items.item', model: 'Item' })
        .populate({ path: 'services.service', model: 'Service' })
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: reparations.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: reparations,
    });
});

// @desc    Get a single reparation
// @route   GET /api/reparations/:id
// @access  Private
const getReparation = asyncHandler(async (req, res) => {
    const reparation = await Reparation.findById(req.params.id)
        .populate('car')
        .populate({
            path: 'items.item',
            model: 'Item',
            populate: { path: 'category fournisseur', select: 'name' }
        })
        .populate({
            path: 'services.service',
            model: 'Service'
        })
        .populate('createdBy', 'name email');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    res.status(200).json({
        success: true,
        data: reparation
    });
});

// @desc    Update reparation status
// @route   PUT /api/reparations/:id
// @access  Private
const updateReparation = asyncHandler(async (req, res) => {
    const { status, endDate } = req.body;

    const reparation = await Reparation.findById(req.params.id);

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Update status and end date if provided
    reparation.status = status || reparation.status;

    if (status === 'completed' && !reparation.endDate) {
        reparation.endDate = endDate || new Date();
    }

    const updatedReparation = await reparation.save();

    const populatedReparation = await Reparation.findById(updatedReparation._id)
        .populate('car')
        .populate({ path: 'items.item', model: 'Item' })
        .populate({ path: 'services.service', model: 'Service' })
        .populate('createdBy', 'name');

    res.status(200).json({
        success: true,
        data: populatedReparation
    });
});

// @desc    Update all reparation information
// @route   PUT /api/reparations/:id/full
// @access  Private
const updateReparationFull = asyncHandler(async (req, res) => {
    const { description, items, services, technician, laborCost, status, notes } = req.body;

    const reparation = await Reparation.findById(req.params.id)
        .populate('items.item');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Handle items update
    if (items && items.length > 0) {
        // First, return all existing items to stock
        for (const itemData of reparation.items) {
            const item = itemData.item;
            if (item) {
                const oldQuantity = item.quantity;
                const newQuantity = oldQuantity + itemData.quantity;

                await Item.findByIdAndUpdate(
                    item._id,
                    { $inc: { quantity: itemData.quantity } },
                    { new: true, runValidators: true }
                );

                // Create return transaction
                await StockTransaction.create({
                    item: item._id,
                    type: 'reparation_return',
                    quantity: itemData.quantity,
                    quantityBefore: oldQuantity,
                    quantityAfter: newQuantity,
                    unitPrice: itemData.sellPrice,
                    totalAmount: itemData.sellPrice * itemData.quantity,
                    reparation: reparation._id,
                    notes: 'Returned due to reparation update',
                    createdBy: req.user._id,
                });
            }
        }

        // Validate and prepare new items
        let preparedItems = [];
        for (const itemData of items) {
            const item = await Item.findById(itemData.item);
            if (!item) {
                res.status(404);
                throw new Error(`Item with ID ${itemData.item} not found`);
            }

            // Check if enough stock is available
            if (item.quantity < itemData.quantity) {
                res.status(400);
                throw new Error(`Not enough stock for ${item.name}. Available: ${item.quantity}`);
            }

            preparedItems.push({
                item: item._id,
                quantity: itemData.quantity,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                totalPrice: item.sellPrice * itemData.quantity
            });

            // Update stock levels
            const oldQuantity = item.quantity;
            const newQuantity = oldQuantity - itemData.quantity;

            await Item.findByIdAndUpdate(
                itemData.item,
                { $inc: { quantity: -itemData.quantity } },
                { new: true, runValidators: true }
            );

            // Create use transaction
            await StockTransaction.create({
                item: itemData.item,
                type: 'reparation_use',
                quantity: itemData.quantity,
                quantityBefore: oldQuantity,
                quantityAfter: newQuantity,
                unitPrice: item.sellPrice,
                totalAmount: item.sellPrice * itemData.quantity,
                reparation: reparation._id,
                notes: 'Used in updated reparation',
                createdBy: req.user._id,
            });
        }
        reparation.items = preparedItems;
    }

    // Handle services update
    if (services && services.length > 0) {
        let preparedServices = [];
        for (const serviceData of services) {
            const service = await Service.findById(serviceData.service);
            if (!service) {
                res.status(404);
                throw new Error(`Service with ID ${serviceData.service} not found`);
            }

            preparedServices.push({
                service: service._id,
                price: service.price,
                notes: serviceData.notes || ''
            });
        }
        reparation.services = preparedServices;
    }

    // Update other fields if provided
    if (description) reparation.description = description;
    if (technician) reparation.technician = technician;
    if (laborCost !== undefined) reparation.laborCost = laborCost;
    if (notes) reparation.notes = notes;

    // Handle status update
    if (status) {
        reparation.status = status;
        if (status === 'completed' && !reparation.endDate) {
            reparation.endDate = new Date();
        }
    }

    const updatedReparation = await reparation.save();

    // Populate the response with related data
    const populatedReparation = await Reparation.findById(updatedReparation._id)
        .populate('car')
        .populate({
            path: 'items.item',
            model: 'Item'
        })
        .populate({
            path: 'services.service',
            model: 'Service'
        })
        .populate('createdBy', 'name');

    res.status(200).json({
        success: true,
        data: populatedReparation
    });
});

// @desc    Delete a reparation
// @route   DELETE /api/reparations/:id
// @access  Private
const deleteReparation = asyncHandler(async (req, res) => {
    const reparation = await Reparation.findById(req.params.id)
        .populate('items.item');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Return items to stock
    for (const itemData of reparation.items) {
        const item = itemData.item;
        if (item) {
            const oldQuantity = item.quantity;
            const newQuantity = oldQuantity + itemData.quantity;

            await Item.findByIdAndUpdate(
                item._id,
                { $inc: { quantity: itemData.quantity } },
                { new: true, runValidators: true }
            );

            // Create return transaction
            await StockTransaction.create({
                item: item._id,
                type: 'reparation_return',
                quantity: itemData.quantity,
                quantityBefore: oldQuantity,
                quantityAfter: newQuantity,
                unitPrice: itemData.sellPrice,
                totalAmount: itemData.sellPrice * itemData.quantity,
                reparation: reparation._id,
                notes: 'Returned due to reparation deletion',
                createdBy: req.user?._id,
            });
        }
    }

    await reparation.deleteOne();

    res.status(200).json({ 
        success: true,
        message: 'Reparation removed and items returned to stock' 
    });
});

module.exports = {
    createReparation,
    getReparations,
    getReparation,
    updateReparation,
    updateReparationFull,
    deleteReparation
};
