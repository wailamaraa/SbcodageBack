const express = require('express');
const router = express.Router();
const {
    createService,
    getServices,
    getService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createService)
    .get(protect, getServices);

router.route('/:id')
    .get(protect, getService)
    .put(protect, updateService)
    .delete(protect, deleteService);

module.exports = router; 