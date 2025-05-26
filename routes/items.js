const express = require('express');
const { body } = require('express-validator');
const {
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    updateItemQuantity
} = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all items and create a new item
router
    .route('/')
    .get(getItems)
    .post(
        [
            body('name').notEmpty().withMessage('Item name is required'),
            body('price').isNumeric().withMessage('Price must be a number'),
            body('quantity').isNumeric().withMessage('Quantity must be a number'),
            body('category').notEmpty().withMessage('Category is required'),
            body('fournisseur').notEmpty().withMessage('Supplier is required'),
        ],
        validate,
        authorize('admin'),
        createItem
    );

// Get, update and delete single item
router
    .route('/:id')
    .get(getItem)
    .put(
        [
            body('name').optional().notEmpty().withMessage('Item name cannot be empty'),
            body('price').optional().isNumeric().withMessage('Price must be a number'),
            body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
        ],
        validate,
        authorize('admin'),
        updateItem
    )
    .delete(authorize('admin'), deleteItem);

// Update item quantity
router.put(
    '/:id/quantity',
    [
        body('quantity').isNumeric().withMessage('Quantity must be a number'),
        body('operation').isIn(['add', 'subtract']).withMessage('Operation must be add or subtract'),
    ],
    validate,
    updateItemQuantity
);

module.exports = router; 