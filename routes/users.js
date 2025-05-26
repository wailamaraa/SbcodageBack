const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Apply protection and admin-only access to all routes
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please include a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
    ],
    validate,
    async (req, res) => {
        try {
            const { name, email, password, role } = req.body;

            // Check if user already exists
            const userExists = await User.findOne({ email });

            if (userExists) {
                return res.status(400).json({
                    success: false,
                    error: 'User already exists',
                });
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password,
                role,
            });

            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put(
    '/:id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Please include a valid email'),
        body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
    ],
    validate,
    async (req, res) => {
        try {
            let user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }

            // Make sure password is not included in the update
            if (req.body.password) {
                delete req.body.password;
            }

            user = await User.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true,
            }).select('-password');

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        await user.deleteOne();

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
});

module.exports = router; 