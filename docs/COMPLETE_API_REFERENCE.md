# Complete API Reference

Base URL
```
http://localhost:5000/api
```

Authentication
- All endpoints except `/auth/register` and `/auth/login` require a JWT.
- Include header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

Access Control
- `protect`: requires a valid JWT.
- `authorize('admin')`: only users with role `admin`.

Table of Contents
- Authentication
- Users (Admin)
- Dashboard
- Items
- Item Stock Utilities
- Categories
- Suppliers (Fournisseurs)
- Cars
- Services
- Stock Transactions
- Errors

Authentication
- POST /auth/register
  - Body: { name, email, password, role? }
  - Response: { success, user{_id,name,email,role}, token }
  - Public
- POST /auth/login
  - Body: { email, password }
  - Response: { success, user{_id,name,email,role}, token }
  - Public
- GET /auth/me
  - Response: { success, data{ _id,name,email,role,createdAt } }
  - protect

Users (Admin)
- Middleware for all below: protect, authorize('admin')
- GET /users
  - Query: none
  - Response: { success, count, data: [ user(no password) ] }
- GET /users/:id
  - Response: { success, data: user(no password) }
  - 404 if not found
- POST /users
  - Body (validated): { name, email, password(min 6), role in ['user','admin'] }
  - Responses:
    - 201 { success, data: { _id,name,email,role } }
    - 400 if email exists
- PUT /users/:id
  - Body (optional fields): { name?, email?, role? }
  - Password is ignored if provided
  - Response: { success, data: user(no password) }
  - 404 if not found
- DELETE /users/:id
  - Response: { success, data: {} }
  - 404 if not found

Dashboard
- GET /dashboard
  - protect
  - Query: dateDebut?, dateFin? (ISO dates). Default window: last 30 days
  - Response: { success, data: {
      counts: { items, fournisseurs, categories, cars, reparations },
      inventory: { value, lowStock, outOfStock },
      repairs: { active, completed, revenue, dateDebut|null, dateFin|null },
      topItems: [ { _id,name,quantity } ]
    } }

Items
- Middleware: protect for all
- GET /items
  - Query: page?, limit?, category?, fournisseur?, status?, search?, sort?
  - Response: { success, count, total, page, pages, data: [ item(populated category,fournisseur) ] }
- GET /items/:id
  - Response: { success, data: item(populated) }
  - 404 if not found
- POST /items
  - authorize('admin')
  - Body (validated): { name, buyPrice:number, sellPrice:number, quantity:number, category, fournisseur, description?, threshold?, location?, itemCode?, notes? }
  - Side effects: if quantity > 0 creates initial StockTransaction(type: 'purchase')
  - Response: 201 { success, data: item(populated) }
- PUT /items/:id
  - authorize('admin')
  - Body (optional, validated): { name?, buyPrice?, sellPrice?, quantity?, ... }
  - Side effects: if quantity changes, creates StockTransaction(type: 'adjustment') recording diff
  - Response: { success, data: item(populated) }
  - 404 if not found
- DELETE /items/:id
  - authorize('admin')
  - Response: { success, data: {} }
  - 404 if not found

Item Stock Utilities
- GET /items/low-stock
  - protect
  - Response: { success, count, data: [ items with status in ['low_stock','out_of_stock'] ] }
- GET /items/:id/history
  - protect
  - Query: page=1, limit=20, type? (filter by transaction type)
  - Response: { success, count, total, page, pages, data: [ transactions(populated reparation, fournisseur, createdBy) ] }
- PUT /items/:id/quantity
  - protect
  - Body (validated): { quantity:number, operation:'add'|'subtract', reference?, notes? }
  - Validations: cannot subtract more than available
  - Side effects: updates item.quantity and creates StockTransaction(type: purchase|adjustment)
  - Response: { success, data: updated item(populated) }

Categories
- Middleware: protect for all
- GET /categories
  - Response: { success, count, data }
- GET /categories/:id
  - Response: { success, data }
  - 404 if not found
- POST /categories
  - authorize('admin')
  - Body: { name, description? }
  - Response: 201 { success, data }
- PUT /categories/:id
  - authorize('admin')
  - Body: { name, description? }
  - Response: { success, data }
  - 404 if not found
- DELETE /categories/:id
  - authorize('admin')
  - Response: { success, data: {} }

Suppliers (Fournisseurs)
- Middleware: protect for all
- GET /fournisseurs
  - Response: { success, count, data }
