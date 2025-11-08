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

// Get cart items
router.get('/', requireAuth, (req, res) => {
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

// Add to cart
router.post('/add', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if product exists and has stock
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
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

// Update cart item quantity
router.put('/update', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ error: 'Product ID and quantity are required' });
  }

  if (quantity <= 0) {
    db.run(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, productId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to remove item' });
        }
        return res.json({ message: 'Item removed from cart' });
      }
    );
    return;
  }

  // Check stock availability
  db.get('SELECT stock FROM products WHERE id = ?', [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    db.run(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update cart' });
        }
        res.json({ message: 'Cart updated successfully' });
      }
    );
  });
});

// Remove from cart
router.delete('/remove', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const { productId } = req.body;

  db.run(
    'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
    [userId, productId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove item' });
      }
      res.json({ message: 'Item removed from cart' });
    }
  );
});

// Clear cart
router.delete('/clear', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  db.run('DELETE FROM cart WHERE user_id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear cart' });
    }
    res.json({ message: 'Cart cleared' });
  });
});

module.exports = router;
