# 🛍️ E-Commerce Dashboard - Resolute Solutions

A comprehensive e-commerce platform with a modern Amazon-inspired dashboard interface, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

### Frontend Dashboard
- **Amazon-inspired UI/UX** with responsive design
- **User Authentication** (Login/Register with JWT)
- **Product Catalog** with search, filtering, and pagination
- **Shopping Cart** with add/remove/update functionality
- **Order Management** with checkout and payment processing
- **Admin Panel** for order and product management
- **Real-time Updates** and notifications

### Backend APIs
- **Authentication System** with JWT tokens
- **Product Management** (CRUD operations)
- **Shopping Cart** with persistent storage
- **Order Processing** with payment simulation
- **Admin Dashboard** with analytics
- **Email Queue** for async processing
- **Rate Limiting** and security middleware

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resolute-solutions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `config.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   REDIS_URL=redis://localhost:6379
   PORT=3000
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Access the dashboard**
   Open your browser and navigate to:
   - Main page: `http://localhost:3000`
   - Dashboard: `http://localhost:3000/dashboard`

## 🎯 Usage

### Default Admin Account
- **Email**: admin@resolute.com
- **Password**: admin123
- **Role**: ADMIN

### Dashboard Features

#### 1. **Authentication**
- Register new users
- Login with existing credentials
- JWT token-based authentication
- Automatic token refresh

#### 2. **Product Browsing**
- View featured products on homepage
- Search products by name/description
- Filter by categories (Electronics, Clothing, Books, Home)
- Product details with ratings and reviews

#### 3. **Shopping Cart**
- Add products to cart
- Update quantities
- Remove items
- View cart total and item count
- Persistent cart across sessions

#### 4. **Order Management**
- Checkout process with shipping address
- Payment simulation (90% success rate)
- Order history and tracking
- Order status updates

#### 5. **Admin Panel**
- Dashboard statistics (orders, users, products, revenue)
- Order management and status updates
- Product management (CRUD operations)
- User management

## 🎨 Dashboard Design

The dashboard features an Amazon-inspired design with:

- **Header**: Logo, search bar, user actions (Account, Orders, Cart)
- **Navigation**: Category filters and admin panel access
- **Hero Section**: Welcome message and call-to-action
- **Dashboard Cards**: Statistics overview (Products, Users, Orders, Revenue)
- **Product Grid**: Featured products with hover effects
- **Modals**: Login, Register, Cart, Orders, Admin Panel
- **Responsive Design**: Mobile-friendly layout
- **Color Scheme**: Amazon-inspired orange (#ff9900) and dark blue (#232f3e)

## 🔧 Technical Stack

### Frontend
- **HTML5** with semantic markup
- **CSS3** with Flexbox and Grid layouts
- **Vanilla JavaScript** (ES6+)
- **Font Awesome** icons
- **Google Fonts** (Inter)

### Backend
- **Node.js** runtime
- **Express.js** web framework
- **MongoDB** database with Mongoose ODM
- **JWT** authentication
- **bcryptjs** password hashing
- **Joi** validation
- **Bull** job queue
- **Nodemailer** email service
- **Redis** caching (optional)

### Security Features
- **Helmet** security headers
- **CORS** configuration
- **Rate limiting**
- **Input validation**
- **Password hashing**
- **JWT token authentication**

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with pagination, search, filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/categories/list` - Get all categories

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update item quantity
- `DELETE /api/cart/items/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders
- `POST /api/orders/checkout` - Create order from cart
- `POST /api/orders/:id/pay` - Process payment
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order details

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users
- `GET /api/admin/products` - Get all products (including inactive)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 Development

### Project Structure
```
resolute-solutions/
├── dashboard.html          # Main dashboard interface
├── index.html             # Landing page
├── server.js              # Express server
├── seed.js                # Database seeding script
├── package.json           # Dependencies and scripts
├── config.env             # Environment variables
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   ├── errorHandler.js   # Error handling
│   └── validation.js     # Input validation
├── models/               # MongoDB models
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Order.js
│   └── Payment.js
├── routes/               # API routes
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   └── admin.js
├── services/             # Business logic
│   └── emailQueue.js
└── tests/                # Test files
    └── api.test.js
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `EMAIL_*` - Email service configuration
- `REDIS_URL` - Redis connection (optional)

### Production Considerations
- Use a process manager like PM2
- Set up MongoDB Atlas for cloud database
- Configure proper CORS origins
- Use environment-specific JWT secrets
- Set up proper logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

**Resolute Solutions** - Advanced E-Commerce Platform Development

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by Resolute Solutions**

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (User vs Admin)
- **Complex State Management**: Order lifecycle management through various statuses
- **Inventory Reservation**: Stock locking mechanism to prevent race conditions
- **Database Transactions**: Atomic operations for checkout and payment processing
- **Background Jobs**: Email queue system for order confirmations
- **Robust API Design**: Pagination, filtering, sorting, and comprehensive error handling
- **Input Validation**: Joi validation for all request bodies and parameters

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (cloud database) - **Already configured**
- Redis (for background job processing) - can use local Redis or Redis cloud
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp config.env.example config.env
   ```
   
   Update the `config.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   REDIS_URL=redis://localhost:6379
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
   
   **For MongoDB Atlas (Cloud):**
   ```env
   MONGODB_URI=mongodb+srv://bhavikdeveloper02_db_user:root@123@cluster0.mikuzfs.mongodb.net/ecommerce-api
   ```

4. **Start Redis (if using local Redis)**
   ```bash
   # Start Redis (in another terminal)
   redis-server
   ```
   
   **Note:** MongoDB Atlas is already configured and running in the cloud. No local MongoDB setup required.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User Profile
```http
GET /auth/me
Authorization: Bearer <jwt-token>
```

### Product Endpoints

#### Get All Products (Public)
```http
GET /products?page=1&limit=10&sort=price&order=asc&search=laptop&category=electronics&minPrice=100&maxPrice=1000
```

#### Get Single Product
```http
GET /products/:id
```

#### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MacBook Pro",
  "price": 1999.99,
  "description": "Apple MacBook Pro 13-inch",
  "stock": 50,
  "category": "electronics",
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Update Product (Admin Only)
```http
PUT /products/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "MacBook Pro 14-inch",
  "price": 2199.99,
  "stock": 30
}
```

#### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer <admin-jwt-token>
```

### Cart Endpoints

#### Get User's Cart
```http
GET /cart
Authorization: Bearer <jwt-token>
```

#### Add Item to Cart
```http
POST /cart/items
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "productId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "quantity": 2
}
```

#### Update Item Quantity
```http
PUT /cart/items/:productId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /cart/items/:productId
Authorization: Bearer <jwt-token>
```

#### Clear Cart
```http
DELETE /cart
Authorization: Bearer <jwt-token>
```

### Order Endpoints

#### Create Order (Checkout)
```http
POST /orders/checkout
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "CREDIT_CARD",
  "notes": "Please deliver after 5 PM"
}
```

#### Process Payment
```http
POST /orders/:id/pay
Authorization: Bearer <jwt-token>
```

#### Get User's Orders
```http
GET /orders?page=1&limit=10&status=PAID&sort=createdAt&order=desc
Authorization: Bearer <jwt-token>
```

#### Get Single Order
```http
GET /orders/:id
Authorization: Bearer <jwt-token>
```

### Admin Endpoints

#### Get All Orders
```http
GET /admin/orders?page=1&limit=10&status=SHIPPED&userId=60f7b3b3b3b3b3b3b3b3b3b3
Authorization: Bearer <admin-jwt-token>
```

#### Update Order Status
```http
PATCH /admin/orders/:id/status
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

#### Get Dashboard Statistics
```http
GET /admin/dashboard
Authorization: Bearer <admin-jwt-token>
```

#### Get All Users
```http
GET /admin/users?page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Get All Products (Including Inactive)
```http
GET /admin/products?page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

## 🔄 Order Workflow

1. **User Registration/Login**: User creates account or logs in to receive JWT token
2. **Add to Cart**: User adds products to their cart
3. **Checkout**: User initiates checkout process
   - Creates order with `PENDING_PAYMENT` status
   - Reserves stock atomically (moves from `availableStock` to `reservedStock`)
   - Sets 15-minute expiration timer
4. **Payment**: User completes payment
   - Updates order status to `PAID`
   - Commits stock reservation (reduces `stock`, clears `reservedStock`)
   - Queues confirmation email job
5. **Order Management**: Admin can update status to `SHIPPED` or `DELIVERED`
6. **Expiration Handling**: Orders not paid within 15 minutes are automatically cancelled

## 🗄️ Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (USER | ADMIN),
  isActive: Boolean
}
```

### Product
```javascript
{
  name: String,
  price: Number,
  description: String,
  stock: Number,
  reservedStock: Number,
  category: String,
  imageUrl: String,
  isActive: Boolean
}
```

### Cart
```javascript
{
  userId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: Number
  }],
  totalItems: Number,
  totalAmount: Number
}
```

### Order
```javascript
{
  userId: ObjectId,
  orderNumber: String (unique),
  items: [{
    productId: ObjectId,
    quantity: Number,
    priceAtPurchase: Number,
    productName: String
  }],
  totalAmount: Number,
  status: String (PENDING_PAYMENT | PAID | SHIPPED | DELIVERED | CANCELLED),
  shippingAddress: Object,
  paymentMethod: String,
  notes: String,
  expiresAt: Date
}
```

### Payment
```javascript
{
  orderId: ObjectId,
  transactionId: String (unique),
  amount: Number,
  status: String (SUCCESS | FAILED | PENDING),
  paymentMethod: String,
  gatewayResponse: Object,
  failureReason: String
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Joi validation for all inputs
- **Rate Limiting**: Prevents API abuse
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Role-based Access Control**: User and Admin roles

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   REDIS_URL=redis://your-production-redis
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name ecommerce-api
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear unauthorized access messages
- **Database Errors**: Mongoose error handling with user-friendly messages
- **Custom Errors**: Application-specific error handling
- **Centralized Error Handler**: Consistent error response format

## 📊 Background Jobs

The API uses Bull queue with Redis for background job processing:

- **Email Notifications**: Order confirmations, shipping updates, delivery notifications
- **Retry Logic**: Failed jobs are retried with exponential backoff
- **Job Monitoring**: Queue statistics and job status tracking

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ecommerce-api` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | Required |
| `EMAIL_PASS` | SMTP password | Required |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@example.com or create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Mobile app API endpoints
- [ ] Advanced inventory management
- [ ] Coupon and discount system
- [ ] Review and rating system
- [ ] Wishlist functionality
- [ ] Advanced search with Elasticsearch
#   r e s o l u t e - s o l u t i o n s 
 
 