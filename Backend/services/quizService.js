import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    { question: "Which of the following is not an operating system?", options: ["Windows", "Linux", "Oracle", "macOS"], correctAnswer: 2 },
    { question: "What is a deadlock in OS?", options: ["A state where processes wait indefinitely for resources held by each other", "A process that consumes 100% CPU", "A memory leak", "An unhandled exception"], correctAnswer: 0 },
    { question: "What is virtual memory?", options: ["Hardware extension of RAM using disk space", "Cache memory", "CPU registers", "ROM storage"], correctAnswer: 0 },
    { question: "Which CPU scheduling algorithm can potentially lead to starvation?", options: ["Shortest Job First (SJF)", "Round Robin (RR)", "First-Come First-Served (FCFS)", "None of these"], correctAnswer: 0 },
    { question: "What is paging in memory management?", options: ["A scheme that eliminates external fragmentation", "A file transfer protocol", "Disk defragmentation", "CPU context switching method"], correctAnswer: 0 },
    { question: "What is a thread?", options: ["A lightweight unit of execution within a process", "A physical cable", "A network protocol", "A database record"], correctAnswer: 0 },
    { question: "What is context switching?", options: ["Saving and restoring the CPU state of a process", "Moving from C++ to Java code", "Changing database engines", "Restarting the OS kernel"], correctAnswer: 0 },
    { question: "What is a semaphore?", options: ["An integer variable used for process synchronization", "A class descriptor", "A networking router", "A hardware bus"], correctAnswer: 0 },
    { question: "What is thrashing in OS?", options: ["A state of excessive paging where the system spends more time paging than executing", "CPU core shutdown", "A security breach", "Disk formatting process"], correctAnswer: 0 }
  ],
  "Linux": [
    { question: "Which command is used to list files in Linux?", options: ["ls", "dir", "list", "show"], correctAnswer: 0 },
    { question: "Who created Linux?", options: ["Linus Torvalds", "Bill Gates", "Steve Jobs", "Ken Thompson"], correctAnswer: 0 },
    { question: "Which permission notation corresponds to chmod 755?", options: ["rwxr-xr-x", "rw-rw-rw-", "rwxrwxrwx", "r--r--r--"], correctAnswer: 0 },
    { question: "What does 'tar -xf archive.tar' do?", options: ["Extracts the files from archive.tar", "Creates archive.tar", "Deletes archive.tar", "Lists contents of archive.tar"], correctAnswer: 0 },
    { question: "Which command displays active running processes in real-time?", options: ["top", "ps -ef", "process-list", "show-proc"], correctAnswer: 0 },
    { question: "What is the root directory in a Linux filesystem?", options: ["/", "/root", "/home", "/bin"], correctAnswer: 0 },
    { question: "Which command is used to change the owner of a file?", options: ["chown", "chmod", "chgrp", "passwd"], correctAnswer: 0 },
    { question: "What is the primary function of the 'grep' command?", options: ["Search for text patterns using regex", "Format a text document", "Copy files securely", "Mount external drives"], correctAnswer: 0 },
    { question: "Where are user account passwords securely hashed and stored?", options: ["/etc/shadow", "/etc/passwd", "/var/log/secure", "/usr/bin/pass"], correctAnswer: 0 },
    { question: "What does the command prefix 'sudo' stand for?", options: ["Superuser do", "System utility do", "Secure user drive option", "Substitute operator"], correctAnswer: 0 }
  ],
  "Computer Networks": [
    { question: "What does IP stand for?", options: ["Internet Protocol", "Internal Protocol", "Internet Provider", "Internal Provider"], correctAnswer: 0 },
    { question: "Which layer is not in the OSI model?", options: ["Application", "Transport", "Internet", "Physical"], correctAnswer: 2 },
    { question: "What is the default port number for HTTP?", options: ["80", "443", "21", "22"], correctAnswer: 0 },
    { question: "What is the default port number for HTTPS?", options: ["443", "80", "8080", "445"], correctAnswer: 0 },
    { question: "Which transport layer protocol is connectionless and unreliable?", options: ["UDP", "TCP", "SCTP", "HTTP"], correctAnswer: 0 },
    { question: "What is the main role of the DNS protocol?", options: ["Resolving domain hostnames to IP addresses", "Securing data streams", "Assigning DHCP addresses", "Routing packets"], correctAnswer: 0 },
    { question: "What is the default subnet mask for a Class C IPv4 address?", options: ["255.255.255.0", "255.255.0.0", "255.0.0.0", "255.255.255.255"], correctAnswer: 0 },
    { question: "What is a MAC address?", options: ["A unique physical hardware address assigned to a NIC", "A virtual network identity", "A router name", "An IP routing protocol"], correctAnswer: 0 },
    { question: "Which OSI layer is responsible for packet routing?", options: ["Network Layer", "Transport Layer", "Data Link Layer", "Physical Layer"], correctAnswer: 0 },
    { question: "What does DHCP stand for?", options: ["Dynamic Host Configuration Protocol", "Domain Host Control Protocol", "Distributed Hub Connection Protocol", "Data Hashing Connection Protocol"], correctAnswer: 0 }
  ],
  "Data Base Management System": [
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Strong Question Language", "Structured Question Language", "Strong Query Language"], correctAnswer: 0 },
    { question: "Which of the following is a NoSQL database?", options: ["MongoDB", "MySQL", "PostgreSQL", "Oracle"], correctAnswer: 0 },
    { question: "What does the ACID model stand for in database design?", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Control, Integrity, Distribution", "Atomicity, Concurrency, Indexing, Deletion", "Access, Control, Information, Database"], correctAnswer: 0 },
    { question: "What is a primary key?", options: ["A column that uniquely identifies rows and cannot be null", "A column containing duplicate references", "A database index", "A password code"], correctAnswer: 0 },
    { question: "What is a foreign key?", options: ["A column that references the primary key of another table", "A key generated by external tools", "A partition code", "An encrypted key"], correctAnswer: 0 },
    { question: "Which normal form resolves transitive functional dependencies?", options: ["3NF", "1NF", "2NF", "BCNF"], correctAnswer: 0 },
    { question: "What does a LEFT JOIN query do?", options: ["Returns all records from the left table and matching from the right", "Returns only matching records", "Returns all records from both tables", "Sorts table records leftward"], correctAnswer: 0 },
    { question: "Why is database indexing used?", options: ["To speed up data lookup and query retrieval performance", "To encrypt database data", "To enforce strict normalization", "To backup records"], correctAnswer: 0 },
    { question: "Which SQL clause is used to filter aggregated data groups?", options: ["HAVING", "WHERE", "ORDER BY", "GROUP BY"], correctAnswer: 0 },
    { question: "What is a transaction in DBMS?", options: ["A logical unit of work that must either succeed fully or fail fully", "A financial record transfer", "A SQL query execution", "A backup protocol"], correctAnswer: 0 }
  ],
  "Data Structures and Algorithms": [
    { question: "Which data structure uses LIFO?", options: ["Stack", "Queue", "Array", "Linked List"], correctAnswer: 0 },
    { question: "What is the time complexity of binary search?", options: ["O(log n)", "O(n)", "O(n^2)", "O(1)"], correctAnswer: 0 },
    { question: "What is the worst-case time complexity of Bubble Sort?", options: ["O(n^2)", "O(n log n)", "O(n)", "O(1)"], correctAnswer: 0 },
    { question: "Which data structure is typically used to implement Breadth-First Search (BFS)?", options: ["Queue", "Stack", "Binary Search Tree", "Heap"], correctAnswer: 0 },
    { question: "Which data structure is typically used to implement Depth-First Search (DFS)?", options: ["Stack", "Queue", "Hash Table", "Doubly Linked List"], correctAnswer: 0 },
    { question: "What is a hash collision?", options: ["When two different keys generate the same hash value index", "When a hash table runs out of RAM", "When database transactions crash", "When pointers overlap"], correctAnswer: 0 },
    { question: "What is a Binary Search Tree (BST)?", options: ["A tree where left child < parent < right child", "A balanced sorting tree", "A tree with at most 3 children", "A sequential search array"], correctAnswer: 0 },
    { question: "What is the best-case time complexity of Quicksort?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], correctAnswer: 0 },
    { question: "Which algorithm is used to find the shortest path in a weighted graph?", options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Binary Search", "DFS"], correctAnswer: 0 },
    { question: "Which data structure offers O(1) average time complexity for lookups?", options: ["Hash Table", "Binary Search Tree", "Linked List", "Stack"], correctAnswer: 0 }
  ],
  "C and Pointers": [
    { question: "Which operator is used to get the address of a variable in C?", options: ["&", "*", "->", "."], correctAnswer: 0 },
    { question: "What does a pointer hold?", options: ["Memory address", "Value", "Function", "Array"], correctAnswer: 0 },
    { question: "What is the size of a pointer variable on a 64-bit architecture?", options: ["8 bytes", "4 bytes", "16 bytes", "2 bytes"], correctAnswer: 0 },
    { question: "Which dynamic memory allocation function in C does not initialize allocated memory?", options: ["malloc", "calloc", "realloc", "free"], correctAnswer: 0 },
    { question: "What is a dangling pointer in C?", options: ["A pointer pointing to a memory location that has been freed", "A pointer initialized to NULL", "An uninitialized pointer", "A pointer pointing to a local static variable"], correctAnswer: 0 },
    { question: "How do you access a structure member using a pointer to the structure?", options: ["->", ".", "*", "&"], correctAnswer: 0 },
    { question: "Which function is used to deallocate dynamically allocated memory in C?", options: ["free", "delete", "dealloc", "release"], correctAnswer: 0 },
    { question: "What is a memory leak?", options: ["Memory allocated dynamically that is never released back to the OS", "RAM physical failure", "Unauthorized memory access", "Overflow of the stack pointer"], correctAnswer: 0 },
    { question: "What does dereferencing a pointer using the '*' operator do?", options: ["Accesses the value stored at the memory address pointed to", "Finds the memory location of the pointer itself", "Deletes the pointer variable", "Multiplies pointer memory"], correctAnswer: 0 },
    { question: "Which standard header file must be included to use malloc()?", options: ["<stdlib.h>", "<stdio.h>", "<string.h>", "<conio.h>"], correctAnswer: 0 }
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

const generateQuestionsWithGemini = async (subject, classLevel, amount, topics = [], difficulty = "Intermediate") => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here" || apiKey === "YOUR_API_KEY") {
      console.warn("GEMINI_API_KEY not properly set, skipping Gemini generation.");
      return null;
    }

    console.log(`Generating questions for ${subject} ${topics.length > 0 ? `(Topics: ${topics.join(', ')})` : ''} with difficulty ${difficulty} using Gemini...`);

    const topicConstraint = topics.length > 0 
      ? `specifically focusing on these topics: ${topics.join(', ')}` 
      : `covering general syllabus for ${subject}`;

    let difficultyConstraint = "";
    if (difficulty === "Beginner") {
      difficultyConstraint = "The questions must focus strictly on basic terminology, simple definitions, and fundamental syntax. Options should be very distinct, and avoid complex logical puzzles or multi-step calculations.";
    } else if (difficulty === "Advanced") {
      difficultyConstraint = "The questions must test highly advanced concepts, pointer arithmetic edge-cases, multi-threaded CPU states, concurrency conditions, deep database normalization/indexing tradeoffs, complex data structure dry-runs, or optimization tradeoffs. They should require deep technical reasoning.";
    } else {
      difficultyConstraint = "The questions must test intermediate concepts, standard code dry-runs, typical logical flow, and basic application design principles.";
    }

    const prompt = `Generate ${amount} multiple choice questions for the Computer Science subject: "${subject}" ${topicConstraint}. 
    IMPORTANT: The questions MUST be strictly about Computer Science / Information Technology related to "${subject}". DO NOT include any Physics, Chemistry, Biology, or general Science questions.
    Assume the difficulty matches this criteria: ${difficultyConstraint}
    Return the response ONLY as a JSON array of objects. 
    Each object must have the following structure:
    {
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0, // index of the correct option in the options array
      "hint": "A short, helpful hint that doesn't reveal the answer",
      "explanation": "A clear, concise explanation of why the correct answer is correct"
    }
    Ensure questions are accurate, challenging but fair, and options are distinct. Do not include any markdown formatting like \`\`\`json or \`\`\`.`;

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
      category: subject,
      hint: q.hint || "No hint available",
      explanation: q.explanation || "No explanation available"
    }));
  } catch (error) {
    console.error("Gemini question generation failed:", error.message);
    return null;
  }
};

export const generateQuestions = async (subject = "Operating System", classLevel = "10", amount = 5, topics = [], difficulty = "Intermediate") => {
  const nAmount = Number(amount) || 5;

  // Try Gemini First
  const geminiQuestions = await generateQuestionsWithGemini(subject, classLevel, nAmount, topics, difficulty);
  if (geminiQuestions && geminiQuestions.length >= nAmount) {
    console.log(`Successfully generated ${geminiQuestions.length} questions using Gemini for ${subject}`);
    return geminiQuestions;
  }

  // Fallback to OpenTDB (Category 18 is Science: Computers)
  console.log(`Falling back to OpenTDB for ${subject} questions...`);
  const category = 18; 
  const opentdbDifficulty = "medium";
  const fetchAmount = Math.min(nAmount * 4, 50);

  let remoteQuestions = [];
  try {
    const response = await fetch(
      `https://opentdb.com/api.php?amount=${fetchAmount}&category=${category}&difficulty=${opentdbDifficulty}&type=multiple`
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
