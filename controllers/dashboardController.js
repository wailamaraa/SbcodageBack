const Item = require('../models/Item');
const Fournisseur = require('../models/Fournisseur');
const Category = require('../models/Category');
const Car = require('../models/Car');
const Reparation = require('../models/Reparation');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        // Date range filtering
        let dateDebut, dateFin;
        if (req.query.dateDebut) dateDebut = new Date(req.query.dateDebut);
        if (req.query.dateFin) dateFin = new Date(req.query.dateFin);

        // Get counts
        const itemCount = await Item.countDocuments();
        const fournisseurCount = await Fournisseur.countDocuments();
        const categoryCount = await Category.countDocuments();
        const carCount = await Car.countDocuments();
        const reparationCount = await Reparation.countDocuments();

        // Get inventory value
        const items = await Item.find();
        const inventoryValue = items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Get low stock items
        const lowStockItems = await Item.countDocuments({ status: 'low_stock' });

        // Get out of stock items
        const outOfStockItems = await Item.countDocuments({ status: 'out_of_stock' });

        // Get active repairs
        const activeRepairs = await Reparation.countDocuments({
            status: { $in: ['pending', 'in_progress'] }
        });

        // Date filter for completed repairs and revenue
        let completedMatch = { status: 'completed' };
        if (dateDebut || dateFin) {
            completedMatch.endDate = {};
            if (dateDebut) completedMatch.endDate.$gte = dateDebut;
            if (dateFin) completedMatch.endDate.$lte = dateFin;
        } else {
            // Default: last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            completedMatch.endDate = { $gte: thirtyDaysAgo };
        }

        // Get completed repairs in the date range
        const completedRepairs = await Reparation.countDocuments(completedMatch);

        // Get total revenue from completed repairs in the date range
        const revenueAgg = await Reparation.aggregate([
            { $match: completedMatch },
            { $group: { _id: null, total: { $sum: '$totalCost' } } }
        ]);
        const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // Get top 5 most used items
        const topItems = await Item.find()
            .sort({ quantity: 1 })
            .limit(5)
            .select('name quantity');

        res.status(200).json({
            success: true,
            data: {
                counts: {
                    items: itemCount,
                    fournisseurs: fournisseurCount,
                    categories: categoryCount,
                    cars: carCount,
                    reparations: reparationCount,
                },
                inventory: {
                    value: inventoryValue,
                    lowStock: lowStockItems,
                    outOfStock: outOfStockItems,
                },
                repairs: {
                    active: activeRepairs,
                    completed: completedRepairs,
                    revenue,
                    dateDebut: dateDebut || null,
                    dateFin: dateFin || null,
                },
                topItems,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}; 