# React Frontend Integration Guide

## Table of Contents
1. [Setup](#setup)
2. [API Service Layer](#api-service-layer)
3. [Custom Hooks](#custom-hooks)
4. [Component Examples](#component-examples)
5. [State Management](#state-management)
6. [Form Handling](#form-handling)
7. [Error Handling](#error-handling)

---

## Setup

### Environment Variables
Create a `.env` file in your React project root:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Install Dependencies
```bash
npm install axios react-query
# or
npm install @tanstack/react-query
```

---

## API Service Layer

### Base API Configuration
```javascript
// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
```

### Items API Service
```javascript
// src/services/itemsService.js
import api from './api';

export const itemsService = {
  // Get all items with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/items?${params.toString()}`);
  },

  // Get single item
  getById: async (id) => {
    return api.get(`/items/${id}`);
  },

  // Create item
  create: async (itemData) => {
    return api.post('/items', itemData);
  },

  // Update item
  update: async (id, itemData) => {
    return api.put(`/items/${id}`, itemData);
  },

  // Delete item
  delete: async (id) => {
    return api.delete(`/items/${id}`);
  },

  // Update quantity
  updateQuantity: async (id, quantity, operation, notes = '') => {
    return api.put(`/items/${id}/quantity`, {
      quantity,
      operation,
      notes,
    });
  },

  // Get item history
  getHistory: async (id, page = 1, limit = 20) => {
    return api.get(`/items/${id}/history?page=${page}&limit=${limit}`);
  },

  // Get low stock items
  getLowStock: async () => {
    return api.get('/items/low-stock');
  },
};
```

### Reparations API Service
```javascript
// src/services/reparationsService.js
import api from './api';

export const reparationsService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/reparations?${params.toString()}`);
  },

  getById: async (id) => {
    return api.get(`/reparations/${id}`);
  },

  create: async (reparationData) => {
    return api.post('/reparations', reparationData);
  },

  updateStatus: async (id, status, endDate = null) => {
    return api.put(`/reparations/${id}`, { status, endDate });
  },

  updateFull: async (id, reparationData) => {
    return api.put(`/reparations/${id}/full`, reparationData);
  },

  delete: async (id) => {
    return api.delete(`/reparations/${id}`);
  },
};
```

### Stock Transactions API Service
```javascript
// src/services/stockTransactionsService.js
import api from './api';

export const stockTransactionsService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/stock-transactions?${params.toString()}`);
  },

  getById: async (id) => {
    return api.get(`/stock-transactions/${id}`);
  },

  create: async (transactionData) => {
    return api.post('/stock-transactions', transactionData);
  },

  getStats: async () => {
    return api.get('/stock-transactions/stats');
  },
};
```

### Other Services
```javascript
// src/services/categoriesService.js
import api from './api';

export const categoriesService = {
  getAll: async () => api.get('/categories'),
  getById: async (id) => api.get(`/categories/${id}`),
  create: async (data) => api.post('/categories', data),
  update: async (id, data) => api.put(`/categories/${id}`, data),
  delete: async (id) => api.delete(`/categories/${id}`),
};

// src/services/suppliersService.js
import api from './api';

export const suppliersService = {
  getAll: async () => api.get('/fournisseurs'),
  getById: async (id) => api.get(`/fournisseurs/${id}`),
  create: async (data) => api.post('/fournisseurs', data),
  update: async (id, data) => api.put(`/fournisseurs/${id}`, data),
  delete: async (id) => api.delete(`/fournisseurs/${id}`),
};

// src/services/servicesService.js
import api from './api';

export const servicesService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/services?${params.toString()}`);
  },
  getById: async (id) => api.get(`/services/${id}`),
  create: async (data) => api.post('/services', data),
  update: async (id, data) => api.put(`/services/${id}`, data),
  delete: async (id) => api.delete(`/services/${id}`),
};

// src/services/carsService.js
import api from './api';

export const carsService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/cars?${params.toString()}`);
  },
  getById: async (id) => api.get(`/cars/${id}`),
  create: async (data) => api.post('/cars', data),
  update: async (id, data) => api.put(`/cars/${id}`, data),
  delete: async (id) => api.delete(`/cars/${id}`),
};

