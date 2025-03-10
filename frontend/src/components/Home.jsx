// src/components/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Home({ user, setUser }) {
  const [username, setUsername] = useState(user || '');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/rooms/create`, { username });
      setUser(username);
      navigate(`/room/${response.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!roomId) {
      setError('Please enter a room ID');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/rooms/join`, { roomId, username });
      setUser(username);
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    }
  };

  const viewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="home-container">
      <h2>Welcome to Math Challenge</h2>
      <p className="game-description">
        Solve as many math problems as you can in 60 seconds! Each correct answer gives you 10 points.
        Compete with friends to see who can solve the most problems!
      </p>
      <div className="form-group">
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>
      
      <div className="actions">
        <button onClick={handleCreateRoom}>Create Room</button>
        
        <div className="join-room">
          <div className="form-group">
            <label>Room ID:</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
            />
          </div>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
        
        <button onClick={viewLeaderboard}>View Leaderboard</button>
      </div>
      
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Home;

