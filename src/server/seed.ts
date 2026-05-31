import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import AdminUser from './models/AdminUser.js';
import Product from './models/Product.js';
import Coupon from './models/Coupon.js';

const sampleProducts = [
  {
    name: 'Bordeaux Structured Tote',
    description: 'A refined structured tote crafted from premium Italian leather. Perfect for everyday elegance.',
    basePrice: 2999,
    category: 'Tote',
    featured: true,
    tags: ['bestseller', 'new arrival'],
    material: 'Italian Pebble Leather',
    dimensions: '35cm x 28cm x 14cm',
    variants: [
      {
        color: { name: 'Bordeaux Red', hexCode: '#722F37' },
        price: 3200,
        compareAtPrice: 4500,
        discount: { percentage: 29, label: 'Launch Offer' },
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'],
        stock: 12,
        sku: 'ZRV-TOTE-BRD-001',
      },
      {
        color: { name: 'Classic Black', hexCode: '#1A1A1A' },
        price: 2999,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'],
        stock: 20,
        sku: 'ZRV-TOTE-BLK-001',
      },
      {
        color: { name: 'Ivory Cream', hexCode: '#FFFFF0' },
        price: 3400,
        compareAtPrice: 4200,
        discount: { percentage: 19, label: 'Summer Sale' },
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80'],
        stock: 8,
        sku: 'ZRV-TOTE-IVR-001',
      },
    ],
  },
  {
    name: 'Elysian Gold Clutch',
    description: 'An evening clutch with gold-tone hardware and magnetic closure. Designed for special occasions.',
    basePrice: 1850,
    category: 'Clutch',
    featured: true,
    tags: ['limited edition'],
    material: 'Saffiano Leather',
    dimensions: '25cm x 15cm x 5cm',
    variants: [
      {
        color: { name: 'Gold Shimmer', hexCode: '#D4AF37' },
        price: 1850,
        images: ['https://images.unsplash.com/photo-1566150905458-1bf1fd111c91?w=800&q=80'],
        stock: 15,
        sku: 'ZRV-CLT-GLD-001',
      },
      {
        color: { name: 'Rose Pink', hexCode: '#E8A0BF' },
        price: 1950,
        images: ['https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&q=80'],
        stock: 10,
        sku: 'ZRV-CLT-RSE-001',
      },
    ],
  },
  {
    name: 'Urban Crossbody Sling',
    description: 'A versatile crossbody bag with adjustable strap. Hands-free convenience meets refined style.',
    basePrice: 2200,
    category: 'Crossbody',
    featured: false,
    tags: ['everyday', 'new arrival'],
    material: 'Full Grain Leather',
    dimensions: '22cm x 18cm x 8cm',
    variants: [
      {
        color: { name: 'Olive Green', hexCode: '#5A5A40' },
        price: 2200,
        images: ['https://images.unsplash.com/photo-1590156221122-c4465ce28920?w=800&q=80'],
        stock: 18,
        sku: 'ZRV-CRS-OLV-001',
      },
      {
        color: { name: 'Tan Brown', hexCode: '#8B6914' },
        price: 2200,
        images: ['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&q=80'],
        stock: 14,
        sku: 'ZRV-CRS-TAN-001',
      },
      {
        color: { name: 'Navy Blue', hexCode: '#1B2A4A' },
        price: 2400,
        compareAtPrice: 2800,
        discount: { percentage: 14, label: 'Monsoon Special' },
        images: ['https://images.unsplash.com/photo-1548036657-3f744421b203?w=800&q=80'],
        stock: 6,
        sku: 'ZRV-CRS-NVY-001',
      },
    ],
  },
  {
    name: 'Heritage Bucket Bag',
    description: 'A spacious bucket bag with drawstring closure. Timeless silhouette meets modern functionality.',
    basePrice: 3800,
    category: 'Bucket',
    featured: true,
    tags: ['premium', 'bestseller'],
    material: 'Vegetable Tanned Leather',
    dimensions: '28cm x 32cm x 16cm',
    variants: [
      {
        color: { name: 'Cognac', hexCode: '#8B4513' },
        price: 3800,
        images: ['https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80'],
        stock: 7,
        sku: 'ZRV-BKT-COG-001',
      },
      {
        color: { name: 'Midnight Black', hexCode: '#0D0D0D' },
        price: 4200,
        compareAtPrice: 5000,
        discount: { percentage: 16, label: 'Exclusive' },
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'],
        stock: 5,
        sku: 'ZRV-BKT-BLK-001',
      },
    ],
  },
];

async function seed() {
  await connectDB();

  // Seed admin user — delete old one and create with new credentials
  await AdminUser.deleteMany({});
  const passwordHash = await bcrypt.hash('adminmu7', 10);
  await AdminUser.create({
    username: 'adminmu',
    passwordHash,
  });
  console.log('Admin user created (username: adminmu, password: adminmu7).');

  // Delete existing products and re-seed with new variant structure
  await Product.deleteMany({});
  console.log('Existing products deleted.');

  await Product.insertMany(sampleProducts);
  console.log(`${sampleProducts.length} products seeded with variant structure.`);

  // Seed coupons
  await Coupon.deleteMany({});
  const sampleCoupons = [
    {
      code: 'WELCOME10',
      type: 'percentage' as const,
      value: 10,
      minOrderAmount: 999,
      maxDiscount: 500,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
    },
    {
      code: 'FLAT200',
      type: 'fixed' as const,
      value: 200,
      minOrderAmount: 1500,
      usageLimit: 500,
      usedCount: 0,
      isActive: true,
    },
    {
      code: 'FIRST50',
      type: 'percentage' as const,
      value: 50,
      minOrderAmount: 500,
      maxDiscount: 1000,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
  ];
  await Coupon.insertMany(sampleCoupons);
  console.log(`${sampleCoupons.length} coupons seeded.`);

  await mongoose.disconnect();
  console.log('Seed complete. Disconnected from MongoDB.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
