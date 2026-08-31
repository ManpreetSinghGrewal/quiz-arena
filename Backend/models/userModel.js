import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: Number,
      default: 0,
      min: 0,
      max: 11,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    prevTotalScore: {
      type: Number,
      default: 0,
    },
    totalQuizzes: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    prevAccuracy: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastQuizDate: {
      type: Date,
      default: null,
    },
    lastQuizLocalDate: {
      type: String,
      default: null,
    },
    passwordResetCodeHash: {
      type: String,
      default: null,
    },
    passwordResetCodeExpiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCodeHash: {
      type: String,
      default: null,
    },
    verificationCodeExpiresAt: {
      type: Date,
      default: null,
    },
    badges: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
