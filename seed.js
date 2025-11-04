const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

// Sample products data
const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    price: 99.99,
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    stock: 50,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300"
  },
  {
    name: "Smartphone Case - Clear",
    price: 19.99,
    description: "Protective clear case for smartphones with raised edges for screen protection.",
    stock: 100,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300"
  },
  {
    name: "Cotton T-Shirt",
    price: 24.99,
    description: "Comfortable 100% cotton t-shirt available in multiple colors.",
    stock: 75,
    category: "Clothing",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300"
  },
  {
    name: "Programming Book - JavaScript",
    price: 49.99,
    description: "Comprehensive guide to modern JavaScript development with practical examples.",
    stock: 30,
    category: "Books",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300"
  },
  {
    name: "Coffee Maker",
    price: 79.99,
    description: "Automatic drip coffee maker with programmable timer and thermal carafe.",
    stock: 25,
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300"
  },
  {
    name: "Laptop Stand",
    price: 39.99,
    description: "Adjustable aluminum laptop stand for better ergonomics and cooling.",
    stock: 40,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300"
  },
  {
    name: "Denim Jeans",
    price: 59.99,
    description: "Classic fit denim jeans made from premium cotton blend.",
    stock: 60,
    category: "Clothing",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300"
  },
  {
    name: "Garden Tools Set",
    price: 89.99,
    description: "Complete set of gardening tools including shovel, rake, and pruning shears.",
    stock: 20,
    category: "Home",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300"
  },
  {
    name: "Fitness Tracker",
    price: 129.99,
    description: "Advanced fitness tracker with heart rate monitor and GPS tracking.",
    stock: 35,
    category: "Electronics",
    imageUrl: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=300"
  },
  {
    name: "Cookbook - Healthy Recipes",
    price: 29.99,
    description: "Collection of healthy and delicious recipes for everyday cooking.",
    stock: 45,
    category: "Books",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300"
  }
];

// Sample admin user
const adminUser = {
  name: "Admin User",
  email: "admin@resolute.com",
  password: "admin123",
  role: "ADMIN"
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} sample products`);

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (!existingAdmin) {
      const admin = await User.create(adminUser);
      console.log('Created admin user:', admin.email);
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();