// src/services/authService.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    return api.get('/auth/me');
  },
};
```

---

## Custom Hooks

### useItems Hook
```javascript
// src/hooks/useItems.js
import { useState, useEffect, useCallback } from 'react';
import { itemsService } from '../services/itemsService';

export const useItems = (initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState(initialFilters);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemsService.getAll(filters);
      setItems(response.data);
      setPagination({
        page: response.page,
        pages: response.pages,
        total: response.total,
      });
    } catch (err) {
      setError(err.error || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refresh = () => {
    fetchItems();
  };

  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  return {
    items,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    refresh,
  };
};
```

### useItem Hook (Single Item)
```javascript
// src/hooks/useItem.js
import { useState, useEffect } from 'react';
import { itemsService } from '../services/itemsService';

export const useItem = (id) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await itemsService.getById(id);
        setItem(response.data);
      } catch (err) {
        setError(err.error || 'Failed to fetch item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    try {
      const response = await itemsService.getById(id);
      setItem(response.data);
    } catch (err) {
      setError(err.error || 'Failed to refresh item');
    }
  };

  return { item, loading, error, refresh };
};
```

### useReparations Hook
```javascript
// src/hooks/useReparations.js
import { useState, useEffect, useCallback } from 'react';
import { reparationsService } from '../services/reparationsService';

export const useReparations = (initialFilters = {}) => {
  const [reparations, setReparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState(initialFilters);

  const fetchReparations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reparationsService.getAll(filters);
      setReparations(response.data);
      setPagination({
        page: response.page,
        pages: response.pages,
        total: response.total,
      });
    } catch (err) {
      setError(err.error || 'Failed to fetch reparations');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReparations();
  }, [fetchReparations]);

  const refresh = () => {
    fetchReparations();
  };

  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  return {
    reparations,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    refresh,
  };
};
```

### useAuth Hook
```javascript
// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register(name, email, password);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Component Examples

