# Stock Management API

A robust backend system for managing inventory, suppliers, car repairs, and more.

## Features

- User authentication and authorization with JWT
- CRUD operations for items, categories, suppliers, cars, and repairs
- Inventory management with status tracking
- Dashboard with statistics and reporting
- Secure API endpoints with validation

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- JWT Authentication
- Express Validator

## Installation

1. Clone the repository
```
git clone <repo-url>
cd stock-management-api
```

2. Install dependencies
```
npm install
```

3. Create a .env file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

4. Start the development server
```
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/me`: Get current user

### Users
- `GET /api/users`: Get all users (Admin only)
- `GET /api/users/:id`: Get a specific user (Admin only)
- `POST /api/users`: Create a new user (Admin only)
- `PUT /api/users/:id`: Update user (Admin only)
- `DELETE /api/users/:id`: Delete user (Admin only)

### Categories
- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get a specific category
- `POST /api/categories`: Create a new category (Admin only)
- `PUT /api/categories/:id`: Update category (Admin only)
- `DELETE /api/categories/:id`: Delete category (Admin only)

### Suppliers (Fournisseurs)
- `GET /api/fournisseurs`: Get all suppliers
- `GET /api/fournisseurs/:id`: Get a specific supplier
- `POST /api/fournisseurs`: Create a new supplier (Admin only)
- `PUT /api/fournisseurs/:id`: Update supplier (Admin only)
- `DELETE /api/fournisseurs/:id`: Delete supplier (Admin only)

### Items
- `GET /api/items`: Get all items
- `GET /api/items/:id`: Get a specific item
- `POST /api/items`: Create a new item (Admin only)
- `PUT /api/items/:id`: Update item (Admin only)
- `DELETE /api/items/:id`: Delete item (Admin only)
- `PUT /api/items/:id/quantity`: Update item quantity

### Cars
- `GET /api/cars`: Get all cars
- `GET /api/cars/:id`: Get a specific car
- `POST /api/cars`: Create a new car
- `PUT /api/cars/:id`: Update car
- `DELETE /api/cars/:id`: Delete car (Admin only)

### Services
- `GET /api/services`: Get all services
- `GET /api/services/:id`: Get a specific service
- `POST /api/services`: Create a new service
- `PUT /api/services/:id`: Update service
- `DELETE /api/services/:id`: Delete service

### Repairs (Reparations)
- `GET /api/reparations`: Get all repairs
- `GET /api/reparations/:id`: Get a specific repair
- `POST /api/reparations`: Create a new repair (reduces item stock)
- `PUT /api/reparations/:id`: Update repair status

### Dashboard
- `GET /api/dashboard`: Get dashboard statistics

## License

MIT