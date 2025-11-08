# Quick Start Guide

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Create an Admin Account** (Optional)
   ```bash
   npm run create-admin
   ```

4. **Access the Website**
   - Open your browser and go to: `http://localhost:3000`
   - The database and sample products are automatically created on first run

## Using the Website

### As a Customer:
1. **Register/Login**: Create an account or login to start shopping
2. **Browse Products**: View all perfumes on the Products page
3. **Search & Filter**: Use search bar and category filter to find products
4. **View Details**: Click on any product to see full details
5. **Add to Cart**: Add products to your shopping cart
6. **Checkout**: Proceed to checkout and place your order
7. **Track Orders**: View your order history on the Orders page

### As an Admin:
1. **Login**: Login with an admin account
2. **Access Admin Panel**: Click on "Admin" in the navigation
3. **Manage Products**: 
   - Add new products
   - Edit existing products
   - Delete products
4. **Manage Orders**:
   - View all orders
   - Update order status (pending, processing, shipped, delivered, cancelled)

## Sample Products

The database is automatically seeded with 10 sample perfume products:
- Elegant Evening
- Ocean Breeze
- Midnight Mystery
- Rose Garden
- Citrus Fresh
- Vanilla Dream
- Woody Elite
- Lavender Fields
- Sensual Silk
- Power Sport

All products use stock images from Unsplash.

## Troubleshooting

- **Port already in use**: Change the PORT in `.env` file or kill the process using port 3000
- **Database errors**: Delete `ecommerce.db` and restart the server to recreate the database
- **Admin access denied**: Make sure you've created an admin account using `npm run create-admin`

## Features

✅ User authentication (register/login)
✅ Product catalog with search and filters
✅ Shopping cart functionality
✅ Order placement and tracking
✅ Admin panel for product and order management
✅ Responsive design
✅ Stock management
✅ Session management
