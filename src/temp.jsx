import React, { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import PlayerInput from './PlayerInput';
import Scoreboard from './Scoreboard';
import ChoiceReveal from './ChoiceReveal';

import share_icon from './assets/share.png';
import boo_sound from './assets/boo.mp3';
import yay_sound from './assets/yay.mp3';
import crowd_cheer from './assets/crowd-cheer.mp3';

import { useLocation, useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

// New imports
import cricketField from './assets/cricket-field.jpg';
import batsman from './assets/batsman.png';
import bowler from './assets/bowler.png';
import share_icon from './assets/share.png';

function Game() {
  const location = useLocation();
  const playerKaNaam = location.state?.playerName || 'Player';
  const navigate = useNavigate();

  const [player1Runs, setPlayer1Runs] = useState(0);
  const [player1Out, setPlayer1Out] = useState(false);
  const [player2Runs, setPlayer2Runs] = useState(0);
  const [player2Out, setPlayer2Out] = useState(false);
  const [battingPlayer, setBattingPlayer] = useState('player1');
  const [player1Choice, setPlayer1Choice] = useState(null);
  const [player2Choice, setPlayer2Choice] = useState(null);
  const [target, setTarget] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState(playerKaNaam);
  const [opponentName, setOpponentName] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");

  // Out message
  const [outMessage, setOutMessage] = useState('');
  const [showOutMessage, setShowOutMessage] = useState(false);
  const [gamePhase, setGamePhase] = useState('playing'); // 'playing', 'out', or 'gameOver'

  // Request to Re start
  const [restartRequested, setRestartRequested] = useState(false);
  const [restartRequestedBy, setRestartRequestedBy] = useState(null);

  // Opponent left the game
  const [opponentLeft, setOpponentLeft] = useState(false);

  // Ball-by-ball scorecard
  const [player1BallByBall, setPlayer1BallByBall] = useState([]);
  const [player2BallByBall, setPlayer2BallByBall] = useState([]);

  // Display choices
  const [showChoiceReveal, setShowChoiceReveal] = useState(false);
  const [choiceRevealData, setChoiceRevealData] = useState(null);

  // Fallback (Synchronization issue)
  const [lastInputTime, setLastInputTime] = useState(null);

  // New state variables
  const [weatherEffect, setWeatherEffect] = useState('sunny');
  const [showPowerUp, setShowPowerUp] = useState(false);
  const [powerUpType, setPowerUpType] = useState(null);

  // Generate a random player ID
  useEffect(() => {
    const player = `player${Math.floor(Math.random() * 10000)}`;
    setPlayerId(player);
  }, []);


  // Websocket subscription to listen for changes in the game state
  useEffect(() => {
    const subscribeToChannel = async () => {
      const channel = supabase
        .channel(`game_rooms:${roomCode}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
          payload => {
            if (payload.new) {
              updateGameState(payload.new);
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error("Subscription error:", err);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    };

    if (roomCode) {
      subscribeToChannel();
    }
  }, [roomCode, playerId]);

  // Restart the game if the opponent leaves
  useEffect(() => {
    if (restartRequested && restartRequestedBy !== playerId) {
      const timer = setTimeout(() => {
        if (restartRequested) {
          alert("Your opponent has left the game.");
        }
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timer);
    }
  }, [restartRequested, restartRequestedBy]);

  // Redirect to the front page if the opponent leaves the game
  useEffect(() => {
    if (opponentLeft) {
      const timer = setTimeout(() => {
        navigate('/');
        // Reset any other necessary state variables
      }, 3000); // Go back one screen after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [opponentLeft, navigate]);

  // Fallback to check and force update if the input is disabled for too long
  useEffect(() => {
    let timeoutId;
    if (inputDisabled && lastInputTime) {
      timeoutId = setTimeout(() => {
        checkAndForceUpdate();
      }, 5000); // 5 seconds timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputDisabled, lastInputTime]);

  // New function for weather effects
  useEffect(() => {
    const weatherTypes = ['sunny', 'cloudy', 'light-rain'];
    const changeWeather = () => {
      const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      setWeatherEffect(newWeather);
    };
    const weatherInterval = setInterval(changeWeather, 30000); // Change weather every 30 seconds
    return () => clearInterval(weatherInterval);
  }, []);

  // New function for power-ups
  useEffect(() => {
    const powerUpTypes = ['boundary', 'unplayable'];
    const spawnPowerUp = () => {
      if (Math.random() < 0.1) { // 10% chance of spawning a power-up
        setShowPowerUp(true);
        setPowerUpType(powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]);
        setTimeout(() => setShowPowerUp(false), 5000); // Power-up disappears after 5 seconds
      }
    };
    const powerUpInterval = setInterval(spawnPowerUp, 15000); // Check for power-up every 15 seconds
    return () => clearInterval(powerUpInterval);
  }, []);


  // Sound Effects
  function playYay() {
    new Audio(yay_sound).play();
  }

  function playBoo() {
    new Audio(boo_sound).play();
  }

  const playCrowdCheer = () => {
    new Audio(crowd_cheer).play();
  };

  // Update Game State, based on the new state received from the database
  const updateGameState = (newState) => {

    setPlayer1Runs(newState.player1_runs);
    setPlayer2Runs(newState.player2_runs);
    setBattingPlayer(newState.batting_player);
    setPlayer1Out(newState.player1_out);
    setPlayer2Out(newState.player2_out);
    setTarget(newState.target);
    setPlayer1Choice(newState.player1_choice);
    setPlayer2Choice(newState.player2_choice);
    setGamePhase(newState.game_phase);
    setIsGameStarted(true);
    setRestartRequested(newState.restart_requested);
    setRestartRequestedBy(newState.restart_requested_by);
    setPlayer1BallByBall(newState.player1_ball_by_ball || []);
    setPlayer2BallByBall(newState.player2_ball_by_ball || []);
    setPlayer1Name(newState.player1_name);
    setPlayer2Name(newState.player2_name);
    setLastInputTime(null);

    if (playerId === newState.player1_id) {
      setOpponentName(newState.player2_name);
    } else {
      setOpponentName(newState.player1_name);
    }

    // Handle revealing choices and playing sounds
    if (newState.player1_choice !== null && newState.player2_choice !== null) {
      setChoiceRevealData({
        player1: {
          choice: newState.player1_choice,
          isBatting: newState.batting_player === newState.player1_id
        },
        player2: {
          choice: newState.player2_choice,
          isBatting: newState.batting_player === newState.player2_id
        }
      });
      // setShouldRevealChoices(true);
      setShowChoiceReveal(true);

      // Play sounds
      const battingPlayerChoice = newState.batting_player === newState.player1_id ? newState.player1_choice : newState.player2_choice;
      const bowlingPlayerChoice = newState.batting_player === newState.player1_id ? newState.player2_choice : newState.player1_choice;

      if (battingPlayerChoice === bowlingPlayerChoice) {
        playBoo();
      } else if (battingPlayerChoice === 6) {
        playYay();
      }

      // Schedule resetting choices after a delay
      setTimeout(async () => {
        const resetState = {
          player1_choice: null,
          player2_choice: null
        };
        await supabase.from('game_rooms').update(resetState).eq('room_code', roomCode);
        // setShouldRevealChoices(false);
        // setShowChoiceReveal(false);
      }, 1000); // Adjust this delay as needed
    }

    if (newState.player1_choice === null && newState.player2_choice === null) {
      setInputDisabled(false);
    }

    // Handle restart request
    if (newState.restart_requested_by && newState.restart_requested_by !== playerId) {
      setRestartRequested(true);
      setRestartRequestedBy(newState.restart_requested_by);
    }

    if (newState.player_left && newState.player_left !== playerId) {
      setOpponentLeft(true);
      alert('Your opponent has left the game. You will be redirected to the front page.');
    }

    if (newState.restart_accepted) {
      // Reset game state
      setPlayer1Runs(0);
      setPlayer2Runs(0);
      setBattingPlayer(playerId);
      setPlayer1Out(false);
      setPlayer2Out(false);
      setTarget(null);
      setPlayer1Choice(null);
      setPlayer2Choice(null);
      setGamePhase('playing');
      setShowOutMessage(false);
      setInputDisabled(false);
      setRestartRequested(false);
      setRestartRequestedBy(null);
      setPlayer1BallByBall([]);
      setPlayer2BallByBall([]);
    }

    // Update ball-by-ball scorecard
    setPlayer1BallByBall(newState.player1_ball_by_ball || []);
    setPlayer2BallByBall(newState.player2_ball_by_ball || []);

    // Handle out message
    if (newState.game_phase === 'out') {
      setOutMessage(newState.out_message);
      setShowOutMessage(true);
      setGamePhase('out');
      setTimeout(async () => {
        setShowOutMessage(false);
        setGamePhase('playing');
        // Update the database to clear the out message and game phase
        try {
          const { error } = await supabase.from('game_rooms').update({
            out_message: '',
            game_phase: 'playing'
          }).eq('room_code', roomCode);

          if (error) {
            console.error('Error updating game state:', error);
          }
        } catch (error) {
          console.error('Error updating game state:', error);
        }
      }, 3000);
    } else if (newState.game_phase === 'gameOver') {
      setGamePhase('gameOver');
      setShowOutMessage(false);
    } else {
      setGamePhase('playing');
      setShowOutMessage(false);
    }
  };

  // Create Room
  const createRoom = async () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from('game_rooms').insert([
      {
        room_code: roomCode,
        player1_id: playerId,
        player1_name: playerName,
        player1_runs: 0,
        player2_runs: 0,
        batting_player: "",
        player1_out: false,
        player2_out: false,
        target: null,
        player1_choice: null,
        player2_choice: null
      }
    ]);

    setPlayer1Name(playerName);

    if (error) {
      console.error('Error creating room:', error);
      return;
    }

    setRoomCode(roomCode);
  };

  // Join Room
  const joinRoom = async (code) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (error) {
      console.error('Room not found:', error);
      return;
    }

    setRoomCode(code);
    setPlayer1Runs(data.player1_runs);
    setPlayer2Runs(data.player2_runs);
    setPlayer1Out(data.player1_out);
    setPlayer2Out(data.player2_out);
    setTarget(data.target);
    setPlayer1Choice(data.player1_choice);
    setPlayer2Choice(data.player2_choice);

    if (!data.player2_id) {
      const randomBattingPlayer = Math.random() < 0.5 ? data.player1_id : playerId;
      await supabase
        .from('game_rooms')
        .update({
          player2_id: playerId,
          player2_name: playerName,
          batting_player: randomBattingPlayer
        })
        .eq('room_code', code);
      setOpponentName(data.player1_name);
      setPlayer2Name(playerName);
      setBattingPlayer(randomBattingPlayer);
    } else {
      setOpponentName(data.player2_name);
      setPlayer2Name(data.player2_name);
      setBattingPlayer(data.batting_player);
    }

    setIsGameStarted(true);
  };

  // Check and force update if the input is disabled for too long
  const checkAndForceUpdate = async () => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error) {
      console.error('Error fetching game state:', error);
      return;
    }

    if (data.player1_choice !== null && data.player2_choice !== null) {
      // Both choices are set, but the game didn't update. Force an update.
      updateGameState(data);
      setInputDisabled(false);
    } else if ((playerId === data.player1_id && data.player1_choice === null) ||
      (playerId === data.player2_id && data.player2_choice === null)) {
      // This player's choice is not set. Allow input again.
      setInputDisabled(false);
    }
  };

  // Restart Game
  const acceptRestart = async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({
          player1_runs: 0,
          player2_runs: 0,
          batting_player: playerId,
          player1_out: false,
          player2_out: false,
          target: null,
          player1_choice: null,
          player2_choice: null,
          game_phase: 'playing',
          out_message: '',
          restart_requested: false,
          restart_requested_by: null,
          player1_ball_by_ball: [],
          player2_ball_by_ball: [],
        })
        .eq('room_code', roomCode);

      if (error) {
        console.error('Error accepting restart:', error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const rejectRestart = async () => {
    try {
      await supabase.from('game_rooms').update({
        restart_requested: false,
        restart_requested_by: null,
        player_left: playerId
      }).eq('room_code', roomCode);

      navigate('/');
    } catch (error) {
      console.error('Error rejecting restart:', error);
    }
  };


  // Main logic to handle player input
  const handlePlayerInput = async (playerChoice) => {
    setInputDisabled(true);
    setLastInputTime(Date.now());

    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (error) {
      console.error('Error fetching game state:', error);
      setInputDisabled(false);
      return;
    }

    let newState = { ...data };

    if (playerId === newState.player1_id) {
      newState.player1_choice = playerChoice;

    } else {
      newState.player2_choice = playerChoice;
    }

    if (showPowerUp && powerUpType === 'boundary' && playerId === newState.batting_player) {
      playerChoice = 6; // Force a boundary
      setShowPowerUp(false);
    }

    if (showPowerUp && powerUpType === 'unplayable' && playerId !== newState.batting_player) {
      newState.out_message = "Unplayable delivery! Batsman is out!";
      newState.game_phase = 'out';
      setShowPowerUp(false);
    }

    if (newState.player1_choice !== null && newState.player2_choice !== null) {

      // Update the game state after 3 seconds (Game Logic)
      if (newState.batting_player === newState.player1_id) {
        if (newState.player1_choice === newState.player2_choice) {
          newState.player1_ball_by_ball = [...(newState.player1_ball_by_ball || []), 'W'];
          newState.player1_out = true;
          if (!newState.target) {
            newState.target = newState.player1_runs + 1;
          }
          newState.batting_player = newState.player2_id;
          if (newState.player1_out && newState.player2_out) {
            newState.game_phase = 'gameOver';
            newState.out_message = "Ohh that's out! Game Over!";
          }
          else {
            newState.game_phase = 'out';
            newState.out_message = `Ohh that's out! The target is ${newState.target}`;
          }
        } else {
          newState.player1_ball_by_ball = [...(newState.player1_ball_by_ball || []), newState.player1_choice];
          newState.player1_runs += newState.player1_choice;
          newState.out_message = '';
          newState.game_phase = 'playing';

          // Check winning condition
          if (newState.target && newState.player1_runs >= newState.target) {
            newState.player1_out = true;
            newState.out_message = "Player 1 Wins!";
            newState.game_phase = 'gameOver';
            if (newState.player1_out && newState.player2_out) {
              newState.game_phase = 'gameOver';
              newState.out_message = "Nice Game!";
            }
          }
        }
      } else {
        if (newState.player1_choice === newState.player2_choice) {
          newState.player2_ball_by_ball = [...(newState.player2_ball_by_ball || []), 'W'];
          newState.player2_out = true;
          if (!newState.target) {
            newState.target = newState.player2_runs + 1;
          }
          newState.batting_player = newState.player1_id;
          if (newState.player1_out && newState.player2_out) {
            newState.game_phase = 'gameOver';
            newState.out_message = "Ohh that's out! Game Over!";
          }
          else {
            newState.game_phase = 'out';
            newState.out_message = `Ohh that's out! The target is ${newState.target}`;
          }
        } else {
          newState.player2_ball_by_ball = [...(newState.player2_ball_by_ball || []), newState.player2_choice];
          newState.player2_runs += newState.player2_choice;
          newState.out_message = '';
          newState.game_phase = 'playing';

          // Check winning condition
          if (newState.target && newState.player2_runs >= newState.target) {
            newState.player2_out = true;
            newState.out_message = "Player 2 Wins!";
            newState.game_phase = 'gameOver';
            if (newState.player1_out && newState.player2_out) {
              newState.game_phase = 'gameOver';
              newState.out_message = "Nice Game!";
            }
          }
        }
      }

    }
    await supabase.from('game_rooms').update(newState).eq('room_code', roomCode);
  };

  const handleRevealComplete = () => {
    setShowChoiceReveal(false);
    // Here you can add any logic that should happen after the reveal is complete
    // For example, updating scores, checking for out, etc.
  };

  // Play Again Request
  const requestPlayAgain = async () => {
    if (roomCode) {
      await supabase.from('game_rooms').update({
        restart_requested: true,
        restart_requested_by: playerId
      }).eq('room_code', roomCode);
    }
  };

  // Share Room Code
  const shareRoomCode = (roomCode) => {
    if (navigator.share) {
      navigator.share({
        title: 'Room Code',
        text: `${roomCode}`,
      })
        .then(() => console.log('Successfully shared'))
        .catch((error) => console.error('Error sharing', error));
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(roomCode)
        .then(() => alert('Room code copied to clipboard'))
        .catch((error) => console.error('Error copying to clipboard', error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white py-8 px-4 md:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white bg-opacity-10 rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-xl md:text-3xl font-bold text-center md:text-left mb-4 md:mb-0">Hand Cricket Game</h1>
            <p className="text-md md:text-lg">Welcome, {playerKaNaam}!</p>
          </div>

          {player1Name && player2Name && (
            <Scoreboard
              player1Runs={player1Runs}
              player2Runs={player2Runs}
              target={target}
              player1BallByBall={player1BallByBall}
              player2BallByBall={player2BallByBall}
              player1Name={player1Name}
              player2Name={player2Name}
            />
          )}
        </motion.div>

        {showChoiceReveal && choiceRevealData && (
          <ChoiceReveal
            player1={choiceRevealData.player1}
            player2={choiceRevealData.player2}
            onRevealComplete={handleRevealComplete}
          />
        )}

        {!isGameStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white bg-opacity-10 rounded-lg shadow-lg p-6 text-center"
          >
            <div className="mb-6">
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full mx-2 mb-4 md:mb-0 transition duration-300 ease-in-out transform hover:scale-105 text-xs md:text-sm"
                onClick={createRoom}
              >
                Create Room
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full mx-2 transition duration-300 ease-in-out transform hover:scale-105 text-xs md:text-sm"
                onClick={() => joinRoom(roomCode)}
              >
                Join Room
              </button>
            </div>
            <div className="flex items-center justify-center">
              <input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="border-2 border-white bg-transparent py-2 px-4 rounded-full w-64 text-center text-white placeholder-white text-xs md:text-sm"
              />
              {roomCode && (
                <button
                  onClick={() => shareRoomCode(roomCode)}
                  className="ml-2 text-white hover:text-gray-300"
                >
                  <img src={share_icon} alt="share_icon" className='h-7 w-7 transition duration-300 ease-in-out transform hover:scale-110' />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {isGameStarted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white bg-opacity-10 rounded-lg shadow-lg p-6 text-center"
          >
            {showOutMessage ? (
              <div className="mb-4">
                <h2 className="text-lg md:text-xl font-bold">{outMessage}</h2>
              </div>
            ) : (
              <>
                {!player1Out || !player2Out ? (
                  <div>
                    <h3 className="text-md font-semibold md:text-lg mb-6">
                      {(playerId === battingPlayer)
                        ? `You are batting, ${playerName}!`
                        : `You are bowling, ${playerName}!`}
                    </h3>
                    {inputDisabled ? (
                      <p className="text-sm md:text-base">Waiting for {opponentName}...</p>
                    ) : (
                      <PlayerInput onPlayerInput={handlePlayerInput} disabled={inputDisabled} />
                    )}
                  </div>
                ) : (
                  <div>
                    {gamePhase === 'gameOver' && (
                      <div className="mb-6">
                        <h2 className="text-xl md:text-2xl mb-6">{player2Runs === player1Runs ? "It's a Tie" : (player2Runs > player1Runs ? `${player2Name} Wins!` : `${player1Name} Wins!`)}
                        </h2>
                        {restartRequested ? (
                          restartRequestedBy !== playerId ? (
                            <div>
                              <p className="text-md md:text-lg mb-4">{opponentName} wants to play again. Do you accept?</p>
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full mr-4 transition duration-300 ease-in-out transform hover:scale-105 text-xs md:text-sm"
                                onClick={acceptRestart}
                              >
                                Yes
                              </button>
                              <button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-xs md:text-sm"
                                onClick={rejectRestart}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <p className="text-md md:text-lg">Waiting for {opponentName} to accept...</p>
                          )
                        ) : (
                          <div className="flex justify-center">
                            <button
                              className="bg-gray-100 hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-xs md:text-sm"
                              onClick={requestPlayAgain}
                            >
                              Play Again
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Game;