import rateLimit from "express-rate-limit";

// Rate limiting for auth routes (10 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  message: {
    message: "Too many authentication requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiting for AI quiz questions generation (20 requests per 15 minutes)
export const quizQuestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window`
  message: {
    message: "Too many quiz generation requests. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
