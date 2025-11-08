require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize database
db.init();
db.seedProducts();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/admin', adminRoutes);

// Frontend routes
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/products', (req, res) => {
  res.render('products', { user: req.session.user });
});

app.get('/product/:id', (req, res) => {
  res.render('product-detail', { user: req.session.user, productId: req.params.id });
});

app.get('/cart', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('cart', { user: req.session.user });
});

app.get('/checkout', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('checkout', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user });
});

app.get('/orders', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('orders', { user: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
