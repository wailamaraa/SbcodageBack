const express = require('express');
const router = express.Router();
const {
    createReparation,
    getReparations,
    getReparation,
    updateReparation,
    updateReparationFull,
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

router.route('/:id/full')
    .put(protect, updateReparationFull);

module.exports = router; 