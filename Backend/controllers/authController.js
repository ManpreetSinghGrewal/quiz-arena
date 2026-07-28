import User from "../models/userModel.js";
import QuizResult from "../models/quizResultModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateQuestions } from "../services/quizService.js";
import { notifyStatsUpdate, broadcastActivity } from "../services/socketService.js";

const buildToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev-secret-change-in-production", { expiresIn: "24h" });

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || 0,
});

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const hashResetCode = (email, code) => {
  const secret = process.env.JWT_SECRET || "dev";
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${code}:${secret}`)
    .digest("hex");
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!generalEmailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const allowedDomainRegex = /@(gmail\.com|yahoo\.com|chitkara\.edu\.in|mail\.com|gmx\.com|outlook\.com)$/i;
    if (!allowedDomainRegex.test(email)) {
      return res.status(400).json({
        message: "Email must end with @gmail.com, @yahoo.com, @chitkara.edu.in, @mail.com, @gmx.com or @outlook.com",
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, contain 1 uppercase letter and 1 number",
      });
    }

    const usernameExists = await User.findOne({ name });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, avatar: 0 });
    const token = buildToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Don't Have an Account" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = buildToken(user._id);
    res.json({
      message: "Login successful",
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || 0,
      createdAt: user.createdAt,
      totalScore: user.totalScore || 0,
      prevTotalScore: user.prevTotalScore || 0,
      totalQuizzes: user.totalQuizzes || 0,
      totalQuestions: user.totalQuestions || 0,
      correctAnswers: user.correctAnswers || 0,
      accuracy: user.accuracy || 0,
      prevAccuracy: user.prevAccuracy || 0,
      currentStreak: user.currentStreak || 0,
      lastQuizDate: user.lastQuizDate || null,
      lastQuizLocalDate: user.lastQuizLocalDate || null,
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;
    const updates = {};

    if (avatar !== undefined) {
      const avatarNumber = Number(avatar);
      if (!Number.isInteger(avatarNumber) || avatarNumber < 0 || avatarNumber > 11) {
        return res.status(400).json({ message: "Avatar index must be between 0 and 11" });
      }
      updates.avatar = avatarNumber;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: "after" });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const saveQuizResult = async (req, res) => {
  try {
    const { score, correctAnswers, totalQuestions, mode, clientLocalDate, subject, topics, questions, classLevel } = req.body;
    const userId = req.user._id;
    if (score === undefined || correctAnswers === undefined || totalQuestions === undefined || !mode) {
      return res.status(400).json({ message: "All fields required" });
    }

    const incScore = Number(score) || 0;
    const incCorrect = Number(correctAnswers) || 0;
    const incTotalQuestions = Number(totalQuestions) || 0;
    const localDate = clientLocalDate || new Date().toISOString().slice(0, 10);
    const user = await User.findById(userId); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Save detailed QuizResult
    const newResult = await QuizResult.create({
      user: userId,
      subject: subject || "General",
      topics: topics || [],
      score: incScore,
      totalQuestions: incTotalQuestions,
      correctAnswers: incCorrect,
      mode,
      questions: questions || [],
      classLevel: classLevel || "10",
      date: new Date()
    });

    // 2. Update User Stats
    const prevTotalScore = user.totalScore || 0;
    const prevAccuracy = user.accuracy || 0;
    const nextTotalScore = prevTotalScore + incScore;
    const nextTotalQuizzes = (user.totalQuizzes || 0) + 1;
    const nextCorrectAnswers = (user.correctAnswers || 0) + incCorrect;
    const nextTotalQuestions = (user.totalQuestions || 0) + incTotalQuestions;
    const nextAccuracy = nextTotalQuestions > 0
      ? Math.round((nextCorrectAnswers / nextTotalQuestions) * 100)
      : 0;

    const parseLocalDate = (dateStr) => {
      if (!dateStr || typeof dateStr !== "string") return null;
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
      const [year, month, day] = parts;
      return new Date(Date.UTC(year, month - 1, day));
    };

    const lastLocalDate = parseLocalDate(user.lastQuizLocalDate);
    const todayLocalDate = parseLocalDate(localDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays =
      lastLocalDate && todayLocalDate
        ? Math.floor((todayLocalDate.getTime() - lastLocalDate.getTime()) / msPerDay)
        : null;

    let nextStreak = user.currentStreak || 0;
    if (!lastLocalDate) {
      nextStreak = 1;
    } else if (diffDays === 0) {
      nextStreak = user.currentStreak || 1;
    } else if (diffDays === 1) {
      nextStreak = (user.currentStreak || 0) + 1;
    } else {
      nextStreak = 1;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          prevTotalScore,
          prevAccuracy,
          totalScore: nextTotalScore,
          totalQuizzes: nextTotalQuizzes,
          correctAnswers: nextCorrectAnswers,
          totalQuestions: nextTotalQuestions,
          accuracy: nextAccuracy,
          currentStreak: nextStreak,
          lastQuizLocalDate: localDate,
          lastQuizDate: new Date(),
        },
      },
      { new: true }
    );

    // Live Updates
    const stats = {
      totalScore: nextTotalScore,
      totalQuizzes: nextTotalQuizzes,
      totalQuestions: nextTotalQuestions,
      correctAnswers: nextCorrectAnswers,
      accuracy: nextAccuracy,
      currentStreak: nextStreak,
    };

    notifyStatsUpdate(userId, stats);
    broadcastActivity({
      userName: user.name,
      subject: subject || "General",
      score: incScore,
      timestamp: new Date()
    });

    res.json({
      message: "Quiz result saved successfully",
      resultId: newResult._id,
      stats,
    });

  } catch (error) {
    console.error("SAVE QUIZ RESULT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getQuizQuestions = async (req, res) => {
  try {
    const subject = req.query.subject || "Physics";
    const classLevel = req.query.classLevel || "10";
    const amount = req.query.amount || 5;
    const topics = req.query.topics ? req.query.topics.split(',') : [];

    const questions = await generateQuestions(subject, classLevel, amount, topics);
    res.json({ questions });
  } catch (error) {
    console.error("GET QUIZ QUESTIONS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await QuizResult.find({ user: userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    console.error("GET QUIZ HISTORY ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateName = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const usernameExists = await User.findOne({ name: name.trim(), _id: { $ne: userId } });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { returnDocument: "after" });
    res.json({
      message: "Name updated successfully",
      name: user.name,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("UPDATE NAME ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, contain 1 uppercase letter and 1 number",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const users = await User.find()
      .sort({ totalScore: -1 })
      .limit(limit)
      .select("name totalScore totalQuizzes correctAnswers accuracy avatar");

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      score: user.totalScore,
      quizzes: user.totalQuizzes,
      correctAnswers: user.correctAnswers,
      accuracy: user.accuracy,
      avatar: user.avatar || 0,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error("LEADERBOARD ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond success to avoid account enumeration.
    if (!user) {
      return res.json({ message: "If the account exists, a reset code has been created." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetCodeHash = hashResetCode(normalizedEmail, code);
    user.passwordResetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log(`Password reset code for ${normalizedEmail}: ${code}`);

    const response = { message: "Reset code created. Check your email/code and continue." };
    if (process.env.NODE_ENV !== "production") {
      response.resetCode = code;
      response.expiresInMinutes = 10;
    }
    return res.json(response);
  } catch (error) {
    console.error("REQUEST PASSWORD RESET ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return res.status(400).json({ message: "Reset code must be 6 digits" });
    }
    if (!newPassword) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, contain 1 uppercase letter and 1 number",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    if (!user.passwordResetCodeHash || !user.passwordResetCodeExpiresAt) {
      return res.status(400).json({ message: "No active reset request. Please request a new code." });
    }

    if (user.passwordResetCodeExpiresAt.getTime() < Date.now()) {
      user.passwordResetCodeHash = null;
      user.passwordResetCodeExpiresAt = null;
      await user.save();
      return res.status(400).json({ message: "Reset code expired. Please request a new code." });
    }

    const expectedHash = user.passwordResetCodeHash;
    const providedHash = hashResetCode(normalizedEmail, code.trim());
    if (providedHash !== expectedHash) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetCodeHash = null;
    user.passwordResetCodeExpiresAt = null;
    await user.save();

    return res.json({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
