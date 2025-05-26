const Car = require('../models/Car');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Private
exports.getCars = async (req, res) => {
    try {
        // Build query
        const query = {};

        // Search by make, model, licensePlate or owner.name
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: 'i' };
            query.$or = [
                { make: searchRegex },
                { model: searchRegex },
                { licensePlate: searchRegex },
                { 'owner.name': searchRegex }
            ];
        }

        // Filter by year
        if (req.query.year) {
            query.year = req.query.year;
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

        const total = await Car.countDocuments(query);
        const cars = await Car.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: cars.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: cars,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Private
exports.getCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found',
            });
        }

        res.status(200).json({
            success: true,
            data: car,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Create new car
// @route   POST /api/cars
// @access  Private
exports.createCar = async (req, res) => {
    try {
        const car = await Car.create(req.body);

        res.status(201).json({
            success: true,
            data: car,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private
exports.updateCar = async (req, res) => {
    try {
        let car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found',
            });
        }

        car = await Car.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: car,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);

        if (!car) {
            return res.status(404).json({
                success: false,
                error: 'Car not found',
            });
        }

        await car.deleteOne();

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