# Stock Management System - Frontend Development Requirements

## Project Overview
We require the development of a comprehensive frontend application for our Stock Management System. The backend API has already been developed and provides all necessary endpoints for inventory management, supplier tracking, vehicle repair operations, and administrative functions.

This frontend will serve as the user interface for our automotive repair and parts management business, allowing us to track inventory, manage supplier relationships, record vehicle repairs, and monitor business performance through a dashboard.

## Technical Requirements

### Technology Stack
- **Framework**: React.js with TypeScript
- **UI Library**: Material UI or Tailwind CSS
- **State Management**: Redux Toolkit or React Context API
- **Form Handling**: Formik with Yup validation
- **HTTP Client**: Axios for API integration
- **Routing**: React Router
- **Charts**: Recharts or Chart.js for dashboard visualizations

### Authentication & Authorization
- Implement JWT-based authentication with token storage
- Role-based access control (Admin vs Regular user)
- Protected routes based on user role
- Login and registration forms
- User profile management

### Backend API Integration
The backend provides the following RESTful endpoints that must be integrated:

#### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/me`: Get current user profile

#### Users (Admin only)
- `GET /api/users`: Get all users
- `GET /api/users/:id`: Get a specific user
- `POST /api/users`: Create a new user
- `PUT /api/users/:id`: Update user
- `DELETE /api/users/:id`: Delete user

#### Categories
- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get a specific category
- `POST /api/categories`: Create a new category (Admin only)
- `PUT /api/categories/:id`: Update category (Admin only)
- `DELETE /api/categories/:id`: Delete category (Admin only)

#### Suppliers (Fournisseurs)
- `GET /api/fournisseurs`: Get all suppliers
- `GET /api/fournisseurs/:id`: Get a specific supplier
- `POST /api/fournisseurs`: Create a new supplier (Admin only)
- `PUT /api/fournisseurs/:id`: Update supplier (Admin only)
- `DELETE /api/fournisseurs/:id`: Delete supplier (Admin only)

#### Items
- `GET /api/items`: Get all items
- `GET /api/items/:id`: Get a specific item
- `POST /api/items`: Create a new item (Admin only)
- `PUT /api/items/:id`: Update item (Admin only)
- `DELETE /api/items/:id`: Delete item (Admin only)
- `PUT /api/items/:id/quantity`: Update item quantity

#### Cars
- `GET /api/cars`: Get all cars
- `GET /api/cars/:id`: Get a specific car
- `POST /api/cars`: Create a new car
- `PUT /api/cars/:id`: Update car 
- `DELETE /api/cars/:id`: Delete car (Admin only)

#### Dashboard
- `GET /api/dashboard`: Get dashboard statistics

## Feature Requirements

### 1. Dashboard
- Main landing page after login
- Display key performance indicators (KPIs):
  - Total inventory value
  - Low stock items count
  - Out of stock items count
  - Active repairs count
  - Completed repairs (last 30 days)
  - Revenue (last 30 days)
- Interactive charts and graphs:
  - Inventory status breakdown
  - Top 5 most used items
  - Revenue trends
  - Repair status distribution

### 2. Inventory Management
- Comprehensive item list with search, filter, and sort capabilities
- Detailed item view showing all information including:
  - Current quantity
  - Stock status (available, low_stock, out_of_stock)
  - Category and supplier information
  - Price and location
- Add/Edit item forms with validation
- Quick quantity adjustment feature
- Color coding for stock status (green, yellow, red)
- Barcode/QR code generation for items

### 3. Category Management
- List of all categories with item counts
- Add/Edit category forms
- Ability to view all items in a category

### 4. Supplier Management
- List of all suppliers with contact information
- Detailed supplier view with associated items
- Add/Edit supplier forms with validation
- Contact supplier feature (email integration)

### 5. Vehicle Management
- Vehicle list with search and filter options
- Add/Edit vehicle forms with validation
- Vehicle details page with repair history
- Owner information and contact details

### 6. Repair Management
- Create new repair tickets with vehicle selection
- Add items used in repairs with quantity
- Update repair status workflow (pending → in_progress → completed)
- Labor cost calculation
- Total cost calculation (parts + labor)
- Repair invoice generation (PDF export)

### 7. User Management (Admin only)
- User list with roles
- Add/Edit user forms
- Role assignment
- Account activation/deactivation

### 8. Reports & Analytics
- Generate reports for:
  - Inventory status
  - Repair history
  - Revenue and costs
  - Supplier performance
- Export options (PDF, Excel)
- Date range filtering for all reports

## UI/UX Requirements
- Responsive design for desktop and tablet use
- Dark/Light theme options
- Intuitive navigation with sidebar and breadcrumbs
- Form validation with clear error messages
- Loading states and error handling
- Confirmation dialogs for critical actions
- Success/Error notifications
- Pagination for large data sets
- Data caching for performance
- Offline capabilities where appropriate

## Data Models
The frontend should handle the following data models from the backend:

### User
```typescript
{
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}
```

### Category
```typescript
{
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

### Fournisseur (Supplier)
```typescript
{
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Item
```typescript
{
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: { _id: string; name: string; };
  fournisseur: { _id: string; name: string; };
  status: 'available' | 'low_stock' | 'out_of_stock' | 'used';
  threshold: number;
  location: string;
  itemCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Car
```typescript
{
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  owner: {
    name: string;
    phone: string;
    email: string;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Reparation (Repair)
```typescript
{
  _id: string;
  car: Car;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  technician: string;
  items: Array<{
    item: Item;
    quantity: number;
    price: number;
  }>;
  totalCost: number;
  laborCost: number;
  notes: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}
```

### Dashboard Stats
```typescript
{
  counts: {
    items: number;
    fournisseurs: number;
    categories: number;
    cars: number;
    reparations: number;
  };
  inventory: {
    value: number;
    lowStock: number;
    outOfStock: number;
  };
  repairs: {
    active: number;
    completedLastMonth: number;
    revenueLastMonth: number;
  };
  topItems: Array<{
    _id: string;
    name: string;
    quantity: number;
  }>;
}
```

## Deliverables

- Responsive and accessible UI
- Robust error handling
- Performance optimization

## Additional Considerations
- Implement proper loading states and skeleton screens for better UX
- Ensure all forms have proper validation
- Implement optimistic updates where appropriate
- Consider implementing PWA features for offline capabilities
- Focus on performance optimization (lazy loading, code splitting) 