### Item List Component
```javascript
// src/components/Items/ItemList.jsx
import React, { useState } from 'react';
import { useItems } from '../../hooks/useItems';
import { itemsService } from '../../services/itemsService';

const ItemList = () => {
  const { items, loading, error, pagination, updateFilters, refresh } = useItems({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchTerm, page: 1 });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await itemsService.delete(id);
        refresh();
        alert('Item deleted successfully');
      } catch (err) {
        alert(err.error || 'Failed to delete item');
      }
    }
  };

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
  };

  if (loading) return <div className="loading">Loading items...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="item-list">
      <div className="header">
        <h1>Inventory Items</h1>
        <button onClick={() => window.location.href = '/items/new'}>
          Add New Item
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <table className="items-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Buy Price</th>
            <th>Sell Price</th>
            <th>Profit</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.itemCode}</td>
              <td>{item.name}</td>
              <td>{item.category?.name}</td>
              <td>{item.fournisseur?.name}</td>
              <td>${item.buyPrice.toFixed(2)}</td>
              <td>${item.sellPrice.toFixed(2)}</td>
              <td>
                ${item.profitMargin.toFixed(2)}
                <span className="profit-percent">({item.profitMarginPercent}%)</span>
              </td>
              <td>{item.quantity}</td>
              <td>
                <span className={`status status-${item.status}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </td>
              <td>
                <button onClick={() => window.location.href = `/items/${item._id}`}>
                  View
                </button>
                <button onClick={() => window.location.href = `/items/${item._id}/edit`}>
                  Edit
                </button>
                <button onClick={() => handleDelete(item._id, item.name)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="no-data">No items found</div>
      )}

      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.pages} ({pagination.total} total)
        </span>
        <button
          disabled={pagination.page === pagination.pages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ItemList;
```

### Item Form Component
```javascript
// src/components/Items/ItemForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsService } from '../../services/itemsService';
import { categoriesService } from '../../services/categoriesService';
import { suppliersService } from '../../services/suppliersService';

const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buyPrice: '',
    sellPrice: '',
    quantity: '',
    category: '',
    fournisseur: '',
    threshold: '5',
    location: '',
    notes: '',
  });

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, suppliersRes] = await Promise.all([
          categoriesService.getAll(),
          suppliersService.getAll(),
        ]);
        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);

        if (isEdit) {
          const itemRes = await itemsService.getById(id);
          const item = itemRes.data;
          setFormData({
            name: item.name,
            description: item.description || '',
            buyPrice: item.buyPrice,
            sellPrice: item.sellPrice,
            quantity: item.quantity,
            category: item.category._id,
            fournisseur: item.fournisseur._id,
            threshold: item.threshold,
            location: item.location || '',
            notes: item.notes || '',
          });
        }
      } catch (err) {
        setError(err.error || 'Failed to load data');
      }
    };

    loadData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        buyPrice: parseFloat(formData.buyPrice),
        sellPrice: parseFloat(formData.sellPrice),
        quantity: parseInt(formData.quantity),
        threshold: parseInt(formData.threshold),
      };

      if (isEdit) {
        await itemsService.update(id, data);
        alert('Item updated successfully');
      } else {
        await itemsService.create(data);
        alert('Item created successfully');
      }
      navigate('/items');
    } catch (err) {
      setError(err.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-form">
      <h1>{isEdit ? 'Edit Item' : 'Create New Item'}</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Buy Price *</label>
            <input
              type="number"
              name="buyPrice"
              value={formData.buyPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Sell Price *</label>
            <input
              type="number"
              name="sellPrice"
              value={formData.sellPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        {formData.buyPrice && formData.sellPrice && (
          <div className="profit-info">
            Profit: ${(formData.sellPrice - formData.buyPrice).toFixed(2)}
            ({((formData.sellPrice - formData.buyPrice) / formData.buyPrice * 100).toFixed(2)}%)
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Low Stock Threshold *</label>
            <input
              type="number"
              name="threshold"
              value={formData.threshold}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Supplier *</label>
            <select
              name="fournisseur"
              value={formData.fournisseur}
              onChange={handleChange}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Shelf A-12"
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
          </button>
          <button type="button" onClick={() => navigate('/items')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
```

### Reparation Form Component
```javascript
// src/components/Reparations/ReparationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reparationsService } from '../../services/reparationsService';
import { carsService } from '../../services/carsService';
import { itemsService } from '../../services/itemsService';
import { servicesService } from '../../services/servicesService';

const ReparationForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    car: '',
    description: '',
    technician: '',
    laborCost: '0',
    notes: '',
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [cars, setCars] = useState([]);
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [carsRes, itemsRes, servicesRes] = await Promise.all([
          carsService.getAll(),
          itemsService.getAll({ status: 'available' }),
          servicesService.getAll({ status: 'active' }),
        ]);
        setCars(carsRes.data);
        setItems(itemsRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        setError(err.error || 'Failed to load data');
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { item: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const addService = () => {
    setSelectedServices([...selectedServices, { service: '', notes: '' }]);
  };

  const removeService = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const updateService = (index, field, value) => {
    const updated = [...selectedServices];
    updated[index][field] = value;
    setSelectedServices(updated);
  };

  const calculateTotal = () => {
    let total = parseFloat(formData.laborCost) || 0;

    selectedItems.forEach((si) => {
      const item = items.find((i) => i._id === si.item);
      if (item) {
        total += item.sellPrice * si.quantity;
      }
    });

    selectedServices.forEach((ss) => {
      const service = services.find((s) => s._id === ss.service);
      if (service) {
        total += service.price;
      }
    });

    return total.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        laborCost: parseFloat(formData.laborCost),
        items: selectedItems.filter((si) => si.item),
        services: selectedServices.filter((ss) => ss.service),
      };

      await reparationsService.create(data);
      alert('Reparation created successfully');
      navigate('/reparations');
    } catch (err) {
      setError(err.error || 'Failed to create reparation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reparation-form">
      <h1>Create New Reparation</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Car *</label>
          <select name="car" value={formData.car} onChange={handleChange} required>
            <option value="">Select Car</option>
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.make} {car.model} ({car.year}) - {car.licensePlate} - {car.owner.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Technician</label>
            <input
              type="text"
              name="technician"
              value={formData.technician}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Labor Cost</label>
            <input
              type="number"
              name="laborCost"
              value={formData.laborCost}
              onChange={handleChange}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="section">
          <h3>Items/Parts</h3>
          {selectedItems.map((si, index) => (
            <div key={index} className="item-row">
              <select
                value={si.item}
                onChange={(e) => updateItem(index, 'item', e.target.value)}
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} - ${item.sellPrice} (Stock: {item.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={si.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                min="1"
                placeholder="Qty"
              />
              <button type="button" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem}>
            Add Item
          </button>
        </div>

        <div className="section">
          <h3>Services</h3>
          {selectedServices.map((ss, index) => (
            <div key={index} className="service-row">
              <select
                value={ss.service}
                onChange={(e) => updateService(index, 'service', e.target.value)}
              >
                <option value="">Select Service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} - ${service.price}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={ss.notes}
                onChange={(e) => updateService(index, 'notes', e.target.value)}
                placeholder="Notes"
              />
              <button type="button" onClick={() => removeService(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addService}>
            Add Service
          </button>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="total-cost">
          <strong>Estimated Total: ${calculateTotal()}</strong>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Reparation'}
          </button>
          <button type="button" onClick={() => navigate('/reparations')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReparationForm;
```

### Low Stock Alert Component
```javascript
// src/components/Dashboard/LowStockAlert.jsx
import React, { useState, useEffect } from 'react';
import { itemsService } from '../../services/itemsService';

const LowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await itemsService.getLowStock();
        setLowStockItems(response.data);
      } catch (err) {
        console.error('Failed to fetch low stock items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (lowStockItems.length === 0) return null;

  return (
    <div className="low-stock-alert">
      <h3>⚠️ Low Stock Alert</h3>
      <p>{lowStockItems.length} items need restocking</p>
      <ul>
        {lowStockItems.slice(0, 5).map((item) => (
          <li key={item._id}>
            <strong>{item.name}</strong>: {item.quantity} left
            (Supplier: {item.fournisseur?.name})
          </li>
        ))}
      </ul>
      {lowStockItems.length > 5 && (
        <a href="/items/low-stock">View all {lowStockItems.length} items</a>
      )}
    </div>
  );
};

export default LowStockAlert;
```

---

## State Management

### Using React Context for Global State
```javascript
// src/context/AppContext.js
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

---

## Error Handling

### Global Error Boundary
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Toast Notification Component
```javascript
// src/components/Toast.jsx
import React from 'react';
import { useApp } from '../context/AppContext';

const Toast = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
```

---

## App Setup

### Main App Component
```javascript
// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import PrivateRoute from './components/PrivateRoute';

// Import your components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ItemList from './components/Items/ItemList';
import ItemForm from './components/Items/ItemForm';
import ReparationList from './components/Reparations/ReparationList';
import ReparationForm from './components/Reparations/ReparationForm';
// ... other imports

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Toast />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/items" element={<PrivateRoute><ItemList /></PrivateRoute>} />
              <Route path="/items/new" element={<PrivateRoute><ItemForm /></PrivateRoute>} />
              <Route path="/items/:id/edit" element={<PrivateRoute><ItemForm /></PrivateRoute>} />
              <Route path="/reparations" element={<PrivateRoute><ReparationList /></PrivateRoute>} />
              <Route path="/reparations/new" element={<PrivateRoute><ReparationForm /></PrivateRoute>} />
              {/* Add more routes */}
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
```

---

This guide provides a complete foundation for integrating your React frontend with the upgraded backend API. Customize the components and styling to match your specific requirements.
