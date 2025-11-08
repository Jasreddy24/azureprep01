const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'ecommerce.db');
const db = new sqlite3.Database(dbPath);

const init = () => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products table
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
  )`);

  // Cart table
  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(user_id, product_id)
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  console.log('Database initialized');
};

const seedProducts = () => {
  const products = [
    {
      name: 'Elegant Evening',
      description: 'A sophisticated blend of jasmine, rose, and vanilla. Perfect for evening occasions.',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b75?w=500',
      stock: 50,
      category: 'Women',
      brand: 'Luxury Scents'
    },
    {
      name: 'Ocean Breeze',
      description: 'Fresh aquatic notes with citrus and white musk. Ideal for daily wear.',
      price: 65.99,
      image_url: 'https://images.unsplash.com/photo-1588405748880-12d1f469b8c9?w=500',
      stock: 75,
      category: 'Men',
      brand: 'Fresh Air'
    },
    {
      name: 'Midnight Mystery',
      description: 'Dark and seductive with notes of amber, oud, and patchouli.',
      price: 95.99,
      image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500',
      stock: 30,
      category: 'Unisex',
      brand: 'Noir'
    },
    {
      name: 'Rose Garden',
      description: 'Romantic floral bouquet with Bulgarian rose, peony, and white musk.',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
      stock: 60,
      category: 'Women',
      brand: 'Floral Dreams'
    },
    {
      name: 'Citrus Fresh',
      description: 'Energizing blend of bergamot, lemon, and grapefruit with a hint of mint.',
      price: 55.99,
      image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500',
      stock: 80,
      category: 'Men',
      brand: 'Zest'
    },
    {
      name: 'Vanilla Dream',
      description: 'Warm and comforting with vanilla, caramel, and tonka bean.',
      price: 69.99,
      image_url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e1af?w=500',
      stock: 45,
      category: 'Women',
      brand: 'Sweet Scents'
    },
    {
      name: 'Woody Elite',
      description: 'Masculine blend of cedarwood, sandalwood, and vetiver.',
      price: 85.99,
      image_url: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=500',
      stock: 55,
      category: 'Men',
      brand: 'Timber'
    },
    {
      name: 'Lavender Fields',
      description: 'Calming and serene with French lavender, chamomile, and eucalyptus.',
      price: 72.99,
      image_url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e1af?w=500',
      stock: 65,
      category: 'Unisex',
      brand: 'Nature'
    },
    {
      name: 'Sensual Silk',
      description: 'Luxurious blend of orchid, white lily, and cashmere wood.',
      price: 99.99,
      image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
      stock: 40,
      category: 'Women',
      brand: 'Silk'
    },
    {
      name: 'Power Sport',
      description: 'Dynamic and energetic with green apple, mint, and cedar.',
      price: 59.99,
      image_url: 'https://images.unsplash.com/photo-1588405748880-12d1f469b8c9?w=500',
      stock: 70,
      category: 'Men',
      brand: 'Active'
    }
  ];

  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking products:', err);
      return;
    }

    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO products (name, description, price, image_url, stock, category, brand) 
                               VALUES (?, ?, ?, ?, ?, ?, ?)`);
      
      products.forEach(product => {
        stmt.run(
          product.name,
          product.description,
          product.price,
          product.image_url,
          product.stock,
          product.category,
          product.brand
        );
      });
      
      stmt.finalize();
      console.log('Products seeded successfully');
    }
  });
};

module.exports = {
  db,
  init,
  seedProducts
};
