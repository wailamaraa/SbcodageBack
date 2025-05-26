const express = require('express');
const { body } = require('express-validator');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all categories and create a new category
router
    .route('/')
    .get(getCategories)
    .post(
        [body('name').notEmpty().withMessage('Category name is required')],
        validate,
        authorize('admin'),
        createCategory
    );

// Get, update and delete single category
router
    .route('/:id')
    .get(getCategory)
    .put(
        [body('name').notEmpty().withMessage('Category name is required')],
        validate,
        authorize('admin'),
        updateCategory
    )
    .delete(authorize('admin'), deleteCategory);

module.exports = router; 