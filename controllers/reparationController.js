const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const { jsPDF } = require('jspdf');
const Reparation = require('../models/Reparation');
const Car = require('../models/Car');
const Item = require('../models/Item');
const Service = require('../models/Service');
const StockTransaction = require('../models/StockTransaction');

const DEFAULT_COMPANY_INFO = {
  name: 'SbCodage AUTO',
  address: '25 boulvard lakhdar ghilane - oujda',
  phone: '+212-688103420',
  email: 'contact@sbcodage-auto.ma',
  patente: '10103398',
  instagram: '@sb_codageauto'
};

const loadLogoDataUri = () => {
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'image.png');
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (e) {
    return '';
  }
};

const formatMAD = (value) => {
  try {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch (_) {
    const n = Number(value || 0).toFixed(2);
    return `${n} MAD`;
  }
};

// @desc    Create a new reparation
// @route   POST /api/reparations
// @access  Private
const createReparation = asyncHandler(async (req, res) => {
    const { car, description, items, services, technician, laborCost, notes } = req.body;

    // Check if car exists
    const carExists = await Car.findById(car);
    if (!carExists) {
        res.status(404);
        throw new Error('Car not found');
    }

    // Validate and prepare items with current prices
    let preparedItems = [];
    if (items && items.length > 0) {
        for (const itemData of items) {
            const item = await Item.findById(itemData.item);
            if (!item) {
                res.status(404);
                throw new Error(`Item with ID ${itemData.item} not found`);
            }

            // Check if enough stock is available
            if (item.quantity < itemData.quantity) {
                res.status(400);
                throw new Error(`Not enough stock for ${item.name}. Available: ${item.quantity}`);
            }

            preparedItems.push({
                item: item._id,
                quantity: itemData.quantity,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                totalPrice: item.sellPrice * itemData.quantity
            });
        }
    }

    // Validate and prepare services with current price
    let preparedServices = [];
    if (services && services.length > 0) {
        for (const serviceData of services) {
            const service = await Service.findById(serviceData.service);
            if (!service) {
                res.status(404);
                throw new Error(`Service with ID ${serviceData.service} not found`);
            }

            preparedServices.push({
                service: service._id,
                price: service.price,
                notes: serviceData.notes || ''
            });
        }
    }

    // Create reparation
    const reparation = await Reparation.create({
        car,
        description,
        technician,
        laborCost: laborCost || 0,
        items: preparedItems,
        services: preparedServices,
        notes,
        createdBy: req.user._id,
        status: 'pending',
        startDate: new Date()
    });

    // Update stock levels for used items and create stock transactions
    if (items && items.length > 0) {
        for (const itemData of items) {
            const usedItem = await Item.findById(itemData.item);
            if (usedItem) {
                const oldQuantity = usedItem.quantity;
                const newQuantity = oldQuantity - itemData.quantity;

                await Item.findByIdAndUpdate(
                    itemData.item,
                    { $inc: { quantity: -itemData.quantity } },
                    { new: true, runValidators: true }
                );

                await StockTransaction.create({
                    item: itemData.item,
                    type: 'reparation_use',
                    quantity: itemData.quantity,
                    quantityBefore: oldQuantity,
                    quantityAfter: newQuantity,
                    unitPrice: usedItem.sellPrice,
                    totalAmount: usedItem.sellPrice * itemData.quantity,
                    reparation: reparation._id,
                    notes: `Used in reparation`,
                    createdBy: req.user._id,
                });
            }
        }
    }

    res.status(201).json(reparation);
});

// @desc    Get all reparations
// @route   GET /api/reparations
// @access  Private
const getReparations = asyncHandler(async (req, res) => {
    const query = {};
    // Filtering
    if (req.query.car) query.car = req.query.car;
    if (req.query.status) query.status = req.query.status;
    if (req.query.technician) query.technician = { $regex: req.query.technician, $options: 'i' };
    if (req.query.startDate) query.startDate = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
        query.endDate = query.endDate || {};
        query.endDate.$lte = new Date(req.query.endDate);
    }
    if (req.query.search) {
        query.description = { $regex: req.query.search, $options: 'i' };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sort) {
        const sortField = req.query.sort.replace('-', '');
        const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
        sort = { [sortField]: sortOrder };
    }

    const total = await Reparation.countDocuments(query);
    const reparations = await Reparation.find(query)
        .populate('car')
        .populate({ path: 'items.item', model: 'Item' })
        .populate({ path: 'services.service', model: 'Service' })
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        count: reparations.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: reparations,
    });
});

