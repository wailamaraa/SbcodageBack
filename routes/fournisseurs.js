const express = require('express');
const { body } = require('express-validator');
const {
    getFournisseurs,
    getFournisseur,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur,
} = require('../controllers/fournisseurController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Get all fournisseurs and create a new fournisseur
router
    .route('/')
    .get(getFournisseurs)
    .post(
        [
            body('name').notEmpty().withMessage('Supplier name is required'),
            body('email').optional().isEmail().withMessage('Please include a valid email'),
        ],
        validate,
        authorize('admin'),
        createFournisseur
    );

// Get, update and delete single fournisseur
router
    .route('/:id')
    .get(getFournisseur)
    .put(
        [
            body('name').notEmpty().withMessage('Supplier name is required'),
            body('email').optional().isEmail().withMessage('Please include a valid email'),
        ],
        validate,
        authorize('admin'),
        updateFournisseur
    )
    .delete(authorize('admin'), deleteFournisseur);

module.exports = router; 