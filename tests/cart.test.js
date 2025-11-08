const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { testDbPath } = require('./setup');

// Create test app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Create test database
const db = new sqlite3.Database(testDbPath);

// Mock middleware to set user session
const setUserSession = (req, res, next) => {
  req.session.user = { id: 1, email: 'test@example.com', name: 'Test User', is_admin: 0 };
  next();
};

// Initialize test database
beforeAll(async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
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
        if (err) return reject(err);
        
        db.run(`CREATE TABLE IF NOT EXISTS cart (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
        )`, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
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

// Mock cart routes for testing
app.get('/api/cart', setUserSession, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    `SELECT c.*, p.name, p.price, p.image_url, p.stock 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart' });
      }

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      res.json({ items, total });
    }
  );
});

app.post('/api/cart/add', setUserSession, (req, res) => {
  const userId = req.session.user.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    db.get(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to add to cart' });
        }

        if (existing) {
          const newQuantity = existing.quantity + quantity;
          if (newQuantity > product.stock) {
            return res.status(400).json({ error: 'Insufficient stock' });
          }

          db.run(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [newQuantity, userId, productId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to update cart' });
              }
              res.json({ message: 'Cart updated successfully' });
            }
          );
        } else {
          db.run(
            'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [userId, productId, quantity],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to add to cart' });
              }
              res.json({ message: 'Item added to cart' });
            }
          );
        }
      }
    );
  });
});

describe('Cart API Tests', () => {
  let productId;

  beforeEach((done) => {
    // Clear cart and products, then insert test product
    db.run('DELETE FROM cart', () => {
      db.run('DELETE FROM products', () => {
        db.run(
          `INSERT INTO products (name, description, price, image_url, stock, category, brand) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['Test Perfume', 'A test perfume', 49.99, 'https://example.com/image.jpg', 10, 'Men', 'Test Brand'],
          function(err) {
            if (err) return done(err);
            productId = this.lastID;
            done();
          }
        );
      });
    });
  });

  test('POST /api/cart/add - should add item to cart', async () => {
    const response = await request(app)
      .post('/api/cart/add')
      .send({ productId, quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Item added to cart');
  });

  test('POST /api/cart/add - should reject missing product ID', async () => {
    const response = await request(app)
      .post('/api/cart/add')
      .send({ quantity: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Product ID is required');
  });

  test('POST /api/cart/add - should reject insufficient stock', async () => {
    const response = await request(app)
      .post('/api/cart/add')
      .send({ productId, quantity: 100 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Insufficient stock');
  });

  test('GET /api/cart - should return cart items', async () => {
    // First add an item to cart
    await request(app)
      .post('/api/cart/add')
      .send({ productId, quantity: 2 });

    const response = await request(app)
      .get('/api/cart');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(response.body.items).toBeInstanceOf(Array);
    expect(response.body.items.length).toBe(1);
    expect(response.body.total).toBe(49.99 * 2);
  });

  test('POST /api/cart/add - should update quantity if item already in cart', async () => {
    // Add item first time
    await request(app)
      .post('/api/cart/add')
      .send({ productId, quantity: 1 });

    // Add same item again
    const response = await request(app)
      .post('/api/cart/add')
      .send({ productId, quantity: 1 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cart updated successfully');

    // Verify total quantity
    const cartResponse = await request(app)
      .get('/api/cart');

    expect(cartResponse.body.items[0].quantity).toBe(2);
  });
});
