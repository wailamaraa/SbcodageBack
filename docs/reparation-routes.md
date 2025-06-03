# Reparation Routes Documentation

## Overview
This document describes the available endpoints for managing reparations in the system.

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Create Reparation
- **URL**: `/api/reparations`
- **Method**: `POST`
- **Description**: Creates a new reparation record
- **Request Body**:
  ```json
  {
    "car": "carId123",
    "description": "Engine repair",
    "items": [
      {
        "item": "itemId123",
        "quantity": 2
      }
    ],
    "services": [
      {
        "service": "serviceId123",
        "notes": "Engine diagnostic"
      }
    ],
    "technician": "John Doe",
    "laborCost": 150,
    "notes": "Customer requested priority service"
  }
  ```

### 2. Get All Reparations
- **URL**: `/api/reparations`
- **Method**: `GET`
- **Description**: Retrieves all reparations with optional filtering
- **Query Parameters**:
  - `car`: Filter by car ID
  - `status`: Filter by status
  - `technician`: Filter by technician name
  - `startDate`: Filter by start date
  - `endDate`: Filter by end date
  - `search`: Search in description
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field (prefix with - for descending)

### 3. Get Single Reparation
- **URL**: `/api/reparations/:id`
- **Method**: `GET`
- **Description**: Retrieves a single reparation by ID
- **URL Parameters**:
  - `id`: Reparation ID

### 4. Update Reparation Status
- **URL**: `/api/reparations/:id`
- **Method**: `PUT`
- **Description**: Updates the status of a reparation
- **URL Parameters**:
  - `id`: Reparation ID
- **Request Body**:
  ```json
  {
    "status": "in_progress",
    "endDate": "2024-03-20T10:00:00Z" // Optional, only for completed status
  }
  ```

### 5. Full Reparation Update
- **URL**: `/api/reparations/:id/full`
- **Method**: `PUT`
- **Description**: Updates all aspects of a reparation
- **URL Parameters**:
  - `id`: Reparation ID
- **Request Body**:
  ```json
  {
    "description": "Complete engine overhaul",
    "items": [
      {
        "item": "itemId123",
        "quantity": 2
      }
    ],
    "services": [
      {
        "service": "serviceId123",
        "notes": "Engine diagnostic"
      }
    ],
    "technician": "John Doe",
    "laborCost": 150,
    "status": "in_progress",
    "notes": "Customer requested priority service"
  }
  ```
- **Features**:
  - Updates all reparation attributes
  - Manages inventory stock levels
  - Validates item availability
  - Updates service prices
  - Automatically sets end date for completed status
  - Returns fully populated response with related data

### 6. Delete Reparation
- **URL**: `/api/reparations/:id`
- **Method**: `DELETE`
- **Description**: Deletes a reparation and returns items to stock
- **URL Parameters**:
  - `id`: Reparation ID

## Response Format
All endpoints return JSON responses with the following structure:
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

## Error Responses
Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Server Error

## Notes
- The full update endpoint (`/api/reparations/:id/full`) is recommended when you need to update multiple attributes of a reparation
- The status update endpoint (`/api/reparations/:id`) is more efficient for quick status changes
- All endpoints that modify items will automatically handle inventory stock levels
- The system maintains price history for items and services used in reparations 