# Zarevielle - Luxury Handbag E-Commerce

A full-stack e-commerce platform for luxury handcrafted handbags, built with React, Express, and MongoDB.

## Features

- 🛍️ **Product Catalog** - Browse products with variants, colors, and pricing
- 🛒 **Shopping Cart** - Add to cart, manage quantities
- 💳 **Razorpay Payments** - Secure payment processing
- 📦 **Order Management** - Track orders and status updates
- ⭐ **Product Reviews** - Customer reviews and ratings
- 💝 **Wishlist** - Save favorite products
- 👁️ **Recently Viewed** - Track browsing history
- 📧 **Newsletter** - Email subscription system
- 📱 **Responsive Design** - Mobile-first approach
- 🔐 **Admin Dashboard** - Manage products, orders, customers

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **Payments**: Razorpay
- **Auth**: Firebase Authentication
- **Images**: Cloudinary
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/zarevielle.git
cd zarevielle
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
cp firebase-applet-config.example.json firebase-applet-config.json
```

4. Fill in your credentials in `.env` and `firebase-applet-config.json`

5. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` for all required environment variables:

- `MONGODB_URI` - MongoDB connection string
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `CLOUDINARY_*` - Cloudinary credentials
- `SMTP_*` - Email configuration

## Project Structure

```
├── src/
│   ├── admin/          # Admin dashboard
│   ├── components/     # React components
│   ├── context/        # React contexts
│   ├── pages/          # Page components
│   ├── server/         # Express backend
│   │   ├── models/     # MongoDB models
│   │   ├── routes/     # API routes
│   │   └── services/   # Business logic
│   └── lib/            # Utilities
├── public/             # Static assets
├── server.ts           # Express server entry
└── index.html          # HTML template
```

## API Endpoints

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/payments/order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/orders` - Get user orders
- `GET /api/reviews/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

## Deployment

See deployment guide for Hostinger VPS setup with Nginx and PM2.

## License

Private - All rights reserved

---

Built with ❤️ for Zarevielle
