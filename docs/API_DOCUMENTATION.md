# API Documentation for React Frontend

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except login/register) require authentication. Include the JWT token in the Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Table of Contents
1. [Items (Inventory)](#items-inventory)
2. [Reparations](#reparations)
3. [Stock Transactions](#stock-transactions)
4. [Categories](#categories)
5. [Suppliers (Fournisseurs)](#suppliers-fournisseurs)
6. [Services](#services)
7. [Cars](#cars)
8. [Users & Authentication](#users--authentication)

---

## Items (Inventory)

### Get All Items
```javascript
GET /items

// Query Parameters
?page=1              // Page number (default: 1)
?limit=10            // Items per page (default: all if not specified)
?category=categoryId // Filter by category
?fournisseur=supplierId // Filter by supplier
?status=available    // Filter by status (available, low_stock, out_of_stock)
?search=oil          // Search by name or itemCode
?sort=-createdAt     // Sort field (prefix with - for descending)

// Example Request
const getItems = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/items?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "64abc123...",
      "name": "Oil Filter",
      "description": "High quality oil filter",
      "quantity": 25,
      "buyPrice": 15.00,
      "sellPrice": 25.00,
      "profitMargin": 10.00,
      "profitMarginPercent": "66.67",
      "category": {
        "_id": "64abc...",
        "name": "Filters",
        "description": "All types of filters"
      },
      "fournisseur": {
        "_id": "64def...",
        "name": "Auto Parts Inc",
        "contactPerson": "John Doe",
        "phone": "+1234567890",
        "email": "contact@autoparts.com"
      },
      "status": "available",
      "threshold": 5,
      "location": "Shelf A-12",
      "itemCode": "ITEM-OIL-123456",
      "notes": "Premium brand",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:20:00.000Z"
    }
  ]
}
```

### Get Single Item
```javascript
GET /items/:id

// Example Request
const getItem = async (itemId) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "name": "Oil Filter",
    "buyPrice": 15.00,
    "sellPrice": 25.00,
    "profitMargin": 10.00,
    "profitMarginPercent": "66.67",
    // ... full item details with populated category and fournisseur
  }
}
```

### Create Item
```javascript
POST /items
// Requires admin role

// Example Request
const createItem = async (itemData) => {
  const response = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });
  return response.json();
};

// Request Body
{
  "name": "Oil Filter",
  "description": "High quality oil filter",
  "quantity": 25,
  "buyPrice": 15.00,        // Required: Purchase price from supplier
  "sellPrice": 25.00,       // Required: Price charged to client
  "category": "64abc123...", // Required: Category ID
  "fournisseur": "64def456...", // Required: Supplier ID
  "threshold": 5,            // Optional: Low stock threshold (default: 5)
  "location": "Shelf A-12",  // Optional
  "itemCode": "CUSTOM-CODE", // Optional: Auto-generated if not provided
  "notes": "Premium brand"   // Optional
}

// Response
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    // ... created item with populated fields
  }
}
```

### Update Item
```javascript
PUT /items/:id
// Requires admin role

// Example Request
const updateItem = async (itemId, updates) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body (all fields optional)
{
  "name": "Premium Oil Filter",
  "buyPrice": 16.00,
  "sellPrice": 27.00,
  "quantity": 30,
  "threshold": 10,
  "notes": "Updated to premium brand"
}

// Response
{
  "success": true,
  "data": {
    // ... updated item
  }
}
```

### Delete Item
```javascript
DELETE /items/:id
// Requires admin role

// Example Request
const deleteItem = async (itemId) => {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {}
}
```

### Update Item Quantity
```javascript
PUT /items/:id/quantity

// Example Request
const updateQuantity = async (itemId, quantity, operation, notes = '') => {
  const response = await fetch(`${API_URL}/items/${itemId}/quantity`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity,
      operation, // 'add' or 'subtract'
      reference: 'INV-2024-001', // Optional
      notes // Optional
    })
  });
  return response.json();
};

// Request Body
{
  "quantity": 10,
  "operation": "add", // or "subtract"
  "reference": "PO-2024-001", // Optional: Purchase order or reference number
  "notes": "Restocking from supplier" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... updated item with new quantity
  }
}
```

### Get Item Stock History
```javascript
GET /items/:id/history

// Query Parameters
?page=1
?limit=20
?type=purchase // Filter by transaction type

// Example Request
const getItemHistory = async (itemId, page = 1) => {
  const response = await fetch(`${API_URL}/items/${itemId}/history?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 20,
  "total": 45,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "64xyz...",
      "item": "64abc123...",
      "type": "reparation_use",
      "quantity": 2,
      "quantityBefore": 27,
      "quantityAfter": 25,
      "unitPrice": 25.00,
      "totalAmount": 50.00,
      "reparation": {
        "_id": "64rep...",
        "description": "Oil change and filter replacement",
        "status": "completed"
      },
      "notes": "Used in reparation for Toyota Camry",
      "createdBy": {
        "_id": "64user...",
        "name": "John Mechanic"
      },
      "createdAt": "2024-01-20T14:30:00.000Z"
    }
  ]
}
```

### Get Low Stock Items
```javascript
GET /items/low-stock

// Example Request
const getLowStockItems = async () => {
  const response = await fetch(`${API_URL}/items/low-stock`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64abc...",
      "name": "Brake Pads",
      "quantity": 3,
      "threshold": 5,
      "status": "low_stock",
      "category": { "name": "Brakes" },
      "fournisseur": {
        "name": "Auto Parts Inc",
        "phone": "+1234567890"
      }
    }
  ]
}
```

---

## Reparations

### Get All Reparations
```javascript
GET /reparations

// Query Parameters
?page=1
?limit=10
?car=carId
?status=pending // pending, in_progress, completed, cancelled
?technician=John
?startDate=2024-01-01
?endDate=2024-01-31
?search=oil change
?sort=-createdAt

// Example Request
const getReparations = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/reparations?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "64rep123...",
      "car": {
        "_id": "64car...",
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "licensePlate": "ABC-123",
        "owner": {
          "name": "Jane Smith",
          "phone": "+1234567890",
          "email": "jane@email.com"
        }
      },
      "description": "Oil change and filter replacement",
      "status": "completed",
      "technician": "John Mechanic",
      "startDate": "2024-01-15T08:00:00.000Z",
      "endDate": "2024-01-15T10:30:00.000Z",
      "items": [
        {
          "item": {
            "_id": "64item...",
            "name": "Oil Filter",
            "itemCode": "ITEM-OIL-123456"
          },
          "quantity": 1,
          "buyPrice": 15.00,
          "sellPrice": 25.00,
          "totalPrice": 25.00
        },
        {
          "item": {
            "_id": "64item2...",
            "name": "Engine Oil 5W-30",
            "itemCode": "ITEM-ENG-789012"
          },
          "quantity": 5,
          "buyPrice": 8.00,
          "sellPrice": 12.00,
          "totalPrice": 60.00
        }
      ],
      "services": [
        {
          "service": {
            "_id": "64serv...",
            "name": "Oil Change Service",
            "category": "maintenance"
          },
          "price": 30.00,
          "notes": "Includes filter replacement"
        }
      ],
      "partsCost": 85.00,
      "servicesCost": 30.00,
      "laborCost": 50.00,
      "totalCost": 165.00,
      "totalProfit": 45.00, // Profit from parts only
      "notes": "Customer requested synthetic oil",
      "createdBy": {
        "_id": "64user...",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Single Reparation
```javascript
GET /reparations/:id

// Example Request
const getReparation = async (reparationId) => {
  const response = await fetch(`${API_URL}/reparations/${reparationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    // ... full reparation details with populated fields
  }
}
```

### Create Reparation
```javascript
POST /reparations

// Example Request
const createReparation = async (reparationData) => {
  const response = await fetch(`${API_URL}/reparations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reparationData)
  });
  return response.json();
};

// Request Body
{
  "car": "64car123...", // Required: Car ID
  "description": "Oil change and brake inspection", // Required
  "technician": "John Mechanic", // Optional
  "laborCost": 50.00, // Optional (default: 0)
  "items": [ // Optional: Parts used
    {
      "item": "64item123...", // Item ID
      "quantity": 1
      // buyPrice and sellPrice are auto-fetched from item
    },
    {
      "item": "64item456...",
      "quantity": 5
    }
  ],
  "services": [ // Optional: Services performed
    {
      "service": "64serv123...", // Service ID
      "notes": "Includes filter replacement" // Optional
      // price is auto-fetched from service
    }
  ],
  "notes": "Customer requested synthetic oil" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created reparation with populated fields
  }
}

// Important Notes:
// - Stock is automatically deducted for items
// - Stock transactions are created automatically
// - Prices (buyPrice, sellPrice) are captured at time of creation
// - Total costs and profit are calculated automatically
```

### Update Reparation Status
```javascript
PUT /reparations/:id

// Example Request
const updateReparationStatus = async (reparationId, status) => {
  const response = await fetch(`${API_URL}/reparations/${reparationId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};

// Request Body
{
  "status": "completed", // pending, in_progress, completed, cancelled
  "endDate": "2024-01-15T10:30:00.000Z" // Optional: auto-set if status is completed
}

// Response
{
  "success": true,
  "data": {
    // ... updated reparation
  }
}
```

### Update Full Reparation
```javascript
PUT /reparations/:id/full

// Example Request
const updateReparationFull = async (reparationId, updates) => {
  const response = await fetch(`${API_URL}/reparations/${reparationId}/full`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body (all fields optional)
{
  "description": "Updated description",
  "technician": "Jane Mechanic",
  "laborCost": 75.00,
  "status": "in_progress",
  "items": [ // Replaces all items
    {
      "item": "64item123...",
      "quantity": 2
    }
  ],
  "services": [ // Replaces all services
    {
      "service": "64serv123...",
      "notes": "Updated notes"
    }
  ],
  "notes": "Updated notes"
}

// Response
{
  "success": true,
  "data": {
    // ... updated reparation
  }
}

// Important Notes:
// - Old items are returned to stock
// - New items are deducted from stock
// - Stock transactions are created for all changes
// - Validates stock availability before updating
```

### Delete Reparation
```javascript
DELETE /reparations/:id

// Example Request
const deleteReparation = async (reparationId) => {
  const response = await fetch(`${API_URL}/reparations/${reparationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "message": "Reparation removed and items returned to stock"
}

// Important Notes:
// - All items are returned to stock
// - Stock transactions are created for returns
```

---

## Stock Transactions

### Get All Stock Transactions
```javascript
GET /stock-transactions

// Query Parameters
?page=1
?limit=20
?item=itemId
?type=purchase // purchase, sale, adjustment, reparation_use, reparation_return, damage, return_to_supplier
?reparation=reparationId
?startDate=2024-01-01
?endDate=2024-01-31
?sort=-createdAt

// Example Request
const getStockTransactions = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/stock-transactions?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "64trans...",
      "item": {
        "_id": "64item...",
        "name": "Oil Filter",
        "itemCode": "ITEM-OIL-123456"
      },
      "type": "reparation_use",
      "quantity": 1,
      "quantityBefore": 26,
      "quantityAfter": 25,
      "unitPrice": 25.00,
      "totalAmount": 25.00,
      "reparation": {
        "_id": "64rep...",
        "description": "Oil change",
        "status": "completed"
      },
      "fournisseur": null,
      "reference": "",
      "notes": "Used in reparation for Toyota Camry",
      "createdBy": {
        "_id": "64user...",
        "name": "John Mechanic"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Single Stock Transaction
```javascript
GET /stock-transactions/:id

// Example Request
const getStockTransaction = async (transactionId) => {
  const response = await fetch(`${API_URL}/stock-transactions/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    // ... full transaction details
  }
}
```

### Create Manual Stock Transaction
```javascript
POST /stock-transactions

// Example Request
const createStockTransaction = async (transactionData) => {
  const response = await fetch(`${API_URL}/stock-transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transactionData)
  });
  return response.json();
};

// Request Body
{
  "item": "64item123...", // Required: Item ID
  "type": "purchase", // Required: purchase, adjustment, damage, return_to_supplier
  "quantity": 10, // Required
  "fournisseur": "64fournisseur...", // Optional: For purchase type
  "reference": "PO-2024-001", // Optional: Invoice/PO number
  "notes": "Restocking from supplier" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created transaction
  }
}

// Important Notes:
// - Item stock is automatically updated
// - Cannot create reparation_use or reparation_return manually (created by system)
// - Validates stock availability for deduction types
```

### Get Stock Transaction Statistics
```javascript
GET /stock-transactions/stats

// Example Request
const getStockStats = async () => {
  const response = await fetch(`${API_URL}/stock-transactions/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": [
    {
      "_id": "reparation_use",
      "count": 45,
      "totalQuantity": 120,
      "totalAmount": 3500.00
    },
    {
      "_id": "purchase",
      "count": 30,
      "totalQuantity": 500,
      "totalAmount": 7500.00
    }
  ]
}
```

---

## Categories

### Get All Categories
```javascript
GET /categories

// Example Request
const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "64cat123...",
      "name": "Filters",
      "description": "All types of filters",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Category
```javascript
GET /categories/:id

// Example Request
const getCategory = async (categoryId) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    "_id": "64cat123...",
    "name": "Filters",
    "description": "All types of filters"
  }
}
```

### Create Category
```javascript
POST /categories
// Requires admin role

// Example Request
const createCategory = async (categoryData) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  return response.json();
};

// Request Body
{
  "name": "Filters", // Required, unique
  "description": "All types of filters" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created category
  }
}
```

### Update Category
```javascript
PUT /categories/:id
// Requires admin role

// Example Request
const updateCategory = async (categoryId, updates) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body
{
  "name": "Updated Name",
  "description": "Updated description"
}

// Response
{
  "success": true,
  "data": {
    // ... updated category
  }
}
```

### Delete Category
```javascript
DELETE /categories/:id
// Requires admin role

// Example Request
const deleteCategory = async (categoryId) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {}
}
```

---

## Suppliers (Fournisseurs)

### Get All Suppliers
```javascript
GET /fournisseurs

// Example Request
const getSuppliers = async () => {
  const response = await fetch(`${API_URL}/fournisseurs`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "64four123...",
      "name": "Auto Parts Inc",
      "contactPerson": "John Doe",
      "email": "contact@autoparts.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, State 12345",
      "notes": "Preferred supplier for filters",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Supplier
```javascript
GET /fournisseurs/:id

// Example Request
const getSupplier = async (supplierId) => {
  const response = await fetch(`${API_URL}/fournisseurs/${supplierId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    // ... supplier details
  }
}
```

### Create Supplier
```javascript
POST /fournisseurs
// Requires admin role

// Example Request
const createSupplier = async (supplierData) => {
  const response = await fetch(`${API_URL}/fournisseurs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(supplierData)
  });
  return response.json();
};

// Request Body
{
  "name": "Auto Parts Inc", // Required
  "contactPerson": "John Doe", // Optional
  "email": "contact@autoparts.com", // Optional
  "phone": "+1234567890", // Optional
  "address": "123 Main St, City, State 12345", // Optional
  "notes": "Preferred supplier" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created supplier
  }
}
```

### Update Supplier
```javascript
PUT /fournisseurs/:id
// Requires admin role

// Example Request
const updateSupplier = async (supplierId, updates) => {
  const response = await fetch(`${API_URL}/fournisseurs/${supplierId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body (all fields optional)
{
  "name": "Updated Name",
  "phone": "+0987654321"
}

// Response
{
  "success": true,
  "data": {
    // ... updated supplier
  }
}
```

### Delete Supplier
```javascript
DELETE /fournisseurs/:id
// Requires admin role

// Example Request
const deleteSupplier = async (supplierId) => {
  const response = await fetch(`${API_URL}/fournisseurs/${supplierId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {}
}
```

---

## Services

### Get All Services
```javascript
GET /services

// Query Parameters
?page=1
?limit=10
?category=maintenance // maintenance, repair, diagnostic, bodywork, other
?status=active // active, inactive
?search=oil
?sort=-createdAt

// Example Request
const getServices = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/services?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "64serv123...",
      "name": "Oil Change Service",
      "description": "Complete oil change with filter",
      "price": 30.00,
      "duration": 1, // hours
      "category": "maintenance",
      "status": "active",
      "notes": "Includes disposal fee",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Service
```javascript
GET /services/:id

// Example Request
const getService = async (serviceId) => {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    // ... service details
  }
}
```

### Create Service
```javascript
POST /services

// Example Request
const createService = async (serviceData) => {
  const response = await fetch(`${API_URL}/services`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData)
  });
  return response.json();
};

// Request Body
{
  "name": "Oil Change Service", // Required
  "description": "Complete oil change with filter", // Optional
  "price": 30.00, // Required
  "duration": 1, // Optional: hours
  "category": "maintenance", // Optional: maintenance, repair, diagnostic, bodywork, other
  "status": "active", // Optional: active, inactive (default: active)
  "notes": "Includes disposal fee" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created service
  }
}
```

### Update Service
```javascript
PUT /services/:id

// Example Request
const updateService = async (serviceId, updates) => {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body (all fields optional)
{
  "name": "Premium Oil Change",
  "price": 40.00,
  "status": "inactive"
}

// Response
{
  "success": true,
  "data": {
    // ... updated service
  }
}
```

### Delete Service
```javascript
DELETE /services/:id

// Example Request
const deleteService = async (serviceId) => {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "message": "Service removed"
}
```

---

## Cars

### Get All Cars
```javascript
GET /cars

// Query Parameters
?page=1
?limit=10
?search=toyota // Searches make, model, licensePlate, owner.name
?year=2020
?sort=-createdAt

// Example Request
const getCars = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_URL}/cars?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "64car123...",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "licensePlate": "ABC-123",
      "vin": "1HGBH41JXMN109186",
      "owner": {
        "name": "Jane Smith",
        "phone": "+1234567890",
        "email": "jane@email.com"
      },
      "notes": "Regular customer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Car
```javascript
GET /cars/:id

// Example Request
const getCar = async (carId) => {
  const response = await fetch(`${API_URL}/cars/${carId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    // ... car details
  }
}
```

### Create Car
```javascript
POST /cars

// Example Request
const createCar = async (carData) => {
  const response = await fetch(`${API_URL}/cars`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(carData)
  });
  return response.json();
};

// Request Body
{
  "make": "Toyota", // Required
  "model": "Camry", // Required
  "year": 2020, // Required
  "licensePlate": "ABC-123", // Optional
  "vin": "1HGBH41JXMN109186", // Optional
  "owner": { // Required
    "name": "Jane Smith", // Required
    "phone": "+1234567890", // Optional
    "email": "jane@email.com" // Optional
  },
  "notes": "Regular customer" // Optional
}

// Response
{
  "success": true,
  "data": {
    // ... created car
  }
}
```

### Update Car
```javascript
PUT /cars/:id

// Example Request
const updateCar = async (carId, updates) => {
  const response = await fetch(`${API_URL}/cars/${carId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Request Body (all fields optional)
{
  "licensePlate": "XYZ-789",
  "owner": {
    "phone": "+0987654321"
  }
}

// Response
{
  "success": true,
  "data": {
    // ... updated car
  }
}
```

### Delete Car
```javascript
DELETE /cars/:id

// Example Request
const deleteCar = async (carId) => {
  const response = await fetch(`${API_URL}/cars/${carId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {}
}
```

---

## Users & Authentication

### Register
```javascript
POST /auth/register

// Example Request
const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Request Body
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "password123" // Min 6 characters
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64user123...",
    "name": "John Doe",
    "email": "john@email.com",
    "role": "user"
  }
}
```

### Login
```javascript
POST /auth/login

// Example Request
const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Request Body
{
  "email": "john@email.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64user123...",
    "name": "John Doe",
    "email": "john@email.com",
    "role": "user"
  }
}
```

### Get Current User
```javascript
GET /auth/me

// Example Request
const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Response
{
  "success": true,
  "data": {
    "_id": "64user123...",
    "name": "John Doe",
    "email": "john@email.com",
    "role": "user"
  }
}
```

---

## Error Handling

All endpoints return errors in this format:

```javascript
// Error Response
{
  "success": false,
  "error": "Error message here"
}

// Common HTTP Status Codes
200 - Success
201 - Created
400 - Bad Request (validation error)
401 - Unauthorized (not logged in)
403 - Forbidden (insufficient permissions)
404 - Not Found
500 - Server Error
```

### Example Error Handling in React
```javascript
const handleApiCall = async () => {
  try {
    const response = await fetch(`${API_URL}/items`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle error (show toast, etc.)
    throw error;
  }
};
```

---

## React Integration Examples

### API Service Setup
```javascript
// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Base fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

export const itemsAPI = {
  getAll: (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiFetch(`/items?${queryParams}`);
  },
  
  getOne: (id) => apiFetch(`/items/${id}`),
  
  create: (data) => apiFetch('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id, data) => apiFetch(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiFetch(`/items/${id}`, {
    method: 'DELETE',
  }),
  
  updateQuantity: (id, quantity, operation, notes) => apiFetch(`/items/${id}/quantity`, {
    method: 'PUT',
    body: JSON.stringify({ quantity, operation, notes }),
  }),
  
  getHistory: (id, page = 1) => apiFetch(`/items/${id}/history?page=${page}`),
  
  getLowStock: () => apiFetch('/items/low-stock'),
};

export const reparationsAPI = {
  getAll: (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiFetch(`/reparations?${queryParams}`);
  },
  
  getOne: (id) => apiFetch(`/reparations/${id}`),
  
  create: (data) => apiFetch('/reparations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateStatus: (id, status) => apiFetch(`/reparations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  
  updateFull: (id, data) => apiFetch(`/reparations/${id}/full`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id) => apiFetch(`/reparations/${id}`, {
    method: 'DELETE',
  }),
};

export const stockTransactionsAPI = {
  getAll: (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiFetch(`/stock-transactions?${queryParams}`);
  },
  
  getOne: (id) => apiFetch(`/stock-transactions/${id}`),
  
  create: (data) => apiFetch('/stock-transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getStats: () => apiFetch('/stock-transactions/stats'),
};

// Export other APIs similarly...
export const categoriesAPI = { /* ... */ };
export const suppliersAPI = { /* ... */ };
export const servicesAPI = { /* ... */ };
export const carsAPI = { /* ... */ };
export const authAPI = { /* ... */ };
```

### React Hook Example
```javascript
// src/hooks/useItems.js
import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';

export const useItems = (filters = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await itemsAPI.getAll(filters);
        setItems(response.data);
        setPagination({
          page: response.page,
          pages: response.pages,
          total: response.total,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [JSON.stringify(filters)]);

  return { items, loading, error, pagination };
};
```

### Component Example
```javascript
// src/components/ItemList.jsx
import React, { useState } from 'react';
import { useItems } from '../hooks/useItems';
import { itemsAPI } from '../services/api';

const ItemList = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { items, loading, error, pagination } = useItems(filters);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await itemsAPI.delete(id);
        // Refresh list
        setFilters({ ...filters });
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Items</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Buy Price</th>
            <th>Sell Price</th>
            <th>Profit</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>${item.buyPrice.toFixed(2)}</td>
              <td>${item.sellPrice.toFixed(2)}</td>
              <td>${item.profitMargin.toFixed(2)} ({item.profitMarginPercent}%)</td>
              <td>{item.quantity}</td>
              <td>{item.status}</td>
              <td>
                <button onClick={() => handleDelete(item._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      <div>
        Page {pagination.page} of {pagination.pages}
        <button 
          disabled={pagination.page === 1}
          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
        >
          Previous
        </button>
        <button 
          disabled={pagination.page === pagination.pages}
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ItemList;
```

---

## Important Notes

1. **Stock Management**: Stock is automatically managed when creating/updating/deleting reparations
2. **Price Capture**: Prices (buyPrice, sellPrice) are captured at the time of reparation creation
3. **Transactions**: All stock movements are logged in stock transactions
4. **Validation**: The API validates stock availability before allowing operations
5. **Cascading**: Deleting a reparation returns items to stock
6. **Profit Tracking**: Reparations automatically calculate profit from parts

## Need Help?

For questions or issues, please refer to the UPGRADE_GUIDE.md file or contact the development team.
