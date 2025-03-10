// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leadboard';
import './App.css';

function App() {
  const [user, setUser] = useState(localStorage.getItem('username') || '');

  useEffect(() => {
    if (user) {
      localStorage.setItem('username', user);
    }
  }, [user]);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Math Wizard</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home user={user} setUser={setUser} />} />
            <Route 
              path="/room/:roomId" 
              element={user ? <GameRoom username={user} /> : <Navigate to="/" />} 
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

