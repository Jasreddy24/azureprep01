const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get admin dashboard
router.get('/', requireAdmin, (req, res) => {
  res.render('admin/dashboard', { user: req.session.user });
});

// Get all products (admin)
router.get('/products', requireAdmin, (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(products);
  });
});

// Create product
router.post('/products', requireAdmin, (req, res) => {
  const { name, description, price, image_url, stock, category, brand } = req.body;

  if (!name || !price || !stock) {
    return res.status(400).json({ error: 'Name, price, and stock are required' });
  }

  db.run(
    `INSERT INTO products (name, description, price, image_url, stock, category, brand) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, image_url || '', stock, category || '', brand || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create product' });
      }
      res.json({ message: 'Product created successfully', id: this.lastID });
    }
  );
});

// Update product
router.put('/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, stock, category, brand } = req.body;

  db.run(
    `UPDATE products 
     SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, category = ?, brand = ?
     WHERE id = ?`,
    [name, description, price, image_url, stock, category, brand, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product
router.delete('/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Get all orders (admin)
router.get('/orders', requireAdmin, (req, res) => {
  db.all(
    `SELECT o.*, u.name as user_name, u.email 
     FROM orders o 
     JOIN users u ON o.user_id = u.id 
     ORDER BY o.created_at DESC`,
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      res.json(orders);
    }
  );
});

// Update order status
router.put('/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update order status' });
      }
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

module.exports = router;
