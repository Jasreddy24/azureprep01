const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Create order
router.post('/create', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { shippingAddress, phone } = req.body;

  if (!shippingAddress || !phone) {
    return res.status(400).json({ error: 'Shipping address and phone are required' });
  }

  // Get cart items
  db.all(
    `SELECT c.*, p.price, p.stock, p.name 
     FROM cart c 
     JOIN products p ON c.product_id = p.id 
     WHERE c.user_id = ?`,
    [userId],
    (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch cart' });
      }

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Check stock availability
      for (const item of cartItems) {
        if (item.quantity > item.stock) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${item.name}` 
          });
        }
      }

      // Calculate total
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // Create order
      db.run(
        `INSERT INTO orders (user_id, total_amount, shipping_address, phone, status) 
         VALUES (?, ?, ?, ?, 'pending')`,
        [userId, totalAmount, shippingAddress, phone],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create order' });
          }

          const orderId = this.lastID;

          // Create order items and update stock
          const stmt = db.prepare(
            `INSERT INTO order_items (order_id, product_id, quantity, price) 
             VALUES (?, ?, ?, ?)`
          );

          let completed = 0;
          let hasError = false;

          cartItems.forEach(item => {
            stmt.run([orderId, item.product_id, item.quantity, item.price], (err) => {
              if (err && !hasError) {
                hasError = true;
                return res.status(500).json({ error: 'Failed to create order items' });
              }

              // Update product stock
              db.run(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id],
                (err) => {
                  if (err && !hasError) {
                    hasError = true;
                    return res.status(500).json({ error: 'Failed to update stock' });
                  }

                  completed++;
                  if (completed === cartItems.length && !hasError) {
                    // Clear cart
                    db.run('DELETE FROM cart WHERE user_id = ?', [userId], () => {
                      res.json({ 
                        message: 'Order created successfully', 
                        orderId 
                      });
                    });
                  }
                }
              );
            });
          });

          stmt.finalize();
        }
      );
    }
  );
});

// Get user orders
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    `SELECT o.*, 
     GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      res.json(orders);
    }
  );
});

// Get order details
router.get('/:id', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const orderId = req.params.id;

  db.get(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [orderId, userId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch order' });
      }

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.all(
        `SELECT oi.*, p.name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch order items' });
          }

          res.json({ ...order, items });
        }
      );
    }
  );
});

module.exports = router;
