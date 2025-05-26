# New API Endpoints

This document outlines the newly added endpoints for services and car reparations.

## Services

### Create a Service
- **URL**: `/api/services`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **Request Body**:
```json
{
  "name": "Oil Change",
  "description": "Complete oil change service with filter replacement",
  "price": 50,
  "duration": 1,
  "category": "maintenance",
  "status": "active",
  "notes": "Optional notes about the service"
}
```
- **Success Response**: `201 Created`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Oil Change",
  "description": "Complete oil change service with filter replacement",
  "price": 50,
  "duration": 1,
  "category": "maintenance",
  "status": "active",
  "notes": "Optional notes about the service",
  "createdAt": "2023-06-22T10:00:00.000Z",
  "updatedAt": "2023-06-22T10:00:00.000Z"
}
```

### Get All Services
- **URL**: `/api/services`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **Success Response**: `200 OK`
```json
[
  {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Oil Change",
    "description": "Complete oil change service with filter replacement",
    "price": 50,
    "duration": 1,
    "category": "maintenance",
    "status": "active",
    "notes": "Optional notes about the service",
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z"
  },
  {
    "_id": "60d21b4667d0d8992e610c86",
    "name": "Brake Inspection",
    "description": "Complete brake system inspection",
    "price": 30,
    "duration": 0.5,
    "category": "diagnostic",
    "status": "active",
    "notes": "",
    "createdAt": "2023-06-22T10:30:00.000Z",
    "updatedAt": "2023-06-22T10:30:00.000Z"
  }
]
```

### Get a Single Service
- **URL**: `/api/services/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **URL Parameters**: `id=[string]` where `id` is the ID of the service
- **Success Response**: `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Oil Change",
  "description": "Complete oil change service with filter replacement",
  "price": 50,
  "duration": 1,
  "category": "maintenance",
  "status": "active",
  "notes": "Optional notes about the service",
  "createdAt": "2023-06-22T10:00:00.000Z",
  "updatedAt": "2023-06-22T10:00:00.000Z"
}
```

### Update a Service
- **URL**: `/api/services/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **URL Parameters**: `id=[string]` where `id` is the ID of the service
- **Request Body**: Fields to update
```json
{
  "price": 55,
  "status": "inactive"
}
```
- **Success Response**: `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Oil Change",
  "description": "Complete oil change service with filter replacement",
  "price": 55,
  "duration": 1,
  "category": "maintenance",
  "status": "inactive",
  "notes": "Optional notes about the service",
  "createdAt": "2023-06-22T10:00:00.000Z",
  "updatedAt": "2023-06-23T11:30:00.000Z"
}
```

### Delete a Service
- **URL**: `/api/services/:id`
- **Method**: `DELETE`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **URL Parameters**: `id=[string]` where `id` is the ID of the service
- **Success Response**: `200 OK`
```json
{
  "message": "Service removed"
}
```

## Reparations

### Create a Reparation
- **URL**: `/api/reparations`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **Request Body**:
```json
{
  "car": "60d21b4667d0d8992e610c87",
  "description": "Regular maintenance and oil change",
  "technician": "John Smith",
  "laborCost": 75,
  "items": [
    {
      "item": "60d21b4667d0d8992e610c88",
      "quantity": 2
    }
  ],
  "services": [
    {
      "service": "60d21b4667d0d8992e610c85",
      "notes": "Used synthetic oil"
    }
  ],
  "notes": "Customer requested synthetic oil"
}
```
- **Success Response**: `201 Created`
```json
{
  "_id": "60d21b4667d0d8992e610c89",
  "car": {
    "_id": "60d21b4667d0d8992e610c87",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020
  },
  "description": "Regular maintenance and oil change",
  "startDate": "2023-06-24T09:00:00.000Z",
  "status": "pending",
  "technician": "John Smith",
  "items": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "item": "60d21b4667d0d8992e610c88",
      "quantity": 2,
      "price": 25
    }
  ],
  "services": [
    {
      "_id": "60d21b4667d0d8992e610c91",
      "service": "60d21b4667d0d8992e610c85",
      "price": 50,
      "notes": "Used synthetic oil"
    }
  ],
  "totalCost": 175,
  "partsCost": 50,
  "laborCost": 75,
  "servicesCost": 50,
  "notes": "Customer requested synthetic oil",
  "createdBy": "60d21b4667d0d8992e610c92",
  "createdAt": "2023-06-24T09:00:00.000Z",
  "updatedAt": "2023-06-24T09:00:00.000Z"
}
```

**Important Notes on Inventory Management:**
- Creating a reparation automatically reduces the stock quantities of all items used
- The system verifies that sufficient stock is available before creating the repair
- If any item has insufficient stock, the entire operation will fail
- Item prices are captured at the time of repair creation to maintain historical accuracy
- Service prices are also captured at the time of creation
- The total cost is calculated automatically based on parts, services, and labor costs

### Get All Reparations
- **URL**: `/api/reparations`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **Success Response**: `200 OK`
```json
[
  {
    "_id": "60d21b4667d0d8992e610c89",
    "car": {
      "_id": "60d21b4667d0d8992e610c87",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020
    },
    "description": "Regular maintenance and oil change",
    "startDate": "2023-06-24T09:00:00.000Z",
    "status": "pending",
    "technician": "John Smith",
    "items": [
      {
        "_id": "60d21b4667d0d8992e610c90",
        "item": {
          "_id": "60d21b4667d0d8992e610c88",
          "name": "Oil Filter",
          "price": 25
        },
        "quantity": 2,
        "price": 25
      }
    ],
    "services": [
      {
        "_id": "60d21b4667d0d8992e610c91",
        "service": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "Oil Change",
          "price": 50
        },
        "price": 50,
        "notes": "Used synthetic oil"
      }
    ],
    "totalCost": 175,
    "partsCost": 50,
    "laborCost": 75,
    "servicesCost": 50,
    "notes": "Customer requested synthetic oil",
    "createdBy": {
      "_id": "60d21b4667d0d8992e610c92",
      "name": "Admin User"
    },
    "createdAt": "2023-06-24T09:00:00.000Z",
    "updatedAt": "2023-06-24T09:00:00.000Z"
  }
]
```

### Get a Single Reparation
- **URL**: `/api/reparations/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **URL Parameters**: `id=[string]` where `id` is the ID of the reparation
- **Success Response**: `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c89",
  "car": {
    "_id": "60d21b4667d0d8992e610c87",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020
  },
  "description": "Regular maintenance and oil change",
  "startDate": "2023-06-24T09:00:00.000Z",
  "status": "pending",
  "technician": "John Smith",
  "items": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "item": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "Oil Filter",
        "price": 25
      },
      "quantity": 2,
      "price": 25
    }
  ],
  "services": [
    {
      "_id": "60d21b4667d0d8992e610c91",
      "service": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Oil Change",
        "price": 50
      },
      "price": 50,
      "notes": "Used synthetic oil"
    }
  ],
  "totalCost": 175,
  "partsCost": 50,
  "laborCost": 75,
  "servicesCost": 50,
  "notes": "Customer requested synthetic oil",
  "createdBy": {
    "_id": "60d21b4667d0d8992e610c92",
    "name": "Admin User"
  },
  "createdAt": "2023-06-24T09:00:00.000Z",
  "updatedAt": "2023-06-24T09:00:00.000Z"
}
```

### Update Reparation Status
- **URL**: `/api/reparations/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **Permissions required**: Authenticated user
- **URL Parameters**: `id=[string]` where `id` is the ID of the reparation
- **Request Body**:
```json
{
  "status": "completed",
  "endDate": "2023-06-25T15:00:00.000Z"
}
```
- **Success Response**: `200 OK`
```json
{
  "_id": "60d21b4667d0d8992e610c89",
  "car": "60d21b4667d0d8992e610c87",
  "description": "Regular maintenance and oil change",
  "startDate": "2023-06-24T09:00:00.000Z",
  "endDate": "2023-06-25T15:00:00.000Z",
  "status": "completed",
  "technician": "John Smith",
  "items": [
    {
      "_id": "60d21b4667d0d8992e610c90",
      "item": "60d21b4667d0d8992e610c88",
      "quantity": 2,
      "price": 25
    }
  ],
  "services": [
    {
      "_id": "60d21b4667d0d8992e610c91",
      "service": "60d21b4667d0d8992e610c85",
      "price": 50,
      "notes": "Used synthetic oil"
    }
  ],
  "totalCost": 175,
  "partsCost": 50,
  "laborCost": 75,
  "servicesCost": 50,
  "notes": "Customer requested synthetic oil",
  "createdBy": "60d21b4667d0d8992e610c92",
  "createdAt": "2023-06-24T09:00:00.000Z",
  "updatedAt": "2023-06-25T15:00:00.000Z"
}
```

## Data Models

### Service Model
```
{
  name: String (required),
  description: String,
  price: Number (required),
  duration: Number,
  category: String (enum: ['maintenance', 'repair', 'diagnostic', 'bodywork', 'other']),
  status: String (enum: ['active', 'inactive']),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Reparation Model
```
{
  car: ObjectId (reference to Car model, required),
  description: String (required),
  startDate: Date (default: current date),
  endDate: Date,
  status: String (enum: ['pending', 'in_progress', 'completed', 'cancelled']),
  technician: String,
  items: [
    {
      item: ObjectId (reference to Item model),
      quantity: Number (required, default: 1),
      price: Number
    }
  ],
  services: [
    {
      service: ObjectId (reference to Service model),
      price: Number,
      notes: String
    }
  ],
  totalCost: Number (default: 0),
  partsCost: Number (default: 0),
  laborCost: Number (default: 0),
  servicesCost: Number (default: 0),
  notes: String,
  createdBy: ObjectId (reference to User model),
  createdAt: Date,
  updatedAt: Date
}
``` 