// @desc    Get a single reparation
// @route   GET /api/reparations/:id
// @access  Private
const getReparation = asyncHandler(async (req, res) => {
    const reparation = await Reparation.findById(req.params.id)
        .populate('car')
        .populate({
            path: 'items.item',
            model: 'Item'
        })
        .populate({
            path: 'services.service',
            model: 'Service'
        })
        .populate('createdBy', 'name');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    res.status(200).json(reparation);
});

// @desc    Update reparation
// @route   PUT /api/reparations/:id
// @access  Private
const updateReparation = asyncHandler(async (req, res) => {
    const { status, endDate } = req.body;

    const reparation = await Reparation.findById(req.params.id);

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Update status and end date if provided
    reparation.status = status || reparation.status;

    if (status === 'completed' && !reparation.endDate) {
        reparation.endDate = endDate || new Date();
    }

    const updatedReparation = await reparation.save();

    res.status(200).json(updatedReparation);
});

// @desc    Update all reparation information
// @route   PUT /api/reparations/:id/full
// @access  Private
const updateReparationFull = asyncHandler(async (req, res) => {
    const { description, items, services, technician, laborCost, status, notes } = req.body;

    const reparation = await Reparation.findById(req.params.id)
        .populate('items.item');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Handle items update
    if (items && items.length > 0) {
        // First, return all existing items to stock with transactions
        for (const itemData of reparation.items) {
            const item = itemData.item;
            if (item) {
                const oldQuantity = item.quantity;
                const newQuantity = oldQuantity + itemData.quantity;

                await Item.findByIdAndUpdate(
                    item._id,
                    { $inc: { quantity: itemData.quantity } },
                    { new: true, runValidators: true }
                );

                await StockTransaction.create({
                    item: item._id,
                    type: 'reparation_return',
                    quantity: itemData.quantity,
                    quantityBefore: oldQuantity,
                    quantityAfter: newQuantity,
                    unitPrice: itemData.sellPrice,
                    totalAmount: (itemData.sellPrice || 0) * itemData.quantity,
                    reparation: reparation._id,
                    notes: 'Returned due to reparation update',
                    createdBy: req.user._id,
                });
            }
        }

        // Validate and prepare new items
        let preparedItems = [];
        for (const itemData of items) {
            const item = await Item.findById(itemData.item);
            if (!item) {
                res.status(404);
                throw new Error(`Item with ID ${itemData.item} not found`);
            }

            // Check if enough stock is available
            if (item.quantity < itemData.quantity) {
                res.status(400);
                throw new Error(`Not enough stock for ${item.name}. Available: ${item.quantity}`);
            }

            preparedItems.push({
                item: item._id,
                quantity: itemData.quantity,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                totalPrice: item.sellPrice * itemData.quantity
            });

            // Update stock levels and create use transaction
            const oldQuantity = item.quantity;
            const newQuantity = oldQuantity - itemData.quantity;

            await Item.findByIdAndUpdate(
                itemData.item,
                { $inc: { quantity: -itemData.quantity } },
                { new: true, runValidators: true }
            );

            await StockTransaction.create({
                item: itemData.item,
                type: 'reparation_use',
                quantity: itemData.quantity,
                quantityBefore: oldQuantity,
                quantityAfter: newQuantity,
                unitPrice: item.sellPrice,
                totalAmount: item.sellPrice * itemData.quantity,
                reparation: reparation._id,
                notes: 'Used in updated reparation',
                createdBy: req.user._id,
            });
        }
        reparation.items = preparedItems;
    }

    // Handle services update
    if (services && services.length > 0) {
        let preparedServices = [];
        for (const serviceData of services) {
            const service = await Service.findById(serviceData.service);
            if (!service) {
                res.status(404);
                throw new Error(`Service with ID ${serviceData.service} not found`);
            }

            preparedServices.push({
                service: service._id,
                price: service.price,
                notes: serviceData.notes || ''
            });
        }
        reparation.services = preparedServices;
    }

    // Update other fields if provided
    if (description) reparation.description = description;
    if (technician) reparation.technician = technician;
    if (laborCost !== undefined) reparation.laborCost = laborCost;
    if (notes) reparation.notes = notes;

    // Handle status update
    if (status) {
        reparation.status = status;
        if (status === 'completed' && !reparation.endDate) {
            reparation.endDate = new Date();
        }
    }

    const updatedReparation = await reparation.save();

    // Populate the response with related data
    const populatedReparation = await Reparation.findById(updatedReparation._id)
        .populate('car')
        .populate({
            path: 'items.item',
            model: 'Item'
        })
        .populate({
            path: 'services.service',
            model: 'Service'
        })
        .populate('createdBy', 'name');

    res.status(200).json(populatedReparation);
});

// @desc    Delete a reparation
// @route   DELETE /api/reparations/:id
// @access  Private
const deleteReparation = asyncHandler(async (req, res) => {
    const reparation = await Reparation.findById(req.params.id)
        .populate('items.item');

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    // Return items to stock
    for (const itemData of reparation.items) {
        const item = itemData.item;
        if (item) {
            const oldQuantity = item.quantity;
            const newQuantity = oldQuantity + itemData.quantity;

            await Item.findByIdAndUpdate(
                item._id,
                { $inc: { quantity: itemData.quantity } },
                { new: true, runValidators: true }
            );

            await StockTransaction.create({
                item: item._id,
                type: 'reparation_return',
                quantity: itemData.quantity,
                quantityBefore: oldQuantity,
                quantityAfter: newQuantity,
                unitPrice: itemData.sellPrice,
                totalAmount: (itemData.sellPrice || 0) * itemData.quantity,
                reparation: reparation._id,
                notes: 'Returned due to reparation deletion',
                createdBy: req.user?._id,
            });
        }
    }

    await reparation.deleteOne();

    res.status(200).json({ message: 'Reparation removed and items returned to stock' });
});

// @desc    Download reparation invoice as PDF
// @route   GET /api/reparations/:id/invoice
// @access  Private
const downloadReparationInvoice = asyncHandler(async (req, res) => {
    const reparation = await Reparation.findById(req.params.id)
        .populate('car')
        .populate({ path: 'items.item', model: 'Item' })
        .populate({ path: 'services.service', model: 'Service' });

    if (!reparation) {
        res.status(404);
        throw new Error('Reparation not found');
    }

    const items = (reparation.items || []).map((ri) => {
        const rate = (ri.sellPrice != null) ? ri.sellPrice : (ri.item?.sellPrice || 0);
        const qty = ri.quantity || 1;
        return {
            name: ri.item?.name || 'Article',
            description: ri.item?.description || '',
            quantity: qty,
            rate,
            total: rate * qty,
        };
    });

    const services = (reparation.services || []).map((rs) => {
        const price = (rs.price != null) ? rs.price : (rs.service?.price || 0);
        return {
            name: rs.service?.name || 'Service',
            notes: rs.notes || (rs.service?.description || ''),
            price,
        };
    });

    const subtotal = items.reduce((s, it) => s + (it.total || 0), 0) + services.reduce((s, sv) => s + (sv.price || 0), 0);
    const labor = Number(reparation.laborCost || 0);
    const totals = { subtotal, labor, total: subtotal + labor };

    const company = DEFAULT_COMPANY_INFO;
    const logoDataUri = loadLogoDataUri();

    // jsPDF in mm units on A4
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 10;
    const marginBottom = 12;
    let y = 15;

    // Header: logo + company info
    if (logoDataUri) {
        try {
            doc.addImage(logoDataUri, 'PNG', pageWidth - marginX - 40, y - 5, 40, 20);
        } catch (_) {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(company.name, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += 5;
    doc.text(company.address, marginX, y);
    y += 4;
    doc.text(company.email, marginX, y);
    y += 4;
    doc.text(company.phone, marginX, y);

    // Invoice meta & customer block
    const invoiceDate = reparation.startDate ? new Date(reparation.startDate) : new Date();
    const dueDate = reparation.endDate ? new Date(reparation.endDate) : invoiceDate;
    const customerName = reparation?.car?.owner?.name || '';
    const customerAddress = reparation?.car
        ? `${reparation.car.make || ''} ${reparation.car.model || ''} ${reparation.car.year || ''}`.trim()
        : '';
    const customerPhone = reparation?.car?.owner?.phone || '';

    // Space between header and owner block
    y = 45;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Facturé à,', marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(customerName, marginX, y + 5);
    doc.setFont('helvetica', 'normal');
    if (customerAddress) doc.text(customerAddress, marginX, y + 10);
    if (customerPhone) doc.text(customerPhone, marginX, y + 15);

    // Amount box on the right
    const rightX = pageWidth - marginX;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Montant (MAD)', rightX, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(formatMAD(totals.total), rightX, y + 7, { align: 'right' });

    // Meta info row
    // Extra space between owner block and meta section
    y += 26;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const colW = (pageWidth - 2 * marginX) / 3;
    const metaY = y;

    doc.text('Objet', marginX, metaY);
    doc.setFont('helvetica', 'bold');
    doc.text(reparation.description || '', marginX, metaY + 4);

    doc.setFont('helvetica', 'normal');
    doc.text('Date de la facture', marginX + colW, metaY);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceDate.toLocaleDateString('fr-MA'), marginX + colW, metaY + 4);

    doc.setFont('helvetica', 'normal');
    doc.text("Date d'échéance", marginX + colW * 2, metaY);
    doc.setFont('helvetica', 'bold');
    doc.text(dueDate.toLocaleDateString('fr-MA'), marginX + colW * 2, metaY + 4);

    y = metaY + 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Référence', marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${String(reparation._id).slice(-8).toUpperCase()}`, marginX + 20, y);

    // Table header
    // Extra space between meta section and table
    y += 12;
    const tableStartY = y;

    const colDescW = (pageWidth - 2 * marginX) * 0.6;
    const colQtyW = (pageWidth - 2 * marginX) * 0.1;
    const colRateW = (pageWidth - 2 * marginX) * 0.15;
    const colAmtW = (pageWidth - 2 * marginX) * 0.15;

    doc.setFillColor(241, 245, 249); // #f1f5f9
    doc.rect(marginX, y - 5, pageWidth - 2 * marginX, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85); // #334155

    let x = marginX + 2;
    doc.text("DÉTAIL DE L'ARTICLE", x, y);
    x = marginX + colDescW + colQtyW / 2;
    doc.text('QTY', x, y, { align: 'center' });
    x = marginX + colDescW + colQtyW + colRateW / 2;
    doc.text('TAUX', x, y, { align: 'center' });
    x = marginX + colDescW + colQtyW + colRateW + colAmtW / 2;
    doc.text('MONTANT', x, y, { align: 'center' });

    // Table rows (services then items)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    y += 6;

    const drawRow = (title, sub, qty, rate, amount) => {
        const lineHeight = 5;
        const startY = y;

        // Description cell
        let tx = marginX + 2;
        doc.setFont('helvetica', 'bold');
        doc.text(title, tx, y);
        if (sub) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139); // muted
            doc.text(sub, tx, y + lineHeight);
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
        }

        // Qty / rate / amount
        const centerQtyX = marginX + colDescW + colQtyW / 2;
        const centerRateX = marginX + colDescW + colQtyW + colRateW / 2;
        const centerAmtX = marginX + colDescW + colQtyW + colRateW + colAmtW / 2;

        doc.setFont('helvetica', 'normal');
        doc.text(String(qty), centerQtyX, startY, { align: 'center' });
        doc.text(formatMAD(rate), centerRateX, startY, { align: 'center' });
        doc.text(formatMAD(amount), centerAmtX, startY, { align: 'center' });

        // Row separator
        y = startY + (sub ? lineHeight + 3 : lineHeight + 1);
        doc.setDrawColor(226, 232, 240); // #e2e8f0
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 2;
    };

    services.forEach((s) => {
        drawRow(s.name, s.notes || '', 1, s.price, s.price);
    });

    items.forEach((it) => {
        drawRow(it.name, it.description || '', it.quantity, it.rate, it.total);
    });

    // Totals box on the right
    const totalsBoxW = 80;
    const totalsX = pageWidth - marginX - totalsBoxW;
    const totalsY = y + 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sous-total', totalsX, totalsY);
    doc.text(formatMAD(totals.subtotal), totalsX + totalsBoxW, totalsY, { align: 'right' });
    doc.text("Main d'œuvre", totalsX, totalsY + 5);
    doc.text(formatMAD(totals.labor), totalsX + totalsBoxW, totalsY + 5, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(totalsX, totalsY + 7, totalsX + totalsBoxW, totalsY + 7);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, totalsY + 12);
    doc.text(formatMAD(totals.total), totalsX + totalsBoxW, totalsY + 12, { align: 'right' });

    // Footer text always near bottom of page
    const footerY = pageHeight - marginBottom;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Merci pour votre confiance.', marginX, footerY - 4);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Conditions générales · Veuillez payer dès réception de cette facture.', marginX, footerY);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `Facture-${reparation.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
});

module.exports = {
    createReparation,
    getReparations,
    getReparation,
    downloadReparationInvoice,
    updateReparation,
    updateReparationFull,
    deleteReparation
};