import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ProgressBar from "@/components/ProgressBar";
import QuizOption from "@/components/QuizOption";
import AnimatedBackground from "@/components/AnimatedBackground";
import SubjectSelector from "@/components/SubjectSelector";
import { ArrowRight, Clock, BookOpen, Zap, Calendar, Swords, Trophy, XCircle, Loader2, Lightbulb, Scissors, Share2, Award } from "lucide-react";
import { cn, getApiBase } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import TopicSelector from "@/components/TopicSelector";
import Confetti from "../components/Confetti";
import { soundManager } from "@/lib/soundManager";

const quizModes = {
  normal: { title: "Normal Quiz", icon: BookOpen, iconBg: "hsla(250, 90%, 65%, 0.1)", iconColor: "var(--primary)", timePerQuestion: 30 },
  daily: { title: "Daily Challenge", icon: Calendar, iconBg: "hsla(280, 85%, 65%, 0.1)", iconColor: "var(--game-daily)", timePerQuestion: 20 },
  speed: { title: "Speed Quiz", icon: Zap, iconBg: "hsla(160, 80%, 45%, 0.1)", iconColor: "var(--game-speed)", timePerQuestion: 10 },
  battle: { title: "Battle Mode", icon: Swords, iconBg: "hsla(340, 85%, 60%, 0.1)", iconColor: "var(--game-battle)", timePerQuestion: 20 },
  mistakes: { title: "Review Mistakes", icon: BookOpen, iconBg: "hsla(0, 80%, 50%, 0.1)", iconColor: "var(--destructive)", timePerQuestion: 30 },
};

const SUBJECTS = ["Operating System", "Linux", "Computer Networks", "Data Base Management System", "Data Structures and Algorithms", "C and Pointers"];

const fetchQuestionsFromAPI = async ({ subject, classLevel, questionCount, topics = [] }) => {
  const token = localStorage.getItem("token");
  const apiBase = getApiBase();
  const topicsQuery = topics.length > 0 ? `&topics=${encodeURIComponent(topics.join(','))}` : '';
  const response = await fetch(
    `${apiBase}/api/auth/quiz-questions?subject=${encodeURIComponent(subject)}&classLevel=${encodeURIComponent(classLevel)}&amount=${questionCount}${topicsQuery}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load questions");
  }
  return data.questions || [];
};

const fetchMistakesQuestions = async () => {
  const token = localStorage.getItem("token");
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}/api/auth/quiz-mistakes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to load mistakes");
  }
  return data.questions || [];
};

const Quiz = () => {
  const { mode = "normal" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const savedResultRef = useRef(false);

  // Multiplayer State
  const isMultiplayer = location.state?.isMultiplayer || mode === "battle";
  const matchData = location.state?.matchData || null;
  const [battleResult, setBattleResult] = useState(null);
  const [opponentProgress, setOpponentProgress] = useState({ score: 0, questionIndex: 0 });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [classLevel, setClassLevel] = useState("10");
  const [questionCount, setQuestionCount] = useState(10);

  // Lifelines and Streaks
  const [used5050, setUsed5050] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  const quizConfig = quizModes[mode] || quizModes.normal;
  const question = questions[currentQuestion];
  const totalQuestions = questions.length;

  // Initialize Multiplayer
  useEffect(() => {
    if (isMultiplayer && matchData) {
      setQuestions(matchData.questions || []);
      setSelectedSubject(matchData.subject || "Operating System");
      setTimeLeft(matchData.timePerQuestion || 20);
      setHasStarted(true);
    } else if (mode === "battle" && !matchData) {
      navigate("/matchmaking");
    }
  }, [isMultiplayer, matchData, mode, navigate]);

  // Socket listeners for Multiplayer
  const [botFinished, setBotFinished] = useState(false);

  useEffect(() => {
    if (!isMultiplayer || !socket || matchData?.isBot) return;

    const handleOpponentProgress = (data) => setOpponentProgress(data);
    const handleMatchResult = (data) => {
      setBattleResult(data);
      setIsFinished(true);
    };
    const handleOpponentDisconnected = () => {
      setLoadError("Opponent disconnected. Match cancelled.");
      setIsFinished(true);
    };

    socket.on("match:opponent_progress", handleOpponentProgress);
    socket.on("match:result", handleMatchResult);
    socket.on("match:opponent_disconnected", handleOpponentDisconnected);

    return () => {
      socket.off("match:opponent_progress", handleOpponentProgress);
      socket.off("match:result", handleMatchResult);
      socket.off("match:opponent_disconnected", handleOpponentDisconnected);
    };
  }, [isMultiplayer, socket, matchData]);

  // Bot simulation progress
  useEffect(() => {
    if (!isMultiplayer || !matchData?.isBot || isFinished) return;

    let botInterval;
    
    const startBot = () => {
      botInterval = setInterval(() => {
        setOpponentProgress((prev) => {
          const nextIndex = prev.questionIndex + 1;
          const gotCorrect = Math.random() > 0.4;
          const pointGain = gotCorrect ? Math.round(15 + Math.random() * 5) : 0;
          
          if (nextIndex >= totalQuestions) {
            clearInterval(botInterval);
            setBotFinished(true);
            return {
              score: prev.score + pointGain,
              questionIndex: totalQuestions
            };
          }
          
          return {
            score: prev.score + pointGain,
            questionIndex: nextIndex
          };
        });
      }, 7000 + Math.random() * 3000);
    };

    startBot();

    return () => {
      if (botInterval) clearInterval(botInterval);
    };
  }, [isMultiplayer, matchData, isFinished, totalQuestions]);

  // Check battle end for Bot Match
  useEffect(() => {
    if (!isMultiplayer || !matchData?.isBot || !isFinished || battleResult) return;
    
    if (botFinished) {
      const playerWon = score > opponentProgress.score;
      setBattleResult({
        winnerId: playerWon ? "player" : score === opponentProgress.score ? null : "bot",
        players: {
          "player": { name: user?.name || "You", score: score },
          "bot": { name: matchData.opponent.name, score: opponentProgress.score }
        }
      });
    }
  }, [isMultiplayer, matchData, isFinished, botFinished, score, opponentProgress.score, user, battleResult]);

  useEffect(() => {
    if (!isFinished || savedResultRef.current || (isMultiplayer && !matchData?.isBot)) return;

    const saveResult = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const correctAnswers = answers.filter((a) => a.correct).length;

      try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/auth/quiz-result`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score,
            correctAnswers,
            totalQuestions,
            mode,
            subject: selectedSubject || "Mistakes Review",
            topics: selectedTopics,
            classLevel,
            questions: questions.map((q, idx) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              userAnswer: answers[idx]?.selectedIdx,
              isCorrect: answers[idx]?.correct,
              hint: q.hint,
              explanation: q.explanation
            })),
            clientLocalDate: new Date().toLocaleDateString("en-CA"),
          }),
        });
        
        const resData = await response.json();
        if (response.ok && resData.earnedBadges && resData.earnedBadges.length > 0) {
          setEarnedBadges(resData.earnedBadges);
        }
      } catch (error) {
        console.error("Error saving quiz result:", error);
      }
    };

    savedResultRef.current = true;
    saveResult();
  }, [isFinished, answers, score, totalQuestions, mode, selectedSubject, classLevel, isMultiplayer, questions, selectedTopics]);

  useEffect(() => {
    if (isFinished || isRevealed || !hasStarted || !question) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return quizConfig.timePerQuestion;
        }
        if (prev <= 6) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestion, isRevealed, isFinished, hasStarted, question, quizConfig.timePerQuestion]);

  useEffect(() => {
    if (isFinished) {
      soundManager.playSuccess();
    }
  }, [isFinished]);

  const startQuiz = async () => {
    if (mode !== "mistakes" && !selectedSubject) {
      setLoadError("Please choose a subject");
      return;
    }

    setLoadError("");
    setIsLoading(true);
    setHasStarted(false);
    savedResultRef.current = false;
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setScore(0);
    setAnswers([]);
    setUsed5050(false);
    setUsedHint(false);
    setCurrentStreak(0);

    try {
      let fetchedQuestions = [];
      if (mode === "mistakes") {
        fetchedQuestions = await fetchMistakesQuestions();
      } else {
        fetchedQuestions = await fetchQuestionsFromAPI({
          subject: selectedSubject,
          classLevel,
          questionCount,
          topics: selectedTopics,
        });
      }
      
      if (!fetchedQuestions.length) {
        setLoadError(mode === "mistakes" ? "No recorded mistakes found yet! Play a Normal or Speed Quiz first to practice questions and build your review list." : "No questions found for the selected options.");
        return;
      }
      setQuestions(fetchedQuestions);
      setTimeLeft(quizConfig.timePerQuestion);
      setHasStarted(true);
    } catch (error) {
      setLoadError(error.message || "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handle5050 = () => {
    if (used5050 || isRevealed || !question) return;
    const wrongIndices = [];
    question.options.forEach((_, idx) => {
      if (idx !== question.correctAnswer) wrongIndices.push(idx);
    });
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    setHiddenOptions(shuffled.slice(0, 2));
    setUsed5050(true);
  };

  const handleHint = () => {
    if (usedHint || isRevealed || !question) return;
    setShowHint(true);
    setUsedHint(true);
  };

  const handleSubmit = () => {
    if (isRevealed || !question) return;
    const isCorrect = selectedAnswer === question.correctAnswer;
    const timeTaken = (quizConfig.timePerQuestion || 20) - timeLeft;

    let points = 0;
    if (isCorrect) {
      soundManager.playCorrect();
      let basePoints = 14;
      if (mode === "daily") basePoints = 12;
      else if (mode === "speed") basePoints = 10;
      else if (mode === "battle") basePoints = 20;

      // Apply streak multiplier
      const multiplier = 1 + (currentStreak * 0.1);
      points = Math.round(basePoints * multiplier);
      
      setScore((prev) => prev + points);
      setCurrentStreak(prev => prev + 1);
      
      if (currentStreak >= 2) {
        setShowStreakPopup(true);
        setTimeout(() => setShowStreakPopup(false), 2000);
      }
    } else {
      soundManager.playIncorrect();
      setCurrentStreak(0);
    }

    setAnswers((prev) => [...prev, { correct: isCorrect, time: timeTaken, selectedIdx: selectedAnswer }]);
    setIsRevealed(true);

    if (isMultiplayer && socket && matchData?.roomId && !matchData?.isBot) {
      socket.emit("quiz:submit_answer", {
        roomId: matchData.roomId,
        score: score + points,
        timeTaken
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 >= totalQuestions) {
      if (isMultiplayer && socket && matchData?.roomId && !matchData?.isBot) {
        socket.emit("quiz:finish", {
          roomId: matchData.roomId,
          score,
          timeTaken: 0
        });
        setIsFinished(true);
      } else {
        setIsFinished(true);
      }
      return;
    }
    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setTimeLeft(quizConfig.timePerQuestion);
    setHiddenOptions([]);
    setShowHint(false);
  };

  const resetToSetup = () => {
    if (isMultiplayer) {
      navigate("/dashboard");
      return;
    }
    savedResultRef.current = false;
    setHasStarted(false);
    setIsFinished(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsRevealed(false);
    setScore(0);
    setAnswers([]);
    setLoadError("");
    setUsed5050(false);
    setUsedHint(false);
    setCurrentStreak(0);
  };

  const handleShare = async () => {
    const text = `I just scored ${score} on Quiz Arena! \
Accuracy: ${Math.round((answers.filter(a => a.correct).length / totalQuestions) * 100)}%\
Can you beat my score? https://quiz-arena-lake.vercel.app/`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Quiz Arena Score",
          text: text,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  if (isFinished) {
    if (isMultiplayer && battleResult && matchData) {
      const isWinner = battleResult.winnerId === (socket?.id || "player");
      const isDraw = battleResult.winnerId === null;
      const opponentId = Object.keys(battleResult.players).find(id => id !== (socket?.id || "player"));
      const opponentScore = opponentId ? battleResult.players[opponentId].score : 0;
      
      return (
        <div className="page-center">
          {isWinner && <Confetti />}
          <AnimatedBackground variant="gradient" />
          <div className="quiz-results animate-scale-in">
            <div className={cn("card quiz-results-card glow-border", isWinner ? "winner" : "loser")}>
              <div className="quiz-results-icon gradient-primary">
                {isWinner ? <Trophy /> : isDraw ? "🤝" : <XCircle />}
              </div>
              <h1>{isWinner ? "Victory!" : isDraw ? "It's a Draw!" : "Defeat"}</h1>
              <p className="quiz-results-subtitle">
                {isWinner ? "You outplayed your opponent!" : isDraw ? "Great match! You both played well." : "Better luck next time!"}
              </p>
              
              <div className="battle-comparison">
                <div className="battle-player">
                  <p className="battle-player-name">You</p>
                  <p className="battle-player-score">{score}</p>
                </div>
                <div className="vs-divider">VS</div>
                <div className="battle-player">
                  <p className="battle-player-name">{matchData.opponent?.name || "Opponent"}</p>
                  <p className="battle-player-score">{opponentScore}</p>
                </div>
              </div>

              <div className="quiz-results-actions">
                <button className="btn btn-gradient btn-xl" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isMultiplayer && !battleResult) {
      return (
        <div className="page-center">
          <AnimatedBackground variant="gradient" />
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto 1rem", width: "3rem", height: "3rem" }} />
            <h2>Waiting for opponent to finish...</h2>
            <p style={{ color: "var(--muted-foreground)" }}>The results will be shown once both players are done.</p>
          </div>
        </div>
      );
    }

    const correctAnswers = answers.filter((a) => a.correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const avgTime = answers.length ? Math.round(answers.reduce((sum, a) => sum + a.time, 0) / answers.length) : 0;
    const showConfetti = accuracy >= 70;

    return (
      <div className="page-center">
        {showConfetti && <Confetti />}
        <AnimatedBackground variant="gradient" />
        <div className="quiz-results animate-scale-in">
          <div className="card quiz-results-card glow-border">
            <div className="quiz-results-icon gradient-primary">🎉</div>
            <h1>Quiz Complete!</h1>
            <p className="quiz-results-subtitle">{mode === "mistakes" ? "Mistakes Review" : `Subject: ${selectedSubject}`}</p>
            
            {earnedBadges.length > 0 && (
              <div 
                className="animate-fade-in" 
                style={{ 
                  margin: "1rem 0", 
                  padding: "1rem", 
                  background: "rgba(234, 179, 8, 0.1)", 
                  border: "1px solid rgba(234, 179, 8, 0.3)", 
                  borderRadius: "var(--radius)",
                  textAlign: "center"
                }}
              >
                <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 700, color: "var(--warning)", fontSize: "0.95rem" }}>
                  <Award size={18} /> New Achievement Unlocked!
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {earnedBadges.map((badge, idx) => (
                    <span key={idx} className="badge gradient-primary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", borderRadius: "20px", color: "#fff", fontWeight: "600" }}>
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="quiz-results-stats">
              <div className="quiz-results-stat">
                <p className="quiz-results-stat-value">{score}</p>
                <p className="quiz-results-stat-label">Points</p>
              </div>
              <div className="quiz-results-stat">
                <p className="quiz-results-stat-value">{accuracy}%</p>
                <p className="quiz-results-stat-label">Accuracy</p>
              </div>
              <div className="quiz-results-stat">
                <p className="quiz-results-stat-value">{avgTime}s</p>
                <p className="quiz-results-stat-label">Avg Time</p>
              </div>
            </div>
            <div className="quiz-results-dots">
              {answers.map((answer, index) => (
                <div key={index} className={cn("quiz-result-dot", answer.correct ? "correct" : "wrong")}>
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="quiz-results-actions">
              <button className="btn btn-outline" onClick={() => navigate("/dashboard")}>Back to Home</button>
              <button className="btn btn-outline" onClick={handleShare}><Share2 style={{marginRight: 6}} size={18}/> Share</button>
              <button className="btn btn-gradient" onClick={resetToSetup}>Play Again</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="page-center">
        <AnimatedBackground variant="gradient" />
        <div className="card glow-border animate-fade-in" style={{ width: "min(640px, 92vw)", padding: "1.5rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>{mode === "mistakes" ? "Review Your Mistakes" : "Quiz Setup"}</h2>
          
          {mode !== "mistakes" ? (
            <>
              <SubjectSelector subjects={SUBJECTS} selectedSubject={selectedSubject} onSelect={(s) => { setSelectedSubject(s); setSelectedTopics([]); }} />
              <div style={{ marginTop: "1rem" }}>
                <label className="label" htmlFor="questionCount">Number of Questions</label>
                <input
                  id="questionCount"
                  type="number"
                  min={1}
                  max={50}
                  className="input"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.min(Math.max(Number(e.target.value), 1), 50))}
                />
              </div>
            </>
          ) : (
            <p style={{ color: "var(--muted-foreground)" }}>This mode will quiz you on up to 10 questions that you have answered incorrectly in the past.</p>
          )}

          {loadError && <p style={{ marginTop: "0.75rem", color: "var(--destructive)", fontSize: "0.875rem" }}>{loadError}</p>}
          
          <button className="btn btn-gradient btn-lg" style={{ marginTop: "1rem", width: "100%" }} onClick={startQuiz} disabled={isLoading}>
            {isLoading ? "Loading..." : "Start Quiz"}
          </button>
        </div>
      </div>
    );
  }

  const Icon = quizConfig.icon;
  const progressPercent = (timeLeft / quizConfig.timePerQuestion) * 100;

  if (!question) {
    return (
      <div className="page-center">
        <AnimatedBackground variant="gradient" />
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.125rem", color: "var(--foreground)" }}>Failed to load quiz. Please try again.</p>
          <button className="btn btn-gradient" onClick={resetToSetup} style={{ marginTop: "1rem" }}>Back to Setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AnimatedBackground variant="gradient" />
      
      {/* Time Progress Bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: "rgba(0,0,0,0.1)", zIndex: 50 }}>
        <div style={{ 
          height: "100%", 
          width: `${progressPercent}%`, 
          background: progressPercent > 30 ? "var(--primary)" : "var(--destructive)",
          transition: "width 1s linear, background-color 0.3s ease" 
        }} />
      </div>

      <header className="quiz-header glass" style={{ marginTop: "6px" }}>
        <div className="container quiz-header-inner">
          <div className="quiz-header-left">
            <div className="quiz-mode-icon" style={{ background: quizConfig.iconBg }}>
              <Icon style={{ color: quizConfig.iconColor }} />
            </div>
            <div>
              <p className="quiz-mode-title">{quizConfig.title}</p>
              <p className="quiz-mode-category">{selectedSubject || "Mistakes Review"}</p>
            </div>
          </div>

          {isMultiplayer && matchData && (
            <div className="battle-status">
              <div className="battle-player mini">
                <span className="battle-name">You</span>
                <span className="battle-score">{score}</span>
              </div>
              <div className="battle-vs">VS</div>
              <div className="battle-player mini">
                <span className="battle-name">{matchData.opponent?.name || "Opponent"}</span>
                <span className="battle-score">{opponentProgress.score}</span>
              </div>
            </div>
          )}

          <div className="quiz-header-right">
            <div style={{ textAlign: "right", position: "relative" }}>
              <p className="quiz-score-label">Score</p>
              <p className="quiz-score-value">
                {score}
                {showStreakPopup && <span style={{ position: "absolute", right: -40, top: -10, color: "#ffb703", fontWeight: "bold", fontSize: "0.8rem", animation: "fade-up 1s forwards" }}>x{1 + (currentStreak * 0.1).toFixed(1)}</span>}
              </p>
            </div>
            <div className={cn("quiz-timer", timeLeft <= 10 && "danger")}>
              <Clock />
              <span className="quiz-timer-value">{timeLeft}s</span>
            </div>
          </div>
        </div>
      </header>

      <main className="quiz-main">
        <div className="animate-fade-in" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, marginRight: "1rem" }}>
            <ProgressBar current={currentQuestion + 1} total={totalQuestions} />
          </div>
          {!isMultiplayer && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={handle5050} 
                disabled={used5050 || isRevealed}
                style={{ opacity: used5050 ? 0.5 : 1, padding: "0 0.5rem" }}
              >
                <Scissors size={14} style={{ marginRight: 4 }}/> 50/50
              </button>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={handleHint} 
                disabled={usedHint || isRevealed}
                style={{ opacity: usedHint ? 0.5 : 1, padding: "0 0.5rem" }}
              >
                <Lightbulb size={14} style={{ marginRight: 4 }}/> Hint
              </button>
            </div>
          )}
        </div>

        {showHint && !isRevealed && (
          <div className="animate-fade-in" style={{ background: "hsla(45, 100%, 50%, 0.1)", border: "1px solid hsla(45, 100%, 50%, 0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", color: "var(--foreground)" }}>
            <strong>💡 Hint: </strong> {question.hint || "Think about the core concepts."}
          </div>
        )}

        <h2 className="quiz-question animate-fade-in" style={{ animationDelay: "100ms" }}>
          {question.question}
        </h2>
        <div className="quiz-options">
          {question.options.map((option, index) => {
            if (hiddenOptions.includes(index)) {
              return <div key={index} style={{ opacity: 0.3, pointerEvents: "none" }} className="card"><div style={{padding: "1rem"}}>{option}</div></div>;
            }
            return (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${150 + index * 50}ms` }}>
                <QuizOption
                  option={option}
                  label={["A", "B", "C", "D"][index]}
                  isSelected={selectedAnswer === index}
                  isCorrect={isRevealed ? (index === question.correctAnswer ? true : selectedAnswer === index ? false : null) : null}
                  isRevealed={isRevealed}
                  onClick={() => !isRevealed && setSelectedAnswer(index)}
                  disabled={isRevealed}
                />
              </div>
            );
          })}
        </div>

        {isRevealed && question.explanation && (
          <div className="animate-fade-in" style={{ marginTop: "1rem", background: "hsla(200, 100%, 50%, 0.1)", border: "1px solid hsla(200, 100%, 50%, 0.3)", padding: "1rem", borderRadius: "8px", color: "var(--foreground)" }}>
            <strong>🤖 AI Explanation: </strong> {question.explanation}
          </div>
        )}

        <div className="quiz-actions animate-fade-in" style={{ animationDelay: "400ms", marginTop: "1.5rem" }}>
          {!isRevealed ? (
            <button className="btn btn-gradient btn-lg" onClick={handleSubmit} disabled={selectedAnswer === null}>
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-gradient btn-lg" onClick={handleNext}>
              {currentQuestion + 1 >= totalQuestions ? "See Results" : "Next Question"}
              <ArrowRight style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quiz;