- GET /fournisseurs/:id
  - Response: { success, data }
  - 404 if not found
- POST /fournisseurs
  - authorize('admin')
  - Body: { name, email?, contactPerson?, phone?, address?, notes? }
  - Response: 201 { success, data }
- PUT /fournisseurs/:id
  - authorize('admin')
  - Body: { name, email?, contactPerson?, phone?, address?, notes? }
  - Response: { success, data }
  - 404 if not found
- DELETE /fournisseurs/:id
  - authorize('admin')
  - Response: { success, data: {} }

Cars
- Middleware: protect for all
- GET /cars
  - Query: page?, limit?, search?(make|model|licensePlate|owner.name), year?, sort?
  - Response: { success, count, total, page, pages, data }
- GET /cars/:id
  - Response: { success, data }
  - 404 if not found
- POST /cars
  - Body (validated): { make, model, year:number, licensePlate?, vin?, owner:{ name, phone?, email? }, notes? }
  - Response: 201 { success, data }
- PUT /cars/:id
  - Body (optional, validated): any car fields
  - Response: { success, data }
  - 404 if not found
- DELETE /cars/:id
  - authorize('admin')
  - Response: { success, data: {} }

Services
- Middleware: protect for all
- POST /services
  - Body: { name, description?, price:number, duration?, category?, status?, notes? }
  - Response: 201 created service
- GET /services
  - Query: page?, limit?, category?, status?, search?, sort?
  - Response: { success, count, total, page, pages, data }
- GET /services/:id
  - Response: 200 service; 404 if not found
- PUT /services/:id
  - Body: optional fields
  - Response: 200 updated service; 404 if not found
- DELETE /services/:id
  - Response: 200 { message: 'Service removed' }

Stock Transactions
- Middleware: protect for all
- GET /stock-transactions
  - Query: page?, limit?, item?, type?('purchase','sale','adjustment','reparation_use','reparation_return','damage','return_to_supplier'), reparation?, startDate?, endDate?, sort?
  - Response: { success, count, total, page, pages, data(populated item, reparation, fournisseur, createdBy) }
- GET /stock-transactions/:id
  - Response: { success, data(populated) }
  - 404 if not found
- POST /stock-transactions
  - Body: { item, type: 'purchase'|'adjustment'|'damage'|'return_to_supplier', quantity:number, fournisseur?, reference?, notes? }
  - Validations: cannot deduct more than available; cannot manually create 'reparation_use' or 'reparation_return'
  - Side effects: updates item.quantity and creates transaction with unitPrice from buyPrice(for purchase) or sellPrice(others)
  - Response: 201 { success, data(populated) }
- GET /stock-transactions/stats
  - Response: { success, data: [ { _id:type, count, totalQuantity, totalAmount } ] }

Reparations
- Middleware: protect for all
- GET /reparations
  - Query: page?, limit?, car?, status?, technician?, startDate?, endDate?, search?, sort?
  - Response: { success, count, total, page, pages, data(populated car, items.item, services.service, createdBy) }
- GET /reparations/:id
  - Response: 200 populated reparation; 404 if not found
- POST /reparations
  - Body: { car, description, items?:[ { item, quantity } ], services?:[ { service, notes? } ], technician?, laborCost?, notes? }
  - Validations: car must exist; item and service IDs validated; sufficient stock required
  - Side effects: deducts item stock and creates StockTransactions(type: 'reparation_use')
  - Response: 201 reparation
- PUT /reparations/:id
  - Body: { status?, endDate? }
  - Side effects: if status becomes 'completed' and no endDate, sets endDate = now
  - Response: 200 reparation
- PUT /reparations/:id/full
  - Replaces items/services and updates other fields
  - Process: return previous items to stock with 'reparation_return' transactions; validate and deduct new items with 'reparation_use'
  - Response: 200 populated reparation
- DELETE /reparations/:id
  - Side effects: returns items to stock and creates 'reparation_return' transactions; then deletes reparation
  - Response: 200 { message: 'Reparation removed and items returned to stock' }

Errors
- Structure
```
{ "success": false, "error": "Message" }
```
- Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error

Notes
- Low stock and out-of-stock are tracked on items and surfaced in dashboard and /items/low-stock.
- All list endpoints support pagination and sorting where applicable.
- Most GET detail endpoints populate related entities for convenient UI rendering.
