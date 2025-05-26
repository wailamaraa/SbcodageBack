const Fournisseur = require('../models/Fournisseur');

// @desc    Get all fournisseurs
// @route   GET /api/fournisseurs
// @access  Private
exports.getFournisseurs = async (req, res) => {
    try {
        const fournisseurs = await Fournisseur.find().sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: fournisseurs.length,
            data: fournisseurs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Get single fournisseur
// @route   GET /api/fournisseurs/:id
// @access  Private
exports.getFournisseur = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findById(req.params.id);

        if (!fournisseur) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found',
            });
        }

        res.status(200).json({
            success: true,
            data: fournisseur,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Create new fournisseur
// @route   POST /api/fournisseurs
// @access  Private
exports.createFournisseur = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.create(req.body);

        res.status(201).json({
            success: true,
            data: fournisseur,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Update fournisseur
// @route   PUT /api/fournisseurs/:id
// @access  Private
exports.updateFournisseur = async (req, res) => {
    try {
        let fournisseur = await Fournisseur.findById(req.params.id);

        if (!fournisseur) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found',
            });
        }

        fournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: fournisseur,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// @desc    Delete fournisseur
// @route   DELETE /api/fournisseurs/:id
// @access  Private
exports.deleteFournisseur = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findById(req.params.id);

        if (!fournisseur) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found',
            });
        }

        await fournisseur.deleteOne();

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