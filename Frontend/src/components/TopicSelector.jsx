import React from 'react';

const TOPICS = {
  "Operating System": ["Kernel & Shell", "Process & Thread", "Memory Management", "Scheduling Algorithms", "Deadlocks & Semaphores", "File Systems"],
  "Linux": ["Basic Commands", "File Permissions", "Shell Scripting", "System Directories", "Processes & Services", "Package Management"],
  "Computer Networks": ["OSI & TCP/IP Models", "IP Addressing & Subnetting", "Routing & Switching Protocols", "TCP/UDP Handshakes", "DNS & HTTP/HTTPS", "Network Security & Firewalls"],
  "Data Base Management System": ["SQL Queries & Joins", "ACID Properties", "Normalization (1NF-BCNF)", "NoSQL Databases", "Indexing & Transactions", "ER Diagrams"],
  "Data Structures and Algorithms": ["Arrays & Linked Lists", "Stacks & Queues", "Trees & BSTs", "Sorting & Searching", "Graph Algorithms", "Time & Space Complexity"],
  "C and Pointers": ["Pointer Basics & Syntax", "Memory Allocation (malloc/free)", "Dangling & Void Pointers", "Structs & Unions", "File I/O", "Preprocessors & Macros"]
};

const TopicSelector = ({ subject, selectedTopics, onToggleTopic }) => {
  if (!subject || !TOPICS[subject]) return null;

  const topics = TOPICS[subject];

  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ marginBottom: "0.75rem", fontWeight: 600, color: "var(--foreground)" }}>
        Select Topics (Optional)
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {topics.map((topic) => {
          const isSelected = selectedTopics.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              className={`btn btn-sm ${isSelected ? "btn-gradient" : "btn-outline"}`}
              onClick={() => onToggleTopic(topic)}
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TopicSelector;
