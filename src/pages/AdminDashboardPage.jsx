import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import axios from 'axios';
import './LeaderBoardPage.css'; // Re-using existing table styles
import './AdminDashboardPage.css'; 

// ⚠️ REPLACE WITH YOUR REAL KEY
const TMDB_API_KEY = "fadad4bcd67791ac88cb9e614c380fd2"; 

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- MOVIE SEARCH STATE ---
  const [movieSearch, setMovieSearch] = useState('');
  const [movieOptions, setMovieOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // --- QUIZ FORM STATE ---
  const [quizForm, setQuizForm] = useState({
    questionText: '',
    choice1: '',
    choice2: '',
    choice3: '',
    choice4: '',
    correctIndex: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchStats();
  }, []);

  // --- SEARCH DEBOUNCE LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (movieSearch.trim().length > 2 && !selectedMovie) {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieSearch)}`
          );
          setMovieOptions(res.data.results || []);
          setShowDropdown(true);
        } catch (err) {
          console.error("TMDB Search Error", err);
        }
      } else {
        setMovieOptions([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [movieSearch, selectedMovie]);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/dashboard');
      setStats(res.data);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      fetchStats(); 
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // --- FORM HANDLERS ---
  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setMovieSearch(movie.title); // Show title in input
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedMovie(null);
    setMovieSearch('');
    setMovieOptions([]);
  };

  const handleQuizChange = (e) => {
    setQuizForm({ ...quizForm, [e.target.name]: e.target.value });
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate inputs
    if(!selectedMovie) {
       toast.error("Please search and select a valid movie first.");
       setIsSubmitting(false);
       return;
    }
    if(!quizForm.questionText || !quizForm.choice1 || !quizForm.choice2) {
       toast.error("Please fill in all question fields");
       setIsSubmitting(false);
       return;
    }

    const payload = {
      imdbID: String(selectedMovie.id), // Use the Verified ID from TMDB
      questionText: quizForm.questionText,
      choices: [
        quizForm.choice1,
        quizForm.choice2,
        quizForm.choice3,
        quizForm.choice4
      ],
      correctIndex: parseInt(quizForm.correctIndex)
    };

    try {
      await apiClient.post('/quiz', payload);
      toast.success(`Question added for "${selectedMovie.title}"!`);
      
      // Reset only the question part, keep movie selected for faster entry
      setQuizForm(prev => ({
        ...prev,
        questionText: '',
        choice1: '',
        choice2: '',
        choice3: '',
        choice4: '',
        correctIndex: 0
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to add question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        
        <div className="lb-header-row" style={{background: 'linear-gradient(180deg, #3e0a0a 0%, #1a1a1a 100%)'}}>
          <h1 className="lb-title">Admin Dashboard</h1>
          <div className="lb-tabs">
            <button 
              className={`lb-tab ${activeTab === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTab('users')}
            >
              Manage Users ({stats?.totalUsers})
            </button>
            <button 
              className={`lb-tab ${activeTab === 'quizzes' ? 'active' : ''}`} 
              onClick={() => setActiveTab('quizzes')}
            >
              Add Quiz
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="lb-table-wrapper">
            <table className="lb-table">
              <thead>
                <tr>
                  <th className="user-col">Username</th>
                  <th className="score-col">Email</th>
                  <th className="time-col">Role</th>
                  <th className="quiz-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users.map((u) => (
                  <tr key={u._id}>
                    <td className="user-col" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <img src={u.avatar} alt="av" style={{width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover'}}/>
                      {u.username}
                    </td>
                    <td className="score-col" style={{textAlign:'left'}}>{u.email}</td>
                    <td className="time-col">
                      <span className={`role-badge ${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="quiz-col">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ADD QUIZ FORM --- */}
        {activeTab === 'quizzes' && (
          <div className="admin-form-wrapper">
            <form onSubmit={handleAddQuiz} className="admin-quiz-form">
              <h3>Create New Question</h3>
              
              {/* --- SEARCH FIELD --- */}
              <div className="form-group" style={{position: 'relative'}}>
                <label>Find Movie (Search by Name)</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <input 
                    type="text" 
                    value={movieSearch}
                    onChange={(e) => {
                      setMovieSearch(e.target.value);
                      if(selectedMovie) setSelectedMovie(null); // Clear selection on edit
                    }}
                    placeholder="Type movie name (e.g. Inception)"
                    className={selectedMovie ? "valid-movie-input" : ""}
                    autoComplete="off"
                  />
                  {selectedMovie && (
                    <button type="button" className="clear-btn" onClick={clearSelection}>
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {showDropdown && movieOptions.length > 0 && (
                  <ul className="admin-autocomplete-list">
                    {movieOptions.slice(0, 6).map(movie => (
                      <li key={movie.id} onClick={() => handleMovieSelect(movie)}>
                        <img 
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : "https://via.placeholder.com/40"} 
                          alt="poster" 
                        />
                        <div className="search-info">
                          <span className="search-title">{movie.title}</span>
                          <span className="search-year">{movie.release_date?.substring(0,4)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Selected Indicator */}
                {selectedMovie && (
                  <div style={{marginTop: '5px', fontSize: '0.9rem', color: '#2ecc71'}}>
                    <span className="material-icons" style={{fontSize:'14px', verticalAlign:'middle'}}>check_circle</span>
                    {' '}Selected: <strong>{selectedMovie.title}</strong> (ID: {selectedMovie.id})
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Question Text</label>
                <textarea 
                  name="questionText" 
                  value={quizForm.questionText} 
                  onChange={handleQuizChange} 
                  placeholder="What happens at the end of..."
                  rows="3"
                  required
                />
              </div>

              <div className="choices-grid">
                {[1, 2, 3, 4].map((num, idx) => (
                  <div key={num} className="form-group">
                    <label>Option {num}</label>
                    <div className="input-with-radio">
                      <input 
                        type="radio" 
                        name="correctIndex" 
                        value={idx} 
                        checked={parseInt(quizForm.correctIndex) === idx}
                        onChange={handleQuizChange}
                      />
                      <input 
                        type="text" 
                        name={`choice${num}`} 
                        value={quizForm[`choice${num}`]} 
                        onChange={handleQuizChange} 
                        placeholder={`Choice ${num}`}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="submit" 
                className="submit-quiz-btn" 
                disabled={isSubmitting || !selectedMovie}
                style={{ opacity: !selectedMovie ? 0.5 : 1 }}
              >
                {isSubmitting ? 'Saving...' : 'Add Question'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;