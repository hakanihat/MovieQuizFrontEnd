import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import axios from 'axios';
import './LeaderBoardPage.css';
import './AdminDashboardPage.css'; 

const TMDB_API_KEY = "fadad4bcd67791ac88cb9e614c380fd2"; 

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- QUIZ MANAGEMENT STATE ---
  const [allQuizzes, setAllQuizzes] = useState([]); 
  const [editingId, setEditingId] = useState(null); 
  
  // NEW: Library Search State
  const [librarySearch, setLibrarySearch] = useState('');

  // --- MOVIE SEARCH STATE ---
  const [movieSearch, setMovieSearch] = useState('');
  const [movieOptions, setMovieOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // --- FORM STATE ---
  const initialFormState = {
    questionText: '',
    choice1: '',
    choice2: '',
    choice3: '',
    choice4: '',
    correctIndex: 0
  };
  const [quizForm, setQuizForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'quizzes') {
      fetchQuizzes();
    }
  }, [activeTab]);

  // --- DEBOUNCED MOVIE SEARCH ---
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
      toast.error("Failed to load user stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await apiClient.get('/quiz/all');
      setAllQuizzes(res.data);
    } catch (error) {
      console.error("Failed to load quizzes", error);
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

  // --- QUIZ HANDLERS ---
  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setMovieSearch(movie.title);
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

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if(!selectedMovie && !editingId) {
       toast.error("Please search and select a valid movie first.");
       setIsSubmitting(false);
       return;
    }

    const payload = {
      imdbID: selectedMovie ? String(selectedMovie.id) : null,
      questionText: quizForm.questionText,
      choices: [
        quizForm.choice1, quizForm.choice2, quizForm.choice3, quizForm.choice4
      ],
      correctIndex: parseInt(quizForm.correctIndex)
    };
    
    if(editingId && !selectedMovie) {
        delete payload.imdbID; 
    }

    try {
      if (editingId) {
        await apiClient.put(`/quiz/${editingId}`, payload);
        toast.success("Question updated!");
      } else {
        await apiClient.post('/quiz', payload);
        toast.success(`Question added!`);
      }
      resetForm();
      fetchQuizzes(); 
    } catch (error) {
      console.error(error);
      toast.error("Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (quiz) => {
    setEditingId(quiz._id);
    setQuizForm({
      questionText: quiz.questionText,
      choice1: quiz.choices[0],
      choice2: quiz.choices[1],
      choice3: quiz.choices[2],
      choice4: quiz.choices[3],
      correctIndex: quiz.correctIndex
    });
    setMovieSearch(`(Editing ID: ${quiz.imdbID})`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await apiClient.delete(`/quiz/${id}`);
      toast.success("Question deleted");
      fetchQuizzes();
    } catch (err) {
      toast.error("Delete failed");
    }
  };
const handleRoleChange = async (userId, newRole) => {
  try {
    // This calls the backend endpoint we discussed earlier
    await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
    toast.success(`Role updated to ${newRole}`);
    fetchStats(); // Refresh the table
  } catch (error) {
    toast.error("Failed to update role");
    console.error(error);
  }
};
  const resetForm = () => {
    setEditingId(null);
    setQuizForm(initialFormState);
    clearSelection();
  };

  // --- FILTER LOGIC FOR LIBRARY ---
  const filteredQuizzes = allQuizzes.filter(quiz => {
    const term = librarySearch.toLowerCase();
    // Search by Question Text OR IMDb ID
    return (
      quiz.questionText.toLowerCase().includes(term) ||
      quiz.imdbID.includes(term)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container full-width-container">
        
        <div className="lb-header-row" style={{background: 'linear-gradient(180deg, #3e0a0a 0%, #1a1a1a 100%)'}}>
          <h1 className="lb-title">Admin Dashboard</h1>
          <div className="lb-tabs">
            <button 
              className={`lb-tab ${activeTab === 'users' ? 'active' : ''}`} 
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
            <button 
              className={`lb-tab ${activeTab === 'quizzes' ? 'active' : ''}`} 
              onClick={() => setActiveTab('quizzes')}
            >
              Manage Quizzes ({allQuizzes.length})
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
                    <td className="time-col"><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                   <div className="admin-actions-flex">
                {u.username !== 'asd' ? (
                  <>
                    {/* 👇 NEW: ROLE EDIT DROPDOWN */}
                    <div className="role-select-wrapper">
                      <select 
                        className="role-edit-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => handleDeleteUser(u._id)} 
                      className="delete-btn"
                    >
                      <span className="material-icons">delete_outline</span>
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="immutable-label">System Protected</span>
                )}
              </div>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="dashboard-grid">
            
            {/* LEFT: EDITOR */}
            <div className="editor-section">
              <h3 className="section-title">
                {editingId ? '✏️ Edit Question' : '➕ Add New Question'}
              </h3>
              
              <form onSubmit={handleQuizSubmit} className="admin-quiz-form">
                
                <div className="form-group" style={{position: 'relative'}}>
                  <label>Movie (Search to change)</label>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                      type="text" 
                      value={movieSearch}
                      onChange={(e) => {
                        setMovieSearch(e.target.value);
                        if(selectedMovie) setSelectedMovie(null); 
                      }}
                      placeholder={editingId ? "Search to change movie..." : "Type movie name..."}
                      className={selectedMovie ? "valid-movie-input" : ""}
                      autoComplete="off"
                    />
                    {selectedMovie && (
                      <button type="button" className="clear-btn" onClick={clearSelection}>✕</button>
                    )}
                  </div>

                  {showDropdown && movieOptions.length > 0 && (
                    <ul className="admin-autocomplete-list">
                      {movieOptions.slice(0, 6).map(movie => (
                        <li key={movie.id} onClick={() => handleMovieSelect(movie)}>
                          {/* 👇 IMAGE RESTORED HERE 👇 */}
                          <img 
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : "https://via.placeholder.com/40"} 
                            alt="poster"
                            className="dropdown-poster"
                          />
                          <div className="search-info">
                            <span className="search-title">{movie.title}</span>
                            <span className="search-year">{movie.release_date?.substring(0,4)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedMovie && (
                    <div className="selected-tag">Selected: {selectedMovie.title}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea 
                    name="questionText" 
                    value={quizForm.questionText} 
                    onChange={handleQuizChange} 
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
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions-row">
                  <button type="submit" className={`submit-quiz-btn ${editingId ? 'update-mode' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Question' : 'Add Question')}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="cancel-edit-btn">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* RIGHT: LIBRARY */}
            <div className="list-section">
              <h3 className="section-title">📚 Question Library</h3>
              
              {/* 👇 NEW SEARCH BOX 👇 */}
              <div className="library-search-box">
                <span className="material-icons search-icon">search</span>
                <input 
                  type="text" 
                  placeholder="Search by Movie ID or Question..." 
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
              </div>

              <div className="quiz-list-container">
                {filteredQuizzes.length === 0 ? (
                  <p className="empty-msg">No questions found matching your search.</p>
                ) : (
                  filteredQuizzes.map(quiz => (
                    <div key={quiz._id} className={`quiz-card ${editingId === quiz._id ? 'editing' : ''}`}>
                      <div className="quiz-card-header">
                        <span className="movie-id-tag">ID: {quiz.imdbID}</span>
                        <div className="quiz-card-actions">
                          <button onClick={() => handleEdit(quiz)} className="icon-btn edit" title="Edit">✏️</button>
                          <button onClick={() => handleDeleteQuiz(quiz._id)} className="icon-btn delete" title="Delete">🗑️</button>
                        </div>
                      </div>
                      <p className="quiz-q-text">{quiz.questionText}</p>
                      <div className="quiz-ans-preview">
                        Correct: <strong>{quiz.choices[quiz.correctIndex]}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;