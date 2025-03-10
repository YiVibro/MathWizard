# Math Race Game

A real-time multiplayer math game where players compete to solve math problems as quickly as possible.

## Overview

Math Race is a competitive multiplayer game that challenges players to solve basic arithmetic problems faster than their opponents. Players join virtual rooms, compete in timed matches, and track their performance on a global leaderboard.

## Features

- **Multiplayer Rooms**: Create or join game rooms with your friends
- **Real-time Competition**: Solve math problems against other players simultaneously
- **Leaderboard System**: Track top players and performance statistics
- **Timed Matches**: 60-second matches to test your speed
- **Varied Problem Types**: Addition, subtraction, and multiplication problems with different difficulty levels

## Tech Stack

- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **Unique IDs**: UUID

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/math-race-game.git
   cd math-race-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

The server will run on port 5000 by default or use the port specified in your environment variables.

## API Endpoints

### Create a Room
```
POST /api/rooms/create
```
Body:
```json
{
  "username": "player1"
}
```
Response:
```json
{
  "roomId": "12345678"
}
```

### Join a Room
```
POST /api/rooms/join
```
Body:
```json
{
  "roomId": "12345678",
  "username": "player2"
}
```

### Get Leaderboard
```
GET /api/leaderboard
```
Response:
```json
[
  {
    "username": "player1",
    "score": 120,
    "totalSolved": 12,
    "gamesPlayed": 3
  },
  ...
]
```

## Socket.IO Events

### Client to Server

| Event | Description | Data |
|-------|-------------|------|
| `join-room` | Join an existing room | `{ roomId, username }` |
| `start-game` | Start the game (creator only) | `{ roomId }` |
| `submit-answer` | Submit an answer to a problem | `{ roomId, answer }` |
| `end-game` | Manually end the game | `{ roomId }` |

### Server to Client

| Event | Description | Data |
|-------|-------------|------|
| `room-update` | Updates when room state changes | `{ players }` |
| `game-start` | Notification that game has started | - |
| `new-problem` | Provides a new math problem | `{ problem }` |
| `answer-result` | Result of submitted answer | `{ username, correct, score, solvedCount }` |
| `game-over` | Notification that game has ended | `{ players, leaderboard }` |

## Gameplay

1. Create a room or join an existing one using a room ID
2. When all players have joined, the room creator can start the game
3. Each player receives math problems to solve
4. Correct answers earn 10 points and generate a new problem
5. The game ends after 60 seconds
6. Final scores are displayed and the global leaderboard is updated

## Game Rules

- Games last for 60 seconds
- Each correct answer earns 10 points
- Players who answer correctly immediately receive a new problem
- The player with the highest score at the end wins

## Troubleshooting

**Issue**: Players' scores are incorrectly updated
- Check the `submit-answer` event handler to ensure it's updating the correct player's score
- Verify that the `getUsernameFromSocket()` function correctly identifies the player

**Issue**: Room not found
- Make sure you're using the correct room ID
- Check if the room has expired (rooms are deleted 60 seconds after a game ends)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

