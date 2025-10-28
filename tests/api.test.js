const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

describe('E-Commerce API Tests', () => {
  let userToken;
  let adminToken;
  let productId;
  let orderId;

  beforeAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
  });

  describe('Authentication', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'USER'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('test@example.com');
      userToken = response.body.data.token;
    });

    test('should register an admin user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'ADMIN'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('ADMIN');
      adminToken = response.body.data.token;
    });

    test('should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('Products', () => {
    test('should create a product (admin)', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          description: 'A test product',
          stock: 100,
          category: 'test'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.product.name).toBe('Test Product');
      productId = response.body.data.product._id;
    });

    test('should get all products', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.products).toHaveLength(1);
    });

    test('should get single product', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.product._id).toBe(productId);
    });
  });

  describe('Cart', () => {
    test('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.cart.items).toHaveLength(1);
    });

    test('should get user cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.cart.totalItems).toBe(2);
    });
  });

  describe('Orders', () => {
    test('should create order from cart', async () => {
      const response = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Test Country'
          },
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.status).toBe('PENDING_PAYMENT');
      orderId = response.body.data.order._id;
    });

    test('should process payment', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${userToken}`);

      // Payment might succeed or fail randomly (90% success rate)
      expect([200, 400]).toContain(response.status);
    });

    test('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.orders).toBeDefined();
    });
  });

  describe('Admin', () => {
    test('should get all orders (admin)', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.orders).toBeDefined();
    });

    test('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.statistics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/api/cart');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    test('should return 403 for insufficient permissions', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Product',
          price: 50,
          description: 'This should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
});
