import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    topics: [String],
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ['normal', 'daily', 'speed', 'battle'],
      default: 'normal',
    },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
        userAnswer: Number,
        isCorrect: Boolean,
        hint: String,
        explanation: String,
      },
    ],
    classLevel: {
      type: String,
      default: '10',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('QuizResult', quizResultSchema);
