import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js to prefer IPv4 for DNS resolution (fixes SRV lookup issues on some networks)
dns.setDefaultResultOrder('ipv4first');

mongoose.set('strictQuery', true);

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection active');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected');
});

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}
