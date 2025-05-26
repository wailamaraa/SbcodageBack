const express = require('express');
const router = express.Router();
const {
    createReparation,
    getReparations,
    getReparation,
    updateReparation
} = require('../controllers/reparationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReparation)
    .get(protect, getReparations);

router.route('/:id')
    .get(protect, getReparation)
    .put(protect, updateReparation);

module.exports = router; 