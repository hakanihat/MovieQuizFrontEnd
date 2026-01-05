import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { WatchlistContext } from '../contexts/WatchlistContext';
import apiClient from '../api/apiService';
import { useNavigate, Link, useParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti'; 
import './ProfilePage.css'; 

const AVATAR_OPTIONS = [
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Spooky",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Ginger",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Trouble"
];

const ProfilePage = () => {
  const { logout, login, user: contextUser, token } = useContext(AuthContext); 
  const { watchlist: myContextWatchlist } = useContext(WatchlistContext);
  const navigate = useNavigate();
  const { userId } = useParams(); 
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // UI States
  const [activeTab, setActiveTab] = useState('watchlist');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnfriendModal, setShowUnfriendModal] = useState(false);

  // Data States
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  
  // Friendship Data
  const [friendStatus, setFriendStatus] = useState('none'); 
  const [incomingRequests, setIncomingRequests] = useState([]); 
  const [myFriends, setMyFriends] = useState([]); 
  const [globalSearchResults, setGlobalSearchResults] = useState([]); 
  
  // Track sent requests locally
  const [sentRequestIds, setSentRequestIds] = useState([]); 

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (userId && contextUser && (userId === contextUser.userId || userId === contextUser._id)) {
      navigate('/profile', { replace: true });
    }
  }, [userId, contextUser, navigate]);

  const isOwnProfile = !userId; 

  useEffect(() => {
    setActiveTab('watchlist');
    setSearchTerm('');
    setGlobalSearchResults([]);
    setShowUnfriendModal(false); 
    setSentRequestIds([]); 
  }, [userId]); 

  // --- MAIN DATA FETCH ---
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      if (isOwnProfile) {
        const res = await apiClient.get('/users/profile');
        data = res.data;
        const reqRes = await apiClient.get('/friends/requests/incoming');
        setIncomingRequests(reqRes.data);
        const friendsRes = await apiClient.get('/friends');
        setMyFriends(friendsRes.data);
      } else {
        const res = await apiClient.get(`/users/${userId}/profile`);
        data = res.data;
        if (data.isFriend) setFriendStatus('friends');
        else if (data.friendRequestSent) setFriendStatus('pending');
        else setFriendStatus('none');
      }
      setProfileData(data);
    } catch (error) {
      console.error("Failed to load profile", error);
      toast.error("Could not load user profile.");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    if (contextUser) fetchUserData();
  }, [contextUser, fetchUserData]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (activeTab === 'friends' && searchTerm.trim().length > 0) {
        try {
          const res = await apiClient.get(`/users/search?q=${searchTerm}`);
          const filtered = res.data.filter(u => 
            u._id !== contextUser.userId && 
            !myFriends.some(f => f._id === u._id)
          );
          setGlobalSearchResults(filtered);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setGlobalSearchResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab, myFriends, contextUser]);

  // --- ACTIONS ---
  const handleSendFriendRequest = async (targetId) => {
    // Optimistic Update
    setSentRequestIds(prev => [...prev, targetId]);

    try {
      await apiClient.post(`/friends/request/${targetId}`);
      if (!isOwnProfile) setFriendStatus('pending');
      toast.success("Request sent!");
    } catch (error) {
      const errMsg = error.response?.data?.message;
      if (error.response?.status === 400 && (errMsg === 'Request pending' || errMsg === 'Already friends')) {
         toast.info("Request was already sent.");
      } else {
         setSentRequestIds(prev => prev.filter(id => id !== targetId));
         toast.error("Failed to send request.");
      }
    }
  };

  const handleUnfriendList = async (friendId) => {
    if(!window.confirm("Remove this friend?")) return; 
    try {
      await apiClient.delete(`/friends/${friendId}`);
      setMyFriends(prev => prev.filter(f => f._id !== friendId));
      toast.info("Friend removed.");
    } catch (error) {
      toast.error("Failed to remove friend.");
    }
  };

  const onUnfriendConfirm = async () => {
    try {
      await apiClient.delete(`/friends/${userId}`);
      setFriendStatus('none');
      setShowUnfriendModal(false);
      toast.info("You are no longer friends.");
      fetchUserData();
    } catch (error) {
      toast.error("Failed to unfriend.");
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      await apiClient.post(`/friends/accept/${requesterId}`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast.success("Friend added!");
      fetchUserData(); 
    } catch (error) {
      toast.error("Failed to accept.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await apiClient.delete(`/friends/requests/${requestId}`);
      setIncomingRequests(prev => prev.filter(req => req._id !== requestId));
      toast.info("Request removed.");
    } catch (error) {
      toast.error("Failed to reject.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarSelect = async (newAvatarUrl) => {
    try {
      await apiClient.patch('/users/profile', { avatar: newAvatarUrl });
      setProfileData(prev => ({ ...prev, avatar: newAvatarUrl }));
      if (contextUser && token) login({ ...contextUser, avatar: newAvatarUrl }, token);
      toast.success("Avatar updated!");
      setIsEditingAvatar(false);
    } catch (error) {
      toast.error("Failed to update avatar");
    }
  };

  if (loading) return <div className="loading-container">Loading Profile...</div>;

  const displayUser = isOwnProfile ? (profileData || contextUser) : profileData;
  const displayUsername = displayUser?.username || "Unknown User";
  const displayEmail = isOwnProfile ? (displayUser?.email || contextUser?.email) : null;
  const displayAvatar = displayUser?.avatar || AVATAR_OPTIONS[0];
  const canViewContent = isOwnProfile || friendStatus === 'friends';
  
  const currentWatchlist = isOwnProfile ? (myContextWatchlist || []) : (displayUser?.watchlist || []);
  const currentQuizResults = displayUser?.quizResults || [];

  const filteredWatchlist = currentWatchlist.filter(movie => 
    (movie.Title || movie.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFriends = myFriends.filter(f => 
    (f.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = currentQuizResults.filter(quiz => 
    (quiz.movieTitle || quiz.imdbID || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="profile-page">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={300} recycle={false} />}

      {/* CONFIRMATION MODAL */}
      {showUnfriendModal && (
        <div className="modal-overlay" onClick={() => setShowUnfriendModal(false)}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
             <div className="confirmation-icon"><span className="material-icons">person_remove</span></div>
             <h3>Unfriend {displayUsername}?</h3>
             <p>Are you sure you want to remove <strong>{displayUsername}</strong>?</p>
             <div className="modal-actions">
                <button className="modal-btn cancel" onClick={() => setShowUnfriendModal(false)}>Cancel</button>
                <button className="modal-btn danger" onClick={onUnfriendConfirm}>Yes, Unfriend</button>
             </div>
          </div>
        </div>
      )}

      {/* AVATAR MODAL */}
      {isOwnProfile && isEditingAvatar && (
        <div className="modal-overlay" onClick={() => setIsEditingAvatar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose an Avatar</h3>
              <button className="close-modal-btn" onClick={() => setIsEditingAvatar(false)}><span className="material-icons">close</span></button>
            </div>
            <div className="avatars-grid">
              {AVATAR_OPTIONS.map((url, index) => (
                <img key={index} src={url} alt={`Avatar ${index}`} onClick={() => handleAvatarSelect(url)} className={displayAvatar === url ? "selected" : ""} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="profile-header-wrapper animate-fade-in">
        <div className="profile-banner"></div> 
        
        <div className="profile-header-content">
          <div className="avatar-section">
            <div className="avatar-container">
              <img src={displayAvatar} alt="Profile" className="profile-avatar-img" />
              {isOwnProfile && <button className="edit-avatar-btn" onClick={() => setIsEditingAvatar(true)}><span className="material-icons">edit</span></button>}
            </div>
          </div>

          <div className="info-section">
            <div className="name-row">
              <h1>{displayUsername}</h1>
              {isOwnProfile && <button onClick={handleLogout} className="logout-icon-btn" title="Logout"><span className="material-icons">logout</span></button>}
            </div>
            {displayEmail && <p className="user-email">{displayEmail}</p>}
            
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-val">{canViewContent ? currentWatchlist.length : '-'}</span>
                <span className="stat-label">Movies</span>
              </div>
              <div className="stat-item">
                <span className="stat-val">{canViewContent ? currentQuizResults.length : '-'}</span>
                <span className="stat-label">Quizzes</span>
              </div>
              {isOwnProfile && (
                <div className="stat-item clickable" onClick={() => setActiveTab('friends')}>
                   <span className="stat-val">{myFriends.length}</span>
                   <span className="stat-label">Friends</span>
                </div>
              )}
               {isOwnProfile && incomingRequests.length > 0 && (
                <div className="stat-item clickable notify" onClick={() => setActiveTab('requests')}>
                   <span className="stat-val">{incomingRequests.length}</span>
                   <span className="stat-label">Requests</span>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS (Moved Here via CSS) */}
            {!isOwnProfile && (
              <div className="action-buttons">
                {friendStatus === 'none' && (
                    <button className="action-btn primary" onClick={() => handleSendFriendRequest(userId)}>
                        <span className="material-icons">person_add</span> Add Friend
                    </button>
                )}
                {friendStatus === 'pending' && (
                    <button className="action-btn secondary" disabled>
                        <span className="material-icons">hourglass_top</span> Request Sent
                    </button>
                )}
                {friendStatus === 'friends' && (
                    <button className="action-btn success clickable" onClick={() => setShowUnfriendModal(true)}>
                        <span className="material-icons">check_circle</span> Friends
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {canViewContent ? (
        <>
          <div className="profile-tabs-container">
            <div className="profile-tabs modern-tabs">
              <button className={`tab-link ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>
                Watchlist
              </button>
              <button className={`tab-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                History
              </button>
              {isOwnProfile && (
                <button className={`tab-link ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                  Friends
                </button>
              )}
              {isOwnProfile && incomingRequests.length > 0 && (
                <button className={`tab-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                  Requests <span className="tab-dot"></span>
                </button>
              )}
            </div>
          </div>

          {activeTab !== 'requests' && (
             <div className="profile-search-wrapper">
                <span className="material-icons profile-search-icon">search</span>
                <input 
                  type="text" 
                  className="profile-search-input" 
                  placeholder={activeTab === 'friends' ? "Find friends..." : "Search..."} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
             </div>
          )}

          <div className="profile-content">
            {/* Watchlist, History, Friends, Requests content goes here (Unchanged) */}
            {activeTab === 'watchlist' && (
              <div className="watchlist-container animate-fade-in">
                {filteredWatchlist.length > 0 ? (
                  <div className="watchlist-grid">
                    {filteredWatchlist.map((movie, idx) => (
                      <div key={movie.imdbID || movie._id || idx} className="watchlist-card-wrapper">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state"><div className="empty-icon">📺</div><h3>Empty Watchlist</h3></div>}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-container animate-fade-in">
                {filteredHistory.length > 0 ? (
                  <div className="history-grid">
                    {filteredHistory.map((quiz, index) => (
                        <div key={index} className="history-card">
                          <div className="history-left">
                            <div className="history-details">
                              <h4 className="history-title">{quiz.movieTitle || `Movie ID: ${quiz.imdbID}`}</h4>
                              <span className="history-date">📅 {new Date(quiz.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="history-right">
                             <div className={`score-badge ${quiz.score === 10 ? 'perfect' : quiz.score >= 7 ? 'good' : 'low'}`}>
                                <span className="score-val">{quiz.score}</span>
                             </div>
                          </div>
                        </div>
                    ))}
                  </div>
                ) : <div className="empty-state"><div className="empty-icon">🏆</div><h3>No quizzes yet</h3></div>}
              </div>
            )}

            {activeTab === 'friends' && isOwnProfile && (
              <div className="friends-container animate-fade-in">
                 {filteredFriends.length > 0 && (
                   <>
                    <h3 className="section-title">My Friends</h3>
                    <div className="friends-grid">
                      {filteredFriends.map(friend => (
                        <div key={friend._id} className="friend-card">
                           <div className="friend-avatar-wrapper"><img src={friend.avatar || AVATAR_OPTIONS[0]} alt={friend.username} /></div>
                           <div className="friend-info">
                              <h4>{friend.username}</h4>
                              <Link to={`/profile/${friend._id}`} className="view-profile-btn">View Profile</Link>
                              <button className="icon-btn unfriend-btn" onClick={() => handleUnfriendList(friend._id)}>
                                <span className="material-icons">person_remove</span>
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                   </>
                 )}

                 {searchTerm && globalSearchResults.length > 0 && (
                   <div className="global-results-section">
                      <div className="divider-line"></div>
                      <h3 className="section-title">New People</h3>
                      <div className="friends-grid">
                           {globalSearchResults.map(user => {
                              const isPending = sentRequestIds.includes(user._id);
                              return (
                                <div key={user._id} className="friend-card new-person">
                                   <div className="friend-avatar-wrapper"><img src={user.avatar || AVATAR_OPTIONS[0]} alt={user.username} /></div>
                                   <div className="friend-info">
                                      <h4>{user.username}</h4>
                                      <Link to={`/profile/${user._id}`} className="view-profile-btn">View Profile</Link>
                                      {isPending ? (
                                        <button className="add-friend-btn pending" disabled>Request Sent</button>
                                      ) : (
                                        <button className="add-friend-btn" onClick={() => handleSendFriendRequest(user._id)}>+ Add Friend</button>
                                      )}
                                   </div>
                                </div>
                              );
                           })}
                      </div>
                   </div>
                 )}
                 {filteredFriends.length === 0 && (!searchTerm || globalSearchResults.length === 0) && (
                    <div className="empty-state">
                      <div className="empty-icon">👥</div>
                      <h3>Start your community</h3>
                      <p>Search above to find friends!</p>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'requests' && isOwnProfile && (
                <div className="requests-container animate-fade-in">
                    <div className="requests-grid">
                        {incomingRequests.map(req => (
                            <div key={req._id} className="request-card">
                                <div className="req-user-info">
                                    <img src={req.requester.avatar || AVATAR_OPTIONS[0]} alt="Avatar" />
                                    <span className="req-username">{req.requester.username}</span>
                                </div>
                                <div className="req-actions">
                                    <button className="req-btn accept" onClick={() => handleAcceptRequest(req.requester._id)} title="Accept"><span className="material-icons">check</span></button>
                                    <button className="req-btn reject" onClick={() => handleRejectRequest(req._id)} title="Reject"><span className="material-icons">close</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="private-profile-lock animate-fade-in">
          <div className="lock-circle">
            <span className="material-icons lock-icon">lock</span>
          </div>
          <h3>Private Profile</h3>
          <p>You must be friends with <strong>{displayUsername}</strong> to view their content.</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;