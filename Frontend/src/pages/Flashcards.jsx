import { useState } from "react";
import Header from "@/components/Header";
import AnimatedBackground from "@/components/AnimatedBackground";
import { BookOpen, ArrowLeft, ArrowRight, RefreshCw, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FLASHCARD_DECKS = {
  "Operating System": [
    { front: "What is a Kernel?", back: "The core component of an OS that manages system resources (CPU, memory, devices) and acts as a bridge between hardware and software." },
    { front: "What is a deadlock?", back: "A situation where two or more processes are unable to proceed because each is waiting for a resource held by another." },
    { front: "Difference between Process and Thread?", back: "A process is an independent program execution with its own memory space. A thread is a subset of a process that shares the process's memory space, making context switches faster." },
    { front: "What is Virtual Memory?", back: "A memory management capability of an OS that uses hardware and software to allow a computer to compensate for physical memory shortages by temporarily transferring data from RAM to disk storage." },
    { front: "What is thrashing?", back: "A state in virtual memory systems where the CPU spends more time swapping pages in and out of disk than executing instructions, caused by insufficient RAM." }
  ],
  "Linux": [
    { front: "What is the inode in Linux?", back: "An index node that stores metadata about a file (permissions, owner, size, block locations) but not the file's name or actual data content." },
    { front: "Difference between hard link and soft link?", back: "A hard link points to the exact same inode of the file (deleting the original file doesn't delete the data). A soft link (symlink) is a shortcut that points to the file path (deleting the original makes the soft link break)." },
    { front: "What does the command 'chmod 755' do?", back: "Sets file permissions so the Owner can Read, Write, and Execute (7), Group can Read and Execute (5), and Others can Read and Execute (5)." },
    { front: "What is a zombie process in Linux?", back: "A process that has completed execution but still has an entry in the process table because its parent has not yet read its exit status." }
  ],
  "Computer Networks": [
    { front: "Difference between TCP and UDP?", back: "TCP is connection-oriented, reliable, orders packets, and performs flow control. UDP is connectionless, faster, has less overhead, but does not guarantee packet delivery." },
    { front: "What is the purpose of DNS?", back: "Domain Name System translates human-readable domain names (like google.com) into machine-readable IP addresses (like 142.250.190.46)." },
    { front: "Difference between Hub, Switch, and Router?", back: "Hub broadcasts incoming data to all ports. Switch forwards data to the specific destination port (MAC-based). Router forwards data packets between different networks (IP-based)." },
    { front: "What is a Three-Way Handshake in TCP?", back: "The protocol connection setup process: 1. Client sends SYN. 2. Server replies SYN-ACK. 3. Client confirms with ACK." }
  ],
  "Data Base Management System": [
    { front: "What are ACID properties?", back: "Atomicity (all or nothing), Consistency (preserves validity), Isolation (transactions don't interfere), and Durability (saved permanently)." },
    { front: "Difference between primary key, unique key, and foreign key?", back: "Primary Key uniquely identifies a record (no nulls). Unique Key uniquely identifies records (allows one null). Foreign Key references the primary key of another table to link them." },
    { front: "What is Normalization?", back: "The process of organizing data in a database to reduce data redundancy and improve data integrity (1NF, 2NF, 3NF, BCNF)." },
    { front: "Difference between JOIN kinds (Inner, Left, Right)?", back: "Inner returns matching rows. Left returns all rows from left table + matching right. Right returns all rows from right table + matching left." }
  ],
  "Data Structures and Algorithms": [
    { front: "Difference between Stack and Queue?", back: "Stack uses LIFO (Last In First Out), e.g., undo operations. Queue uses FIFO (First In First Out), e.g., print queues." },
    { front: "What is the time complexity of Quick Sort?", back: "Best and Average: O(n log n). Worst case (when array is already sorted and pivot choice is poor): O(n^2)." },
    { front: "Difference between BFS and DFS?", back: "BFS (Breadth-First Search) uses a Queue to explore layer by layer (closest first). DFS (Depth-First Search) uses a Stack/Recursion to go as deep as possible first." },
    { front: "What is a Hash Collision?", back: "Occurs when two different keys hash to the same index. Handled via Chaining (linked lists) or Open Addressing (probing)." }
  ],
  "C and Pointers": [
    { front: "What is a Pointer in C?", back: "A variable that stores the memory address of another variable." },
    { front: "Difference between malloc() and calloc()?", back: "malloc() allocates raw memory block (uninitialized garbage values). calloc() allocates multiple blocks and initializes all bytes to zero." },
    { front: "What is a Dangling Pointer?", back: "A pointer that points to a memory location that has been deallocated or freed, leading to crashes or security issues if accessed." },
    { front: "What is the dereference operator?", back: "The asterisk (*) symbol, used to access or modify the value stored at the address held by the pointer." }
  ]
};

const Flashcards = () => {
  const navigate = useNavigate();
  const subjects = Object.keys(FLASHCARD_DECKS);
  
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const deck = FLASHCARD_DECKS[selectedSubject];
  const currentCard = deck[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % deck.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
    }, 150);
  };

  const handleSubjectChange = (subject) => {
    setIsFlipped(false);
    setSelectedSubject(subject);
    setCurrentIndex(0);
  };

  return (
    <div className="page">
      <AnimatedBackground variant="mesh" />
      <Header />

      <main className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem", maxWidth: "42rem" }}>
        <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button onClick={() => navigate("/dashboard")} className="btn btn-outline btn-icon" style={{ borderRadius: "50%" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Study Flashcards 🗂️</h1>
            <p style={{ color: "var(--muted-foreground)" }}>Quickly review key Computer Science concepts before you quiz!</p>
          </div>
        </div>

        {/* Subject Selectors */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          overflowX: "auto", 
          paddingBottom: "1rem",
          marginBottom: "1.5rem"
        }}>
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => handleSubjectChange(sub)}
              className="btn btn-sm"
              style={{
                background: selectedSubject === sub ? "var(--primary)" : "var(--secondary)",
                color: selectedSubject === sub ? "var(--primary-foreground)" : "var(--foreground)",
                border: "1px solid var(--border)",
                whiteSpace: "nowrap"
              }}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* The Flip Card */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            perspective: "1000px",
            cursor: "pointer",
            width: "100%",
            height: "300px",
            marginBottom: "1.5rem"
          }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}>
            {/* Card Front */}
            <div className="card glow-border" style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              background: "hsla(230, 25%, 8%, 0.9)",
              textAlign: "center"
            }}>
              <BookOpen size={36} style={{ color: "var(--primary)", marginBottom: "1rem" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{currentCard.front}</h2>
              <p style={{ position: "absolute", bottom: "1rem", color: "var(--muted-foreground)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <RefreshCw size={12} /> Click card to flip
              </p>
            </div>

            {/* Card Back */}
            <div className="card glow-border" style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              background: "rgba(var(--primary-rgb), 0.05)",
              textAlign: "center",
              border: "2px solid var(--primary)"
            }}>
              <Zap size={36} style={{ color: "var(--warning)", marginBottom: "1rem" }} />
              <p style={{ fontSize: "1.15rem", lineHeight: "1.6", fontWeight: 500 }}>{currentCard.back}</p>
              <p style={{ position: "absolute", bottom: "1rem", color: "var(--muted-foreground)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <RefreshCw size={12} /> Click card to flip back
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn btn-outline" onClick={handlePrev} style={{ width: "30%" }}>
            <ArrowLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}>
            Card {currentIndex + 1} of {deck.length}
          </span>
          <button className="btn btn-outline" onClick={handleNext} style={{ width: "30%" }}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Flashcards;
