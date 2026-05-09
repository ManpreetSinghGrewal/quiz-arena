import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const CS_SUBJECT_KEYWORDS = {
  "Operating System": ["os", "kernel", "thread", "process", "memory", "linux", "windows", "unix", "boot"],
  "Linux": ["linux", "unix", "bash", "shell", "command", "ubuntu", "kernel", "directory", "root"],
  "Computer Networks": ["network", "ip", "tcp", "udp", "router", "switch", "protocol", "osi", "internet", "web"],
  "Data Base Management System": ["database", "sql", "query", "table", "relation", "dbms", "nosql", "mysql"],
  "Data Structures and Algorithms": ["algorithm", "sort", "search", "tree", "graph", "stack", "queue", "list", "array"],
  "C and Pointers": ["pointer", "memory", "address", "malloc", "free", "array", "struct", "reference"]
};

const FALLBACK_QUESTIONS = {
  "Operating System": [
    { question: "What is the core of an operating system?", options: ["Kernel", "Shell", "GUI", "Command Prompt"], correctAnswer: 0 },
    { question: "Which of the following is not an operating system?", options: ["Windows", "Linux", "Oracle", "macOS"], correctAnswer: 2 }
  ],
  "Linux": [
    { question: "Which command is used to list files in Linux?", options: ["ls", "dir", "list", "show"], correctAnswer: 0 },
    { question: "Who created Linux?", options: ["Linus Torvalds", "Bill Gates", "Steve Jobs", "Ken Thompson"], correctAnswer: 0 }
  ],
  "Computer Networks": [
    { question: "What does IP stand for?", options: ["Internet Protocol", "Internal Protocol", "Internet Provider", "Internal Provider"], correctAnswer: 0 },
    { question: "Which layer is not in the OSI model?", options: ["Application", "Transport", "Internet", "Physical"], correctAnswer: 2 }
  ],
  "Data Base Management System": [
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Strong Question Language", "Structured Question Language", "Strong Query Language"], correctAnswer: 0 },
    { question: "Which of the following is a NoSQL database?", options: ["MongoDB", "MySQL", "PostgreSQL", "Oracle"], correctAnswer: 0 }
  ],
  "Data Structures and Algorithms": [
    { question: "Which data structure uses LIFO?", options: ["Stack", "Queue", "Array", "Linked List"], correctAnswer: 0 },
    { question: "What is the time complexity of binary search?", options: ["O(log n)", "O(n)", "O(n^2)", "O(1)"], correctAnswer: 0 }
  ],
  "C and Pointers": [
    { question: "Which operator is used to get the address of a variable in C?", options: ["&", "*", "->", "."], correctAnswer: 0 },
    { question: "What does a pointer hold?", options: ["Memory address", "Value", "Function", "Array"], correctAnswer: 0 }
  ]
};

const shuffleArray = (array) => {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

const decodeHTML = (text = "") =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const generateQuestionsWithGemini = async (subject, classLevel, amount, topics = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here" || apiKey === "YOUR_API_KEY") {
      console.warn("GEMINI_API_KEY not properly set, skipping Gemini generation.");
      return null;
    }

    console.log(`Generating questions for ${subject} ${topics.length > 0 ? `(Topics: ${topics.join(', ')})` : ''} using Gemini...`);

    const topicConstraint = topics.length > 0 
      ? `specifically focusing on these topics: ${topics.join(', ')}` 
      : `covering general syllabus for ${subject}`;

    const prompt = `Generate ${amount} multiple choice questions for ${subject} ${topicConstraint} suitable for class level ${classLevel}. 
    Return the response ONLY as a JSON array of objects. 
    Each object must have the following structure:
    {
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0 // index of the correct option in the options array
    }
    Ensure questions are accurate, challenging but fair for level ${classLevel}, and options are distinct. Do not include any markdown formatting like \`\`\`json or \`\`\`.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON if there's any markdown formatting or extra text
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    const questions = JSON.parse(jsonStr);
    console.log(`Successfully parsed ${questions.length} questions from Gemini.`);
    return questions.map((q, idx) => ({
      id: idx + 1,
      question: decodeHTML(q.question),
      options: q.options.map(opt => decodeHTML(opt)),
      correctAnswer: q.correctAnswer,
      category: subject
    }));
  } catch (error) {
    console.error("Gemini question generation failed:", error.message);
    return null;
  }
};

export const generateQuestions = async (subject = "Operating System", classLevel = "10", amount = 5, topics = []) => {
  const nAmount = Number(amount) || 5;

  // Try Gemini First
  const geminiQuestions = await generateQuestionsWithGemini(subject, classLevel, nAmount, topics);
  if (geminiQuestions && geminiQuestions.length >= nAmount) {
    console.log(`Successfully generated ${geminiQuestions.length} questions using Gemini for ${subject}`);
    return geminiQuestions;
  }

  // Fallback to OpenTDB (Category 18 is Science: Computers)
  console.log(`Falling back to OpenTDB for ${subject} questions...`);
  const category = 18; 
  const difficulty = "medium";
  const fetchAmount = Math.min(nAmount * 4, 50);

  let remoteQuestions = [];
  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${fetchAmount}&category=${category}&difficulty=${difficulty}&type=multiple`
    );
    const data = await response.json().catch(() => ({}));
    remoteQuestions = Array.isArray(data.results) ? data.results : [];
  } catch (error) {
    console.warn("OpenTDB fetch failed, using fallback questions only.", error?.message || error);
    remoteQuestions = [];
  }

  const keywords = CS_SUBJECT_KEYWORDS[subject] || [];
  let filtered = remoteQuestions;
  if (keywords.length > 0) {
    filtered = remoteQuestions.filter((item) => {
      const text = `${item.question} ${item.correct_answer} ${item.incorrect_answers.join(" ")}`.toLowerCase();
      return keywords.some((word) => text.includes(word));
    });
  }

  const normalizedRemote = filtered.slice(0, nAmount).map((item, index) => {
    const options = shuffleArray([
      decodeHTML(item.correct_answer),
      ...item.incorrect_answers.map((ans) => decodeHTML(ans)),
    ]);
    return {
      id: index + 1,
      question: decodeHTML(item.question),
      options,
      correctAnswer: options.indexOf(decodeHTML(item.correct_answer)),
      category: subject,
    };
  });

  if (normalizedRemote.length >= nAmount) return normalizedRemote;

  const needed = nAmount - normalizedRemote.length;
  const localPool = FALLBACK_QUESTIONS[subject] || FALLBACK_QUESTIONS["Operating System"];
  const fallbackQuestions = Array.from({ length: needed }).map((_, idx) => {
    const item = localPool[idx % localPool.length];
    return {
      id: normalizedRemote.length + idx + 1,
      question: item.question,
      options: item.options,
      correctAnswer: item.correctAnswer,
      category: subject,
    };
  });

  return [...normalizedRemote, ...fallbackQuestions];
};
