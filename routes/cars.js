const express = require('express');
const { body } = require('express-validator');
const {
    getCars,
    getCar,
    createCar,
    updateCar,
    deleteCar,
} = require('../controllers/carController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all cars and create a new car
router
    .route('/')
    .get(getCars)
    .post(
        [
            body('make').notEmpty().withMessage('Car make is required'),
            body('model').notEmpty().withMessage('Car model is required'),
            body('year').isNumeric().withMessage('Year must be a number'),
            body('owner.name').notEmpty().withMessage('Owner name is required'),
            body('owner.email').optional().isEmail().withMessage('Please include a valid email'),
        ],
        validate,
        createCar
    );

// Get, update and delete single car
router
    .route('/:id')
    .get(getCar)
    .put(
        [
            body('make').optional().notEmpty().withMessage('Car make cannot be empty'),
            body('model').optional().notEmpty().withMessage('Car model cannot be empty'),
            body('year').optional().isNumeric().withMessage('Year must be a number'),
            body('owner.email').optional().isEmail().withMessage('Please include a valid email'),
        ],
        validate,
        updateCar
    )
    .delete(authorize('admin'), deleteCar);

module.exports = router; 