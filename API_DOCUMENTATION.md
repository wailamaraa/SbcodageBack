# Stock Management API Documentation

## Table of Contents
1. [Base URL and Environment Configuration](#base-url-and-environment-configuration)
2. [Authentication and Authorization](#authentication-and-authorization)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
5. [Data Models](#data-models)
6. [Frontend Implementation Guidelines](#frontend-implementation-guidelines)
7. [Workflow Examples](#workflow-examples)

## Base URL and Environment Configuration

### Development
```
http://localhost:5000/api
```

### Production
```
https://your-api-domain.com/api
```

### Environment Variables
Frontend applications should configure the following environment variables:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_VERSION=1.0.0
```

## Authentication and Authorization

### Token Management
- Tokens are stored in localStorage with key `auth_token`
- Token expiration: 24 hours
- Implement auto-refresh token mechanism 15 minutes before expiration

### API Headers
All authenticated requests must include:
```javascript
{
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
}
```

### Authentication State Management
Recommended implementation:
```javascript
// Example using React Context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {}
});

// Usage in API calls
const authToken = localStorage.getItem('auth_token');
const headers = {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
};
```

## Error Handling

### Standard Error Format
```typescript
interface ApiError {
  success: false;
  error: string;
  details?: any;
  statusCode?: number;
}
```

### Error Handling Implementation
```javascript
// Axios interceptor example
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // Handle unauthorized access
      store.dispatch(logout());
      return Promise.reject(error);
    }
    
    if (error.response.status === 403) {
      // Handle forbidden access
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);
```

### Common HTTP Status Codes and Handling
```javascript
const handleApiError = (error) => {
  switch (error.response?.status) {
    case 400: // Bad Request
      return 'Invalid input data';
    case 401: // Unauthorized
      return 'Please login to continue';
    case 403: // Forbidden
      return 'You don\'t have permission to perform this action';
    case 404: // Not Found
      return 'Resource not found';
    case 422: // Validation Error
      return error.response.data.error;
    case 500: // Server Error
      return 'An unexpected error occurred';
    default:
      return 'Something went wrong';
  }
};
```

## Frontend Implementation Guidelines

### Data Fetching
1. **Loading States**
```typescript
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Usage Example
const [state, setState] = useState<FetchState<Item[]>>({
  data: null,
  loading: false,
  error: null
});
```

2. **Pagination Implementation**
```typescript
interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}
```

3. **Caching Strategy**
```javascript
// Example using React Query
const { data, isLoading, error } = useQuery(
  ['items', queryParams],
  () => fetchItems(queryParams),
  {
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache kept for 30 minutes
    retry: 3
  }
);
```

### Real-time Updates
For inventory and repair status changes:

```javascript
// WebSocket connection (if implemented on backend)
const socket = io(REACT_APP_WS_URL, {
  auth: {
    token: authToken
  }
});

// Listen for updates
socket.on('inventory-update', (data) => {
  // Update local state
});

socket.on('repair-status-change', (data) => {
  // Update local state
});
```

### Form Handling
1. **Validation Schema Example**
```javascript
const serviceSchema = yup.object().shape({
  name: yup.string().required('Service name is required'),
  description: yup.string(),
  price: yup.number().required('Price is required').min(0),
  duration: yup.number().min(0),
  category: yup.string().oneOf(['maintenance', 'repair', 'diagnostic', 'bodywork', 'other']),
  status: yup.string().oneOf(['active', 'inactive'])
});
```

2. **File Upload Handling**
```javascript
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  } catch (error) {
    throw new Error('File upload failed');
  }
};
```

### State Management Recommendations
1. **Global State Structure**
```typescript
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  inventory: {
    items: Item[];
    loading: boolean;
    error: string | null;
  };
  repairs: {
    activeRepairs: Repair[];
    completedRepairs: Repair[];
    loading: boolean;
    error: string | null;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    notifications: Notification[];
  };
}
```

2. **Action Types**
```typescript
enum ActionTypes {
  // Auth
  LOGIN_SUCCESS = 'auth/loginSuccess',
  LOGOUT = 'auth/logout',
  
