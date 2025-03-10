// src/components/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/leaderboard`);
        setLeaderboard(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <button onClick={() => navigate('/')}>Back to Home</button>
      
      {loading ? (
        <p>Loading leaderboard...</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Total Score</th>
              <th>Problems Solved</th>
              <th>Games Played</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{player.username}</td>
                <td>{player.score}</td>
                <td>{player.totalSolved}</td>
                <td>{player.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;

// src/App.css
