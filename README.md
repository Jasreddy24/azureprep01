# Perfume E-commerce Website

A full-stack e-commerce website for perfumes built with Node.js, Express, SQLite, and EJS.

## Features

- **User Authentication**: Register and login system with session management
- **Product Catalog**: Browse and search perfumes by category and name
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Management**: Place orders and track order status
- **Admin Panel**: Manage products and orders (admin access required)
- **Responsive Design**: Mobile-friendly interface

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults are provided):
```
PORT=3000
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Database

The application uses SQLite database which will be automatically created on first run. Sample perfume products are seeded automatically.

## Creating an Admin Account

To create an admin account, run:

```bash
npm run create-admin
```

This will prompt you to enter:
- Admin name
- Admin email
- Admin password

Alternatively, you can manually insert an admin user into the database. The database stores admin status in the `users` table with `is_admin` field (1 for admin, 0 for regular user).

## Project Structure

```
ecom/
├── config/
│   └── database.js       # Database configuration and seeding
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── products.js      # Product routes
│   ├── cart.js          # Shopping cart routes
│   ├── orders.js        # Order routes
│   └── admin.js         # Admin routes
├── views/
│   ├── partials/        # EJS partials (header, footer, layout)
│   ├── admin/           # Admin views
│   └── *.ejs            # Main views
├── public/
│   ├── css/
│   │   └── style.css    # Main stylesheet
│   └── js/
│       └── main.js      # Client-side JavaScript
├── server.js            # Main server file
└── package.json         # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (supports query params: category, search, page, limit)
- `GET /api/products/:id` - Get single product

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `POST /api/orders/create` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Admin
- `GET /admin/products` - Get all products (admin)
- `POST /admin/products` - Create product (admin)
- `PUT /admin/products/:id` - Update product (admin)
- `DELETE /admin/products/:id` - Delete product (admin)
- `GET /admin/orders` - Get all orders (admin)
- `PUT /admin/orders/:id/status` - Update order status (admin)

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite3** - Database
- **EJS** - Template engine
- **bcrypt** - Password hashing
- **express-session** - Session management

## License

ISC
