const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { testDbPath } = require('./setup');

// Create test app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create test database
const db = new sqlite3.Database(testDbPath);

// Initialize test database
beforeAll(async () => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      category TEXT,
      brand TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

// Clean up after tests
afterAll((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    const fs = require('fs');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    done();
  });
});

// Mock product routes for testing
app.get('/api/products', (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    db.get('SELECT COUNT(*) as total FROM products', (err, count) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch products' });
      }

      res.json({
        products,
        total: count.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch product' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  });
});

describe('Products API Tests', () => {
  beforeEach((done) => {
    // Clear products table and insert test data
    db.run('DELETE FROM products', () => {
      db.run(
        `INSERT INTO products (name, description, price, image_url, stock, category, brand) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Test Perfume', 'A test perfume', 49.99, 'https://example.com/image.jpg', 10, 'Men', 'Test Brand'],
        () => {
          db.run(
            `INSERT INTO products (name, description, price, image_url, stock, category, brand) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Another Perfume', 'Another test perfume', 59.99, 'https://example.com/image2.jpg', 5, 'Women', 'Test Brand'],
            done
          );
        }
      );
    });
  });

  test('GET /api/products - should return all products', async () => {
    const response = await request(app)
      .get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(response.body).toHaveProperty('total');
    expect(response.body.products).toBeInstanceOf(Array);
    expect(response.body.products.length).toBeGreaterThan(0);
  });

  test('GET /api/products - should filter by category', async () => {
    const response = await request(app)
      .get('/api/products?category=Men');

    expect(response.status).toBe(200);
    expect(response.body.products.every(p => p.category === 'Men')).toBe(true);
  });

  test('GET /api/products - should search products', async () => {
    const response = await request(app)
      .get('/api/products?search=Another');

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBeGreaterThan(0);
    expect(response.body.products.some(p => p.name.includes('Another'))).toBe(true);
  });

  test('GET /api/products/:id - should return a single product', async () => {
    // First get all products to get an ID
    const allProducts = await request(app)
      .get('/api/products');

    const productId = allProducts.body.products[0].id;

    const response = await request(app)
      .get(`/api/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', productId);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('price');
  });

  test('GET /api/products/:id - should return 404 for non-existent product', async () => {
    const response = await request(app)
      .get('/api/products/99999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Product not found');
  });

  test('GET /api/products - should support pagination', async () => {
    const response = await request(app)
      .get('/api/products?page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.products.length).toBeLessThanOrEqual(1);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(1);
  });
});
