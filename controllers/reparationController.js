const asyncHandler = require('express-async-handler');
const Reparation = require('../models/Reparation');
const Car = require('../models/Car');
const Item = require('../models/Item');
const Service = require('../models/Service');

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

    // Validate and prepare items with current price
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
                price: item.price
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

    // Update stock levels for used items
    if (items && items.length > 0) {
        for (const itemData of items) {
            await Item.findByIdAndUpdate(
                itemData.item,
                { $inc: { quantity: -itemData.quantity } },
                { new: true, runValidators: true }
            );
        }
    }

    res.status(201).json(reparation);
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
            model: 'Item'
        })
        .populate({
            path: 'services.service',
            model: 'Service'
        })
        .populate('createdBy', 'name');
    
    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }
    
    res.status(200).json(reparation);
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
    
    res.status(200).json(updatedReparation);
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
            await Item.findByIdAndUpdate(
                item._id,
                { $inc: { quantity: itemData.quantity } },
                { new: true, runValidators: true }
            );
        }
    }
    
    await reparation.deleteOne();
    
    res.status(200).json({ message: 'Reparation removed and items returned to stock' });
});

module.exports = {
    createReparation,
    getReparations,
    getReparation,
    updateReparation,
    deleteReparation
}; 