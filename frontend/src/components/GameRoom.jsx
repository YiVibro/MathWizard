// src/components/GameRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
let socket;

function GameRoom({ username }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, finished
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);
  const [isCreator, setIsCreator] = useState(false);
  const answerInputRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socket = io(API_URL);
    
    // Join the room
    socket.emit('join-room', { roomId, username });
    
    // Set up socket event listeners
    socket.on('room-update', (data) => {
      setPlayers(data.players);
      setIsCreator(data.players.find(p => p.username === username)?.isCreator || false);
    });
    
    socket.on('game-start', () => {
      setGameStatus('playing');
      setTimeLeft(60);
      setSolvedCount(0);
      setScore(0);
      startTimer();
    });
    
    socket.on('new-problem', (data) => {
      setProblem(data.problem);
      setAnswer('');
      // Focus on the answer input when a new problem is received
      if (answerInputRef.current) {
        answerInputRef.current.focus();
      }
    });
    
    socket.on('answer-result', (data) => {
      if (data.username === username) {
        setScore(data.score);
        setSolvedCount(data.solvedCount);
        
        // Show feedback message
        if (data.correct) {
          setMessage('Correct! +10 points');
        } else {
          setMessage('Wrong answer! Try next problem');
        }
        
        // Clear message after a short delay
        setTimeout(() => setMessage(''), 1000);
      }
    });
    
    socket.on('game-over', () => {
      setGameStatus('finished');
      clearInterval(timerRef.current);
      setProblem(null);
    });
    
    // Clean up on component unmount
    return () => {
      clearInterval(timerRef.current);
      socket.disconnect();
    };
  }, [roomId, username]);
  
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          socket.emit('end-game', { roomId });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  const handleStartGame = () => {
    socket.emit('start-game', { roomId });
  };
  
  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    socket.emit('submit-answer', { roomId, answer: parseInt(answer) });
    setAnswer('');
  };
  
  const leaveRoom = () => {
    socket.disconnect();
    navigate('/');
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setMessage('Room ID copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };
  
  return (
    <div className="game-room">
      <h2>Room: {roomId}</h2>
      <div className="room-actions">
        <button className="copy-btn" onClick={copyRoomId}>Copy Room ID</button>
        <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
      </div>
      
      <div className="game-area">
        {gameStatus === 'waiting' && (
          <div className="waiting-area">
            <h3>Waiting for players</h3>
            <p>Share the room ID with friends to join</p>
            {isCreator && <button className="start-btn" onClick={handleStartGame}>Start Game</button>}
          </div>
        )}
        
        {gameStatus === 'playing' && (
          <div className="playing-area">
            <div className="game-stats">
              <div className="timer">Time left: {timeLeft} seconds</div>
              <div className="score-display">Score: {score} | Problems solved: {solvedCount}</div>
            </div>
            
            {problem && (
              <div className="problem-area">
                <div className="problem">{problem}</div>
                <form onSubmit={handleSubmitAnswer}>
                  <input
                    type="number"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter your answer"
                    ref={answerInputRef}
                    autoFocus
                  />
                  <button type="submit">Submit</button>
                </form>
              </div>
            )}
            
            {message && <div className="message">{message}</div>}
          </div>
        )}
        
        {gameStatus === 'finished' && (
          <div className="game-over">
            <h3>Game Over!</h3>
            <p>You solved {solvedCount} problems and scored {score} points!</p>
            <div className="end-game-actions">
              {isCreator && <button onClick={handleStartGame}>Play Again</button>}
              <button onClick={() => navigate('/leaderboard')}>View Leaderboard</button>
            </div>
          </div>
        )}
      </div>
      
      <div className="players-list">
        <h3>Players</h3>
        <table className="players-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
              <th>Problems Solved</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index} className={player.username === username ? 'current-player' : ''}>
                <td>{player.username} {player.isCreator ? '(Creator)' : ''}</td>
                <td>{player.score}</td>
                <td>{player.solvedCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GameRoom;