  // Inventory
  FETCH_ITEMS = 'inventory/fetchItems',
  UPDATE_ITEM = 'inventory/updateItem',
  
  // Repairs
  CREATE_REPAIR = 'repairs/createRepair',
  UPDATE_REPAIR_STATUS = 'repairs/updateStatus',
  
  // UI
  TOGGLE_THEME = 'ui/toggleTheme',
  ADD_NOTIFICATION = 'ui/addNotification'
}
```

## API Response Formats

### Success Response Format
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### List Response Format
```typescript
interface ListResponse<T> {
  success: true;
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}
```

### Nested Data Handling
```typescript
interface RepairResponse {
  _id: string;
  car: {
    _id: string;
    make: string;
    model: string;
    year: number;
    owner: {
      name: string;
      email: string;
    };
  };
  items: Array<{
    _id: string;
    item: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  // ... other fields
}
```

## Authentication

### Register a new user
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

## Users (Admin Only)

### Get All Users
**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec9af1234c002a123456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    {
      "_id": "60d5ec9af1234c002a123457",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  ]
}
```

### Get Single User
**Endpoint:** `GET /users/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Create User
**Endpoint:** `POST /users`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123458",
    "name": "New User",
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

### Update User
**Endpoint:** `PUT /users/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123456",
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "admin"
  }
}
```

### Delete User
**Endpoint:** `DELETE /users/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Items (Inventory Management)

### Get All Items
**Endpoint:** `GET /items`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters for Filtering, Pagination, and Sorting

Most list endpoints now support the following query parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sort` (string): Field to sort by, prefix with '-' for descending (e.g. `sort=-createdAt`)
- Filtering fields (see each endpoint for details)

**Example:** `/api/items?status=low_stock&search=brake&page=2&limit=5&sort=-createdAt`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec9af1234c002a123459",
      "name": "Item 1",
      "price": 29.99,
      "quantity": 100,
      "category": "60d5ec9af1234c002a123460",
      "fournisseur": "60d5ec9af1234c002a123461"
    },
    {
      "_id": "60d5ec9af1234c002a123462",
      "name": "Item 2",
      "price": 49.99,
      "quantity": 50,
      "category": "60d5ec9af1234c002a123460",
      "fournisseur": "60d5ec9af1234c002a123461"
    }
  ]
}
```

### Get Single Item
**Endpoint:** `GET /items/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123459",
    "name": "Item 1",
    "price": 29.99,
    "quantity": 100,
    "category": {
      "_id": "60d5ec9af1234c002a123460",
      "name": "Electronics"
    },
    "fournisseur": {
      "_id": "60d5ec9af1234c002a123461",
      "name": "Supplier Inc."
    }
  }
}
```

### Create Item (Admin Only)
**Endpoint:** `POST /items`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "New Item",
  "price": 39.99,
  "quantity": 75,
  "category": "60d5ec9af1234c002a123460",
  "fournisseur": "60d5ec9af1234c002a123461"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123463",
    "name": "New Item",
    "price": 39.99,
    "quantity": 75,
    "category": "60d5ec9af1234c002a123460",
    "fournisseur": "60d5ec9af1234c002a123461"
  }
}
```

### Update Item (Admin Only)
**Endpoint:** `PUT /items/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "Updated Item",
  "price": 45.99,
  "quantity": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123459",
    "name": "Updated Item",
    "price": 45.99,
    "quantity": 60,
    "category": "60d5ec9af1234c002a123460",
    "fournisseur": "60d5ec9af1234c002a123461"
  }
}
```

### Delete Item (Admin Only)
**Endpoint:** `DELETE /items/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

### Update Item Quantity
**Endpoint:** `PUT /items/:id/quantity`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "quantity": 10,
  "operation": "add"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123459",
    "name": "Item 1",
    "price": 29.99,
    "quantity": 110,
    "category": "60d5ec9af1234c002a123460",
    "fournisseur": "60d5ec9af1234c002a123461"
  }
}
```

## Suppliers (Fournisseurs)

### Get All Suppliers
**Endpoint:** `GET /fournisseurs`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec9af1234c002a123461",
      "name": "Supplier Inc.",
      "email": "contact@supplier.com",
      "phone": "123-456-7890"
    },
    {
      "_id": "60d5ec9af1234c002a123464",
      "name": "Another Supplier",
      "email": "info@anothersupplier.com",
      "phone": "123-456-7891"
    }
  ]
}
```

### Get Single Supplier
**Endpoint:** `GET /fournisseurs/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123461",
    "name": "Supplier Inc.",
    "email": "contact@supplier.com",
    "phone": "123-456-7890"
  }
}
```

### Create Supplier (Admin Only)
**Endpoint:** `POST /fournisseurs`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "New Supplier",
  "email": "contact@newsupplier.com",
  "phone": "123-456-7892"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123465",
    "name": "New Supplier",
    "email": "contact@newsupplier.com",
    "phone": "123-456-7892"
  }
}
```

### Update Supplier (Admin Only)
**Endpoint:** `PUT /fournisseurs/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "Updated Supplier",
  "email": "updated@supplier.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123461",
    "name": "Updated Supplier",
    "email": "updated@supplier.com",
    "phone": "123-456-7890"
  }
}
```

### Delete Supplier (Admin Only)
**Endpoint:** `DELETE /fournisseurs/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Categories

### Get All Categories
**Endpoint:** `GET /categories`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec9af1234c002a123460",
      "name": "Electronics"
    },
    {
      "_id": "60d5ec9af1234c002a123466",
      "name": "Office Supplies"
    }
  ]
}
```

### Get Single Category
**Endpoint:** `GET /categories/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123460",
    "name": "Electronics"
  }
}
```

### Create Category (Admin Only)
**Endpoint:** `POST /categories`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "New Category"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123467",
    "name": "New Category"
  }
}
```

### Update Category (Admin Only)
**Endpoint:** `PUT /categories/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "Updated Category"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123460",
    "name": "Updated Category"
  }
}
```

### Delete Category (Admin Only)
**Endpoint:** `DELETE /categories/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Cars (Vehicles)

### Get All Cars
**Endpoint:** `GET /cars`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters for Filtering, Pagination, and Sorting

Most list endpoints now support the following query parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sort` (string): Field to sort by, prefix with '-' for descending (e.g. `sort=-createdAt`)
- Filtering fields (see each endpoint for details)

**Example:** `/api/cars?search=toyota&year=2020&page=1&limit=10&sort=-createdAt`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec9af1234c002a123468",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "owner": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "_id": "60d5ec9af1234c002a123469",
      "make": "Honda",
      "model": "Accord",
      "year": 2019,
      "owner": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

### Get Single Car
**Endpoint:** `GET /cars/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123468",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "owner": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Create Car
**Endpoint:** `POST /cars`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "make": "Nissan",
  "model": "Altima",
  "year": 2021,
  "owner": {
    "name": "Bob Johnson",
    "email": "bob@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123470",
    "make": "Nissan",
    "model": "Altima",
    "year": 2021,
    "owner": {
      "name": "Bob Johnson",
      "email": "bob@example.com"
    }
  }
}
```

### Update Car
**Endpoint:** `PUT /cars/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "make": "Nissan",
  "model": "Maxima",
  "year": 2022
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec9af1234c002a123470",
    "make": "Nissan",
    "model": "Maxima",
    "year": 2022,
    "owner": {
      "name": "Bob Johnson",
      "email": "bob@example.com"
    }
  }
}
```

### Delete Car (Admin Only)
**Endpoint:** `DELETE /cars/:id`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {}
}
```

## Dashboard

### Get Dashboard Statistics
**Endpoint:** `GET /dashboard`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Query Parameters for Filtering, Pagination, and Sorting

Most list endpoints now support the following query parameters:
- `dateDebut`: Start date for completed repairs and revenue (ISO format)
- `dateFin`: End date for completed repairs and revenue (ISO format)

**Example:** `/api/dashboard?dateDebut=2024-06-01&dateFin=2024-06-30`

**Response:**
```json
{
  "success": true,
  "data": {
    "itemCount": 8,
    "userCount": 5,
    "categoryCount": 3,
    "supplierCount": 4,
    "carCount": 7,
    "lowStockItems": 2,
    "recentItems": [
      {
        "_id": "60d5ec9af1234c002a123459",
        "name": "Item 1",
        "price": 29.99,
        "quantity": 100
      },
      {
        "_id": "60d5ec9af1234c002a123462",
        "name": "Item 2",
        "price": 49.99,
        "quantity": 50
      }
    ]
  }
}
```

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
- **Query Parameters:**
  - `category`: Filter by category
  - `status`: Filter by status
  - `search`: Search by name
  - `page`, `limit`, `sort`
- **Example:** `/api/services?status=active&search=oil&page=1&limit=10&sort=name`
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

## Frontend Implementation Examples

### Authentication Flow
```typescript
// authService.ts
export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('auth_token', token);
      return user;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async register(userData: RegisterData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('auth_token', token);
      return user;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
  }
};

// AuthProvider.tsx
export const AuthProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user data
      authService.getCurrentUser()
        .then(user => dispatch({ type: 'SET_USER', payload: user }))
        .catch(() => authService.logout());
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### API Service Implementation
```typescript
// apiService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const itemsService = {
  async getItems(params: PaginationParams) {
    try {
      const response = await apiClient.get('/items', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createItem(itemData: CreateItemData) {
    try {
      const response = await apiClient.post('/items', itemData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};

export const repairService = {
  async createRepair(repairData: CreateRepairData) {
    try {
      const response = await apiClient.post('/reparations', repairData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
```

### Custom Hooks
```typescript
// useItems.ts
export const useItems = (params: PaginationParams) => {
  const queryKey = ['items', params];
  
  return useQuery(queryKey, () => itemsService.getItems(params), {
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000
  });
};

// useRepair.ts
export const useRepair = (repairId: string) => {
  const queryKey = ['repair', repairId];
  
  return useQuery(queryKey, () => repairService.getRepair(repairId), {
    enabled: !!repairId
  });
};
```

### Form Components
```typescript
// RepairForm.tsx
interface RepairFormProps {
  onSubmit: (data: CreateRepairData) => Promise<void>;
  initialData?: Partial<CreateRepairData>;
}

export const RepairForm: React.FC<RepairFormProps> = ({ onSubmit, initialData }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateRepairData>({
    defaultValues: initialData,
    resolver: yupResolver(repairSchema)
  });

  const { data: items } = useItems({ page: 1, limit: 100 });
  const { data: services } = useServices({ page: 1, limit: 100 });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('description')}
        label="Description"
        error={!!errors.description}
        helperText={errors.description?.message}
      />
      
      <Select
        {...register('items')}
        label="Select Items"
        multiple
        error={!!errors.items}
      >
        {items?.data.map(item => (
          <MenuItem key={item._id} value={item._id}>
            {item.name} - ${item.price}
          </MenuItem>
        ))}
      </Select>
      
      {/* Add more form fields */}
    </form>
  );
};
```

### Data Grid Implementation
```typescript
// ItemsTable.tsx
export const ItemsTable: React.FC = () => {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sort: '-createdAt'
  });

  const { data, isLoading } = useItems(params);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'price', headerName: 'Price', type: 'number' },
    { field: 'quantity', headerName: 'Stock', type: 'number' },
    {
      field: 'status',
      headerName: 'Status',
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderCell: (params) => (
        <ButtonGroup>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon />
          </IconButton>
        </ButtonGroup>
      )
    }
  ];

  return (
    <DataGrid
      rows={data?.data || []}
      columns={columns}
      loading={isLoading}
      pagination
      paginationMode="server"
      rowCount={data?.count || 0}
      page={params.page - 1}
      pageSize={params.limit}
      onPageChange={(newPage) => setParams(prev => ({ ...prev, page: newPage + 1 }))}
      onPageSizeChange={(newLimit) => setParams(prev => ({ ...prev, limit: newLimit }))}
    />
  );
};
```

### Error Boundary
```typescript
// ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

### Notification System
```typescript
// notificationSlice.ts
interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: [] as Notification[],
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      state.push({
        id: nanoid(),
        ...action.payload
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      return state.filter(notification => notification.id !== action.payload);
    }
  }
});

// NotificationProvider.tsx
export const NotificationProvider: React.FC = ({ children }) => {
  const notifications = useSelector(selectNotifications);
  const dispatch = useDispatch();

  return (
    <>
      {children}
      <Stack spacing={2} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        {notifications.map(notification => (
          <Alert
            key={notification.id}
            severity={notification.type}
            onClose={() => dispatch(removeNotification(notification.id))}
          >
            {notification.message}
          </Alert>
        ))}
      </Stack>
    </>
  );
};
```

### WebSocket Integration
```typescript
// websocketService.ts
export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.socket = io(process.env.REACT_APP_WS_URL!, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.socket?.disconnect();
      }
    });

    // Business events
    this.socket.on('inventory-update', (data) => {
      store.dispatch(updateInventoryItem(data));
    });

    this.socket.on('repair-status-change', (data) => {
      store.dispatch(updateRepairStatus(data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
```

### Route Protection
```typescript
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// App.tsx
export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
        
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Route>
      </Route>
    </Routes>
  );
};
```

## Best Practices

### State Management
1. Use React Query for server state
2. Use Redux/Context for global UI state
3. Use local state for component-specific state
4. Implement optimistic updates for better UX

### Performance
1. Implement virtualization for large lists
2. Use debounce for search inputs
3. Implement infinite scrolling for long lists
4. Cache API responses appropriately

### Security
1. Sanitize all user inputs
2. Implement CSRF protection
3. Use HTTPS for all API calls
4. Never store sensitive data in localStorage

### Error Handling
1. Implement global error boundary
2. Use toast notifications for API errors
3. Log errors to monitoring service
4. Provide user-friendly error messages

### Testing
1. Write unit tests for utilities and hooks
2. Write integration tests for forms
3. Write E2E tests for critical flows
4. Mock API calls in tests

## Common Patterns

### Loading States
```typescript
const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

type LoadingState = typeof LoadingState[keyof typeof LoadingState];

interface AsyncState<T> {
  status: LoadingState;
  data: T | null;
  error: string | null;
}
```

### Form Validation
```typescript
const validationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[0-9]/, 'Password must contain a number')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .required('Password is required')
});
```

### API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  totalPages: number;
  currentPage: number;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}
```

## Reparation System Documentation

### Overview
The reparation system manages vehicle repairs, including services performed, parts used, labor costs, and repair status tracking. It integrates with inventory management to ensure proper stock control and pricing accuracy.

### Data Models

#### Reparation Model
```typescript
interface Reparation {
  _id: string;
  car: {
    _id: string;
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
    vin?: string;
    owner: {
      name: string;
      email?: string;
      phone?: string;
    };
  };
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  technician: string;
  diagnosis?: string;
  estimatedDuration?: number; // in hours
  
  items: Array<{
    _id: string;
    item: {
      _id: string;
      name: string;
      price: number;
      itemCode: string;
    };
    quantity: number;
    priceAtTime: number; // Price when repair was created
    total: number;
  }>;
  
  services: Array<{
    _id: string;
    service: {
      _id: string;
      name: string;
      price: number;
      duration: number;
    };
    priceAtTime: number;
    notes?: string;
  }>;
  
  costs: {
    partsCost: number;    // Total cost of parts
    laborCost: number;    // Labor cost
    servicesCost: number; // Total cost of services
    totalCost: number;    // Total repair cost
    discount?: number;    // Any applied discount
    tax?: number;        // Applied tax
    finalTotal: number;  // Final amount after discount and tax
  };
  
  notes?: string;
  photos?: string[];     // URLs to repair photos
  documents?: string[];  // URLs to related documents
  
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  
  timestamps: {
    created: Date;
    lastUpdated: Date;
    completed?: Date;
    cancelled?: Date;
  };
}
```

### API Endpoints

#### Create Repair
- **URL**: `POST /api/reparations`
- **Auth**: Required
- **Body**:
```typescript
interface CreateRepairRequest {
  car: string;              // Car ID
  description: string;
  technician: string;
  diagnosis?: string;
  estimatedDuration?: number;
  items: Array<{
    item: string;          // Item ID
    quantity: number;
  }>;
  services: Array<{
    service: string;       // Service ID
    notes?: string;
  }>;
  laborCost: number;
  notes?: string;
  photos?: string[];
  documents?: string[];
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Get Repair List
- **URL**: `GET /api/reparations`
- **Auth**: Required
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `status`: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  - `startDate`: ISO date string
  - `endDate`: ISO date string
  - `technician`: string
  - `search`: string (searches in description and car details)
  - `sort`: string (e.g., '-createdAt', 'status')
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation[],
  "count": number,
  "totalPages": number,
  "currentPage": number
}
```

#### Get Repair Details
- **URL**: `GET /api/reparations/:id`
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Update Repair Status
- **URL**: `PUT /api/reparations/:id/status`
- **Auth**: Required
- **Body**:
```typescript
interface UpdateStatusRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  endDate?: Date;        // Required if status is 'completed'
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Add Items to Repair
- **URL**: `POST /api/reparations/:id/items`
- **Auth**: Required
- **Body**:
```typescript
interface AddItemsRequest {
  items: Array<{
    item: string;        // Item ID
    quantity: number;
  }>;
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Remove Items from Repair
- **URL**: `DELETE /api/reparations/:id/items`
- **Auth**: Required
- **Body**:
```typescript
interface RemoveItemsRequest {
  items: string[];      // Array of repair item IDs to remove
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Update Labor Cost
- **URL**: `PUT /api/reparations/:id/labor-cost`
- **Auth**: Required
- **Body**:
```typescript
interface UpdateLaborCostRequest {
  laborCost: number;
  notes?: string;
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": Reparation
}
```

#### Add Photos/Documents
- **URL**: `POST /api/reparations/:id/attachments`
- **Auth**: Required
- **Body**: `multipart/form-data`
```typescript
interface AddAttachmentsRequest {
  photos?: File[];
  documents?: File[];
  description?: string;
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    photos: string[],    // URLs of uploaded photos
    documents: string[]  // URLs of uploaded documents
  }
}
```

### Business Rules

#### Inventory Management
1. **Stock Verification**
   - System checks if sufficient stock is available for all items
   - Prevents repair creation if any item is out of stock
   - Optionally allows creation with warning for low stock items

2. **Stock Updates**
   - Automatically reduces stock when repair is created
   - Adjusts stock if items are added/removed from repair
   - Returns items to stock if repair is cancelled

3. **Price Tracking**
   - Captures current price of items at time of repair creation
   - Maintains historical price data for reporting
   - Calculates total costs based on prices at time of repair

#### Status Management
1. **Status Flow**
   ```
   pending -> in_progress -> completed
        \-> cancelled
   ```

2. **Status Rules**
   - Cannot move directly from 'pending' to 'completed'
   - Cannot change status once 'completed' or 'cancelled'
   - Must provide endDate when marking as 'completed'
   - Cannot modify items/services after 'completed'

3. **Timestamps**
   - Records all status changes with timestamps
   - Tracks time spent in each status
   - Calculates total repair duration

#### Cost Calculation
1. **Parts Cost**
   ```typescript
   partsCost = Σ(item.priceAtTime * item.quantity)
   ```

2. **Services Cost**
   ```typescript
   servicesCost = Σ(service.priceAtTime)
   ```

3. **Total Cost**
   ```typescript
   totalCost = partsCost + servicesCost + laborCost
   finalTotal = totalCost - discount + tax
   ```

### Frontend Implementation

#### State Management
```typescript
interface RepairState {
  activeRepairs: Reparation[];
  selectedRepair: Reparation | null;
  loading: boolean;
  error: string | null;
}

// Redux slice
const repairSlice = createSlice({
  name: 'repairs',
  initialState,
  reducers: {
    setActiveRepairs: (state, action) => {
      state.activeRepairs = action.payload;
    },
    updateRepairStatus: (state, action) => {
      const index = state.activeRepairs.findIndex(
        repair => repair._id === action.payload._id
      );
      if (index !== -1) {
        state.activeRepairs[index] = action.payload;
      }
    },
    // ... other reducers
  }
});
```

#### Real-time Updates
```typescript
// WebSocket events
socket.on('repair-status-change', (data: RepairStatusUpdate) => {
  dispatch(updateRepairStatus(data));
});

socket.on('repair-items-update', (data: RepairItemsUpdate) => {
  dispatch(updateRepairItems(data));
});
```

#### Form Validation
```typescript
const repairValidationSchema = yup.object().shape({
  description: yup.string().required('Description is required'),
  technician: yup.string().required('Technician is required'),
  items: yup.array().of(
    yup.object().shape({
      item: yup.string().required('Item is required'),
      quantity: yup.number()
        .required('Quantity is required')
        .min(1, 'Quantity must be at least 1')
    })
  ),
  laborCost: yup.number()
    .required('Labor cost is required')
    .min(0, 'Labor cost cannot be negative')
});
```

### Error Handling

#### Common Errors
1. **Insufficient Stock**
```json
{
  "success": false,
  "error": "Insufficient stock",
  "details": {
    "itemId": "Required quantity not available",
    "availableQuantity": 5,
    "requestedQuantity": 10
  }
}
```

2. **Invalid Status Transition**
```json
{
  "success": false,
  "error": "Invalid status transition",
  "details": {
    "currentStatus": "completed",
    "requestedStatus": "in_progress",
    "allowedTransitions": ["pending", "in_progress"]
  }
}
```

3. **Missing Required Fields**
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "endDate": "End date is required for completed status",
    "technician": "Technician is required"
  }
}
```

### Testing

#### Unit Tests
```typescript
describe('Repair Creation', () => {
  it('should create repair with valid data', async () => {
    const repairData = {
      car: 'carId',
      description: 'Test repair',
      technician: 'John Doe',
      items: [{ item: 'itemId', quantity: 1 }],
      laborCost: 100
    };
    
    const result = await repairService.createRepair(repairData);
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('_id');
  });

  it('should fail with insufficient stock', async () => {
    const repairData = {
      // ... repair data with quantity > available stock
    };
    
    await expect(repairService.createRepair(repairData))
      .rejects
      .toThrow('Insufficient stock');
  });
});
```

#### Integration Tests
```typescript
describe('Repair Workflow', () => {
  it('should follow correct status transitions', async () => {
    const repair = await createTestRepair();
    
    // Start repair
    await repairService.updateStatus(repair._id, 'in_progress');
    expect(repair.status).toBe('in_progress');
    
    // Complete repair
    const endDate = new Date();
    await repairService.updateStatus(repair._id, 'completed', { endDate });
    expect(repair.status).toBe('completed');
    expect(repair.endDate).toEqual(endDate);
  });
});
```