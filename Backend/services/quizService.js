import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

const SCIENCE_SUBJECT_KEYWORDS = {
  Physics: ["force", "motion", "energy", "velocity", "newton", "gravity", "light", "electric", "magnet", "wave"],
  Chemistry: ["chemical", "element", "acid", "base", "molecule", "compound", "reaction", "periodic", "ion", "ph"],
  Biology: ["cell", "dna", "gene", "organism", "plant", "animal", "human", "photosynthesis", "evolution", "blood"],
};

const FALLBACK_QUESTIONS = {
  Physics: [
    {
      question: "SI unit of force is?",
      options: ["Newton", "Joule", "Pascal", "Watt"],
      correctAnswer: 0,
    },
    {
      question: "Speed of light in vacuum is closest to?",
      options: ["3 x 10^8 m/s", "3 x 10^6 m/s", "3 x 10^5 km/s", "3 x 10^9 m/s"],
      correctAnswer: 0,
    },
  ],
  Chemistry: [
    {
      question: "pH of neutral water at room temperature is?",
      options: ["7", "1", "14", "0"],
      correctAnswer: 0,
    },
    {
      question: "Atomic number of Oxygen is?",
      options: ["8", "16", "6", "12"],
      correctAnswer: 0,
    },
  ],
  Biology: [
    {
      question: "Basic unit of life is?",
      options: ["Cell", "Tissue", "Organ", "System"],
      correctAnswer: 0,
    },
    {
      question: "Photosynthesis mainly occurs in?",
      options: ["Leaves", "Roots", "Stem", "Flowers"],
      correctAnswer: 0,
    },
  ],
  Maths: [
    {
      question: "Value of pi is approximately?",
      options: ["3.14", "2.14", "4.13", "1.34"],
      correctAnswer: 0,
    },
    {
      question: "If x + 5 = 12, x = ?",
      options: ["7", "5", "12", "17"],
      correctAnswer: 0,
    },
  ],
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

  // Fallback to OpenTDB
  console.log(`Falling back to OpenTDB for ${subject} questions...`);
  const category = subject === "Maths" ? 19 : 17;
  const difficulty = classLevel === "12" ? "medium" : "easy";
  const fetchAmount = subject === "Maths" ? nAmount : Math.min(nAmount * 4, 50);

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

  let filtered = remoteQuestions;
  if (subject !== "Maths") {
    const keywords = SCIENCE_SUBJECT_KEYWORDS[subject] || [];
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
  const localPool = FALLBACK_QUESTIONS[subject] || FALLBACK_QUESTIONS.Physics;
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
