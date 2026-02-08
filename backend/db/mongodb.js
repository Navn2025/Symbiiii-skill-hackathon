import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hirespec';

  try {
    await mongoose.connect(uri, {
      dbName: 'hirespec',
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('   Make sure MongoDB is running and MONGODB_URI is correct');
    throw error;
  }
}

export function getMongoose() {
  return mongoose;
}
