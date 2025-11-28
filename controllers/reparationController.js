const asyncHandler = require('express-async-handler');
const Reparation = require('../models/Reparation');
const Car = require('../models/Car');
const Item = require('../models/Item');
const Service = require('../models/Service');
const StockTransaction = require('../models/StockTransaction');
const path = require('path');
const fs = require('fs');

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

const buildInvoiceHTML = ({ company, reparation, logoDataUri, items, services, totals }) => {
  const invoiceDate = reparation.startDate ? new Date(reparation.startDate) : new Date();
  const dueDate = reparation.endDate ? new Date(reparation.endDate) : invoiceDate;
  const customerName = reparation?.car?.owner?.name || '';
  const customerAddress = reparation?.car ? `${reparation.car.make || ''} ${reparation.car.model || ''} ${reparation.car.year || ''}`.trim() : '';
  const customerPhone = reparation?.car?.owner?.phone || '';

  const rowsHTML = [
    ...services.map((s) => `
      <tr class="row">
        <td class="desc">
          <div class="title">${s.name}</div>
          ${s.notes ? `<div class="sub">${s.notes}</div>` : ''}
        </td>
        <td class="qty">1</td>
        <td class="rate">${formatMAD(s.price)}</td>
        <td class="amount">${formatMAD(s.price)}</td>
      </tr>
    `),
    // Items
    ...items.map((it) => `
      <tr class="row">
        <td class="desc">
          <div class="title">${it.name}</div>
          ${it.description ? `<div class="sub">${it.description}</div>` : ''}
        </td>
        <td class="qty">${it.quantity}</td>
        <td class="rate">${formatMAD(it.rate)}</td>
        <td class="amount">${formatMAD(it.total)}</td>
      </tr>
    `)
  ].join('');

  return `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Facture</title>
    <style>
      @page { size: A4; margin: 12mm; }
      :root { --text:#0f172a; --muted:#64748b; --border:#e2e8f0; --bg:#f8fafc; --accent:#2563eb; }
      * { box-sizing: border-box; }
      html, body { margin:0; padding:0; font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial, 'Noto Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji'; color:var(--text); }
      body { background: var(--bg); }
      .page { width: 190mm; margin: 0 auto; background: white; border-radius: 10px; border:1px solid var(--border); }
      header { position: fixed; top: 12mm; left: 0; right: 0; width: 190mm; margin: 0 auto; padding: 0 10mm; }
      footer { position: fixed; bottom: 12mm; left: 0; right: 0; width: 190mm; margin: 0 auto; padding: 0 10mm; }
      .header-inner, .footer-inner { display:flex; align-items:center; justify-content:space-between; }
      .brand { display:flex; gap:12px; align-items:flex-start; }
      .brand .info { line-height:1.3; }
      .brand .name { font-weight:700; font-size:18px; }
      .brand .muted { color: var(--muted); font-size:12px; }
      .logo { width: 140px; height: auto; object-fit: contain; }

      .content-wrap { padding: 0 10mm; }
      .content { margin-top: 42mm; margin-bottom: 36mm; transform-origin: top left; }
      .topbar { display:flex; justify-content:space-between; gap: 10mm; margin-bottom: 8mm; }
      .billto { font-size: 12px; }
      .billto .label { color: var(--muted); }
      .billto .value { font-weight:600; margin-top: 2mm; }
      .amount-box { text-align:right; }
      .amount-box .label { color: var(--muted); font-size:12px; }
      .amount-box .value { font-size: 24px; font-weight:800; color: var(--text); }
      .meta { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm; margin-bottom: 8mm; }
      .meta .item { font-size: 12px; }
      .meta .label { color: var(--muted); }
      .meta .value { font-weight:600; }

      .table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); border-radius:8px; overflow:hidden; }
      .table thead th { background:#f1f5f9; text-align:left; font-size:11px; color:#334155; padding: 8px 10px; }
      .table tbody td { border-top:1px solid var(--border); padding: 10px; font-size: 12px; vertical-align: top; }
      .table .desc .title { font-weight:700; }
      .table .desc .sub { color: var(--muted); font-size: 11px; margin-top: 2px; }
      .table .qty, .table .rate, .table .amount { text-align:right; white-space:nowrap; }

      .totals { display:flex; justify-content:flex-end; margin-top: 6mm; }
      .totals .box { width: 80mm; }
      .totals .row { display:flex; justify-content:space-between; font-size: 12px; padding: 4px 0; }
      .totals .row.total { font-weight:800; font-size: 14px; border-top:1px solid var(--border); padding-top: 6px; }

      .thanks { margin-top: 8mm; font-size: 12px; }
      .terms { margin-top: 4mm; color: var(--muted); font-size: 11px; }
    </style>
  </head>
  <body>
    <div class="page">
      <header>
        <div class="header-inner">
          <div class="brand">
            <div class="info">
              <div class="name">${company.name}</div>
              <div class="muted">${company.address}</div>
              <div class="muted">${company.email}</div>
              <div class="muted">${company.phone}</div>
            </div>
          </div>
          <img class="logo" src="${logoDataUri}" alt="Logo" />
        </div>
      </header>

      <footer>
        <div class="footer-inner">
          <div class="muted">Patente: ${company.patente} · Instagram: ${company.instagram}</div>
        </div>
      </footer>

      <div class="content-wrap">
        <div id="content" class="content">
          <div class="topbar">
            <div class="billto">
              <div class="label">Facturé à,</div>
              <div class="value">${customerName}</div>
              <div class="muted">${customerAddress}</div>
              ${customerPhone ? `<div class="muted">${customerPhone}</div>` : ''}
            </div>
            <div class="amount-box">
              <div class="label">Montant (MAD)</div>
              <div class="value">${formatMAD(totals.total)}</div>
            </div>
          </div>

          <div class="meta">
            <div class="item"><div class="label">Objet</div><div class="value">${reparation.description || ''}</div></div>
            <div class="item"><div class="label">Date de la facture</div><div class="value">${invoiceDate.toLocaleDateString('fr-MA')}</div></div>
            <div class="item"><div class="label">Date d'échéance</div><div class="value">${dueDate.toLocaleDateString('fr-MA')}</div></div>
            <div class="item"><div class="label">Référence</div><div class="value">#${String(reparation._id).slice(-8).toUpperCase()}</div></div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width:60%">DÉTAIL DE L'ARTICLE</th>
                <th style="width:10%; text-align:right;">QTY</th>
                <th style="width:15%; text-align:right;">TAUX</th>
                <th style="width:15%; text-align:right;">MONTANT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="box">
              <div class="row"><div>Sous-total</div><div>${formatMAD(totals.subtotal)}</div></div>
              <div class="row"><div>Main d'œuvre</div><div>${formatMAD(totals.labor)}</div></div>
              <div class="row total"><div>Total</div><div>${formatMAD(totals.total)}</div></div>
            </div>
          </div>

          <div class="thanks">Merci pour votre confiance.</div>
          <div class="terms">Conditions générales · Veuillez payer dès réception de cette facture.</div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
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

const downloadReparationInvoice = asyncHandler(async (req, res) => {
    const puppeteer = require('puppeteer');
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

    const logoDataUri = loadLogoDataUri();
    const html = buildInvoiceHTML({
        company: DEFAULT_COMPANY_INFO,
        reparation,
        logoDataUri,
        items,
        services,
        totals,
    });

    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        await page.evaluate(() => {
            const el = document.getElementById('content');
            if (!el) return;
            const mmToPx = (mm) => mm * 3.78;
            const allowed = mmToPx(297 - 24 - 42 - 36);
            const h = el.scrollHeight;
            if (h > allowed) {
                const scale = Math.min(1, allowed / h);
                el.style.transform = `scale(${scale})`;
            }
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        });

        const filename = `facture_${String(reparation._id).slice(-8).toUpperCase()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (err) {
        if (browser) { try { await browser.close(); } catch (_) {} }
        res.status(500);
        throw new Error('Failed to generate invoice PDF');
    } finally {
        if (browser) { try { await browser.close(); } catch (_) {} }
    }
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

module.exports = {
    createReparation,
    getReparations,
    getReparation,
    downloadReparationInvoice,
    updateReparation,
    updateReparationFull,
    deleteReparation
};