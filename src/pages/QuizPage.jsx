import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiService";
import { toast } from "react-toastify";
import axios from "axios";
import "./QuizPage.css"; 

// ⚠️ REPLACE WITH YOUR REAL KEY
const TMDB_API_KEY = "fadad4bcd67791ac88cb9e614c380fd2"; 

function QuizPage() {
  const { imdbID } = useParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [questions, setQuestions] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [backdropPath, setBackdropPath] = useState(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  const [quizFinished, setQuizFinished] = useState(false);
  const [results, setResults] = useState(null);

  // --- TIMER & MODAL STATE ---
  const [startTime, setStartTime] = useState(null); // Null until user clicks "Start"
  const [currentTime, setCurrentTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false); // NEW: Start Modal

  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [isAnswerProcessed, setIsAnswerProcessed] = useState(false);

  // --- REFS ---
  const answersRef = useRef(userAnswers);
  const quizFinishedRef = useRef(quizFinished);
  const questionsRef = useRef(questions);
  const startTimeRef = useRef(startTime);
  const titleRef = useRef(movieTitle);
  const alreadyTakenRef = useRef(alreadyTaken);
  
  const totalPausedTimeRef = useRef(totalPausedTime);
  const pauseStartTimeRef = useRef(0); 

  useEffect(() => { answersRef.current = userAnswers; }, [userAnswers]);
  useEffect(() => { quizFinishedRef.current = quizFinished; }, [quizFinished]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
  useEffect(() => { titleRef.current = movieTitle; }, [movieTitle]);
  useEffect(() => { alreadyTakenRef.current = alreadyTaken; }, [alreadyTaken]);
  useEffect(() => { totalPausedTimeRef.current = totalPausedTime; }, [totalPausedTime]);

  // --- 1. ABANDONMENT HANDLER ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only warn if the quiz has STARTED (startTime exists)
      if (startTimeRef.current && !quizFinishedRef.current && !alreadyTakenRef.current) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Only submit if quiz STARTED, wasn't finished, and wasn't already taken
      if (startTimeRef.current && !quizFinishedRef.current && !alreadyTakenRef.current) {
        console.log("User abandoned active quiz. Submitting partial results...");
        
        const now = Date.now();
        const start = startTimeRef.current;
        const paused = totalPausedTimeRef.current || 0;
        const timeSpent = Math.max(0, Math.floor((now - start - paused) / 1000));

        const payload = {
          imdbID,
          answers: answersRef.current,
          movieTitle: titleRef.current,
          timeTaken: timeSpent
        };

        apiClient.post("/quiz/submit", payload).catch(err => {
            console.error("Auto-submit failed:", err);
        });
      }
    };
  }, [imdbID]);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    async function fetchStableData() {
      try {
        setLoading(true);
        const [quizRes, tmdbRes] = await Promise.allSettled([
          apiClient.get(`/quiz/${imdbID}`),
          axios.get(`https://api.themoviedb.org/3/movie/${imdbID}?api_key=${TMDB_API_KEY}`)
        ]);

        if (tmdbRes.status === "fulfilled" && tmdbRes.value.data) {
          setMovieTitle(tmdbRes.value.data.title);
          setBackdropPath(tmdbRes.value.data.backdrop_path);
        } else {
          setMovieTitle(`Movie ID: ${imdbID}`);
        }

        if (quizRes.status === "fulfilled" && quizRes.value.data && quizRes.value.data.length > 0) {
          setQuestions(quizRes.value.data);
          // NEW: Don't start timer yet. Show the Start Modal.
          setShowStartModal(true); 
        } else {
          if (quizRes.status === "rejected" && quizRes.reason.response?.status === 403) {
            setAlreadyTaken(true);
          } else {
            setQuestions([]);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    if (imdbID) fetchStableData();
  }, [imdbID]);

  // --- 3. TIMER ---
  useEffect(() => {
    // Only run if startTime is set (User clicked Start)
    if (!startTime || submitting || alreadyTaken || quizFinished || isAnswerProcessed || showExitModal || showStartModal) return;

    const timerId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startTime - totalPausedTime) / 1000));
      setCurrentTime(elapsed);
    }, 1000);

    return () => clearInterval(timerId);
  }, [startTime, submitting, alreadyTaken, quizFinished, isAnswerProcessed, totalPausedTime, showExitModal, showStartModal]);

  // --- 4. MODAL HANDLERS ---
  
  // A. Start Quiz Handler
  const handleStartQuiz = () => {
    setShowStartModal(false);
    setStartTime(Date.now()); // START THE TIMER NOW
  };

  // B. Exit Handlers
  const handleExitClick = () => {
    pauseStartTimeRef.current = Date.now();
    setShowExitModal(true);
  };

  const handleCancelExit = () => {
    const pauseDuration = Date.now() - pauseStartTimeRef.current;
    setTotalPausedTime(prev => prev + pauseDuration);
    setShowExitModal(false);
  };

  const handleConfirmExit = () => {
    navigate('/profile');
    toast.info("Quiz exited. Partial results submitted.");
  };

  // --- 5. ANSWER HANDLING ---
  function handleAnswerSelect(choiceIndex) {
    if (isAnswerProcessed) return; 
    
    setIsAnswerProcessed(true);
    pauseStartTimeRef.current = Date.now(); 

    setSelectedChoiceIndex(choiceIndex);

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = [...userAnswers, {
      questionId: currentQuestion._id,
      selectedIndex: choiceIndex
    }];
    setUserAnswers(newAnswers);

    setTimeout(() => {
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      setTotalPausedTime(prev => prev + pauseDuration);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedChoiceIndex(null);
        setIsAnswerProcessed(false); 
      } else {
        submitQuiz(newAnswers, pauseDuration);
      }
    }, 1500);
  }

  // --- 6. SUBMIT ---
  async function submitQuiz(finalAnswers, lastPauseDuration = 0) {
    setSubmitting(true);
    
    const now = Date.now();
    const totalDeduction = totalPausedTime + lastPauseDuration;
    const timeTakenSeconds = Math.max(0, Math.floor((now - startTime - totalDeduction) / 1000));

    try {
      const payload = {
        imdbID,
        answers: finalAnswers,
        movieTitle,
        timeTaken: timeTakenSeconds
      };

      const response = await apiClient.post("/quiz/submit", payload);
      const { score, rank, correctCount, totalQuestions } = response.data;
      
      setResults({ score, rank, timeTaken: timeTakenSeconds, correctCount, totalQuestions });
      setQuizFinished(true); 
      
      toast.success(`Quiz Complete!`);

    } catch (error) {
      console.error(error);
      toast.error("Error submitting quiz.");
      navigate("/profile");
    } finally {
      setSubmitting(false);
    }
  }

  const getButtonClass = (index, correctIndex) => {
    if (!isAnswerProcessed) return "choice-btn"; 
    if (index === correctIndex) return "choice-btn correct";
    if (index === selectedChoiceIndex && index !== correctIndex) return "choice-btn wrong";
    return "choice-btn dimmed";
  };

  const backgroundStyle = {
    backgroundImage: backdropPath 
      ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(https://image.tmdb.org/t/p/original${backdropPath})`
      : `linear-gradient(#141414, #141414)`
  };

  if (loading) return <div className="quiz-page-container" style={{ backgroundColor: "#141414" }}><h2 style={{ color: "#fff" }}>Loading Quiz...</h2></div>;

  if (quizFinished && results) {
    return (
      <div className="quiz-page-container" style={backgroundStyle}>
        <div className="quiz-card animate-scale-in" style={{ textAlign: "center", padding: "50px 30px" }}>
          <div className="congrats-icon">🎉</div>
          <h1 className="congrats-title">Congratulations!</h1>
          <div className="results-grid">
            <div className="result-item">
              <span className="label">Points</span>
              <span className="value points">{results.score}</span>
            </div>
            <div className="result-item">
              <span className="label">Time</span>
              <span className="value">{results.timeTaken}s</span>
            </div>
            <div className="result-item">
              <span className="label">Rank</span>
              <span className="value rank">#{results.rank}</span>
            </div>
          </div>
          <div className="action-buttons">
            <button className="primary-btn" onClick={() => navigate("/leaderboard")}>Go to Leaderboard</button>
            <button className="secondary-btn" onClick={() => navigate("/profile")}>View Profile</button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="quiz-page-container" style={backgroundStyle}>
        <div className="quiz-card" style={{ textAlign: "center" }}>
          <span className="restriction-icon">✅</span>
          <h2 style={{ color: "#2ecc71", marginBottom: "1rem" }}>Quiz Completed!</h2>
          <p style={{ fontSize: "1.2rem", color: "#ccc", marginBottom: "2rem" }}>
            You have already completed the quiz for <br/>
            <strong style={{ color: "#fff" }}>{movieTitle}</strong>
          </p>
          <button onClick={() => navigate("/profile")} className="primary-btn">View Results in Profile</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-page-container" style={backgroundStyle}>
        <div className="quiz-card" style={{ textAlign: "center" }}>
          <h2>No Quiz Available</h2>
          <p style={{ color: "#aaa" }}>We couldn't find questions for <strong>{movieTitle}</strong>.</p>
          <button onClick={() => navigate("/")} className="secondary-btn" style={{marginTop: "20px"}}>Go Back</button>
        </div>
      </div>
    );
  }

  if (submitting) return <div className="quiz-page-container" style={backgroundStyle}><h2 style={{ color: "#fff" }}>Calculating Score...</h2></div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-page-container" style={backgroundStyle}>
      
      {/* --- START QUIZ MODAL --- */}
      {showStartModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-content">
            <h3>Ready to Start?</h3>
            <p>Once you start, leaving the page will count as an attempt and your score will be submitted.</p>
            <div className="quiz-modal-actions">
               {/* If they don't want to start, they can go back */}
               <button className="secondary-btn" onClick={() => navigate(-1)}>Cancel</button>
               <button className="modal-start-btn" onClick={handleStartQuiz}>Start Quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXIT CONFIRMATION MODAL --- */}
      {showExitModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-content">
            <h3>Are you sure you want to exit?</h3>
            <p>Your score will be submitted anyway.</p>
            <div className="quiz-modal-actions">
              <button className="modal-cancel-btn" onClick={handleCancelExit}>Resume</button>
              <button className="modal-confirm-btn" onClick={handleConfirmExit}>Exit Quiz</button>
            </div>
          </div>
        </div>
      )}

      <div className="quiz-card animate-fade-in">
        <div className="quiz-header">
          <div>
             <h2 className="movie-title">{movieTitle}</h2>
             <span style={{color: "#aaa", fontSize: "0.9rem"}}>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <div className="timer-badge">⏱️ {currentTime}s</div>
            {/* EXIT BUTTON */}
            <button className="exit-quiz-btn" onClick={handleExitClick} title="Exit Quiz">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
        <div className="question-text">{currentQuestion.questionText}</div>
        <ul className="choices-list">
          {currentQuestion.choices.map((choice, index) => (
            <li key={index}>
              <button 
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswerProcessed} 
                className={getButtonClass(index, currentQuestion.correctIndex)}
              >
                {choice}
                {isAnswerProcessed && index === currentQuestion.correctIndex && <span className="material-icons">check_circle</span>}
                {isAnswerProcessed && index === selectedChoiceIndex && index !== currentQuestion.correctIndex && <span className="material-icons">cancel</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default QuizPage;