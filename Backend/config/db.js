import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const getCandidateUris = () => {
  const candidates = [];
  if (process.env.MONGO_URI) candidates.push(process.env.MONGO_URI);
  // Local fallback so the backend can run without Atlas/DNS.
  candidates.push('mongodb://127.0.0.1:27017/quizdb');
  return [...new Set(candidates)];
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  const uris = getCandidateUris();
  for (const uri of uris) {
    try {
      const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      console.log(`Connecting to MongoDB at: ${sanitizedUri}`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected successfully to: ${sanitizedUri}`);
      return;
    } catch (error) {
      console.error(`DB Connection Failed (${uri.split('@')[1] || uri})`, error?.code || error?.message || error);
    }
  }

  console.warn(
    'MongoDB is not connected. Endpoints that require the database (auth/profile/leaderboard) will return 503 until a DB is available.'
  );
};
