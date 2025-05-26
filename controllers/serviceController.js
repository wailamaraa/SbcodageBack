const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    Create a new service
// @route   POST /api/services
// @access  Private
const createService = asyncHandler(async (req, res) => {
    const { name, description, price, duration, category, status, notes } = req.body;

    const service = await Service.create({
        name,
        description,
        price,
        duration,
        category,
        status,
        notes
    });

    res.status(201).json(service);
});

// @desc    Get all services
// @route   GET /api/services
// @access  Private
const getServices = asyncHandler(async (req, res) => {
    const query = {};
    // Filtering
    if (req.query.category) query.category = req.query.category;
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };

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

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: services.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: services,
    });
});

// @desc    Get a single service
// @route   GET /api/services/:id
// @access  Private
const getService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }
    
    res.status(200).json(service);
});

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private
const updateService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }
    
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json(updatedService);
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
        res.status(404);
        throw new Error('Service not found');
    }
    
    await service.remove();
    
    res.status(200).json({ message: 'Service removed' });
});

module.exports = {
    createService,
    getServices,
    getService,
    updateService,
    deleteService
}; 