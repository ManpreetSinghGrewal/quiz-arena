# 🏆 Quiz Arena

Welcome to **Quiz Arena**, a dynamic full-stack platform where users can participate in real-time multiplayer matchmaking quizzes or practice topic-based generated quizzes.

🚀 **Live Demo:** [https://quiz-arena-lake.vercel.app/](https://quiz-arena-lake.vercel.app/)

## 📖 Project Overview

Quiz Arena is built with a modern tech stack to ensure high performance, scalable architecture, and a rich user experience. It features real-time interactions, AI-powered question generation, and secure authentication. 

### ✨ Key Features
- **Real-Time Multiplayer Matchmaking:** Compete with others in live quiz battles using Socket.io.
- **AI-Powered Quizzes:** Dynamically generates challenging questions using **Google Gemini AI** with an OpenTDB fallback.
- **Computer Science Focus:** Specialized topics including Operating System, Linux, Computer Networks, DBMS, DSA, and C/Pointers.
- **Detailed Result Tracking:** View comprehensive quiz results, individual questions, answers, and solutions on your personalized dashboard.
- **Secure Authentication:** Email-based OTP authentication for secure registration and login.
- **Modern UI/UX:** Responsive, visually appealing interface styled with Tailwind CSS and shadcn/ui.

---

## 🛠️ Technology Stack

**Frontend:**
- React (with Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Socket.io Client

**Backend:**
- Node.js & Express.js
- MongoDB (Mongoose)
- Socket.io (Real-time WebSockets)
- Google Gemini AI Integration
- JWT & bcryptjs for Authentication

---

## 💻 Local Development Setup

To run Quiz Arena locally, you'll need to start both the Frontend and Backend servers.

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini AI API Key (if needed for question generation)

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd quiz-arena
```

### 2. Backend Setup
The backend server runs on port **8080** by default.

```bash
cd Backend
# Install dependencies
npm install

# Set up environment variables
# Create a .env file and add your config (e.g., PORT=8080, MONGODB_URI, GEMINI_API_KEY, etc.)

# Start the development server using nodemon
npm run dev

# Alternatively, start the production server
npm start
```

### 3. Frontend Setup
The frontend development server runs on port **5173**.

```bash
cd Frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🔌 Ports Summary
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:8080` (or the port specified in your `.env` file)

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 

## 📝 License
This project is available under the ISC License.
