const express = require('express');
const router = express.Router();
const {
    createReparation,
    getReparations,
    getReparation,
    updateReparation,
    deleteReparation
} = require('../controllers/reparationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReparation)
    .get(protect, getReparations);

router.route('/:id')
    .get(protect, getReparation)
    .put(protect, updateReparation)
    .delete(protect, deleteReparation);

module.exports = router; 