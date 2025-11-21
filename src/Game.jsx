import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "./supabaseClient";
import PlayerInput from './PlayerInput';
import Scoreboard from './Scoreboard';
import ChoiceReveal from './ChoiceReveal';

import share_icon from './assets/share.png';
import boo_sound from './assets/boo.mp3';
import yay_sound from './assets/yay.mp3';
import crowd_cheer from './assets/crowd-cheer.mp3';

import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import cricketField from './assets/cricket-field.png';
import batsman from './assets/batsman.png';
import bowler from './assets/bowler.png';

function Game() {
  const location = useLocation();
  const playerKaNaam = location.state?.playerName || 'Player';
  const navigate = useNavigate();

  const [player1Runs, setPlayer1Runs] = useState(0);
  const [setPlayer1Out] = useState(false);
  const [player2Runs, setPlayer2Runs] = useState(0);
  const [setPlayer2Out] = useState(false);
  const [battingPlayer, setBattingPlayer] = useState('player1');
  const [setPlayer1Choice] = useState(null);
  const [ setPlayer2Choice] = useState(null);
  const [target, setTarget] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName] = useState(playerKaNaam);
  const [opponentName, setOpponentName] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [setPlayer1Id] = useState("");
  const [setPlayer2Id] = useState("");

  const [outMessage, setOutMessage] = useState('');
  const [showOutMessage, setShowOutMessage] = useState(false);
  const [gamePhase, setGamePhase] = useState('playing');

  const [restartRequested, setRestartRequested] = useState(false);
  const [restartRequestedBy, setRestartRequestedBy] = useState(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  const [player1BallByBall, setPlayer1BallByBall] = useState([]);
  const [player2BallByBall, setPlayer2BallByBall] = useState([]);

  const [showChoiceReveal, setShowChoiceReveal] = useState(false);
  const [choiceRevealData, setChoiceRevealData] = useState(null);
  const [lastBallResult, setLastBallResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const prevStateRef = useRef(null);
  const channelRef = useRef(null);
  const playerIdRef = useRef('');

  // Generate player ID once
  useEffect(() => {
    const player = `player${Math.floor(Math.random() * 10000)}`;
    setPlayerId(player);
    playerIdRef.current = player;
  }, []);

  // Websocket subscription
  useEffect(() => {
    if (!roomCode || !playerIdRef.current) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`game_rooms:${roomCode}:${Date.now()}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'game_rooms', 
        filter: `room_code=eq.${roomCode}` 
      }, payload => {
        if (payload.new) {
          handleGameStateUpdate(payload.new);
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("Subscription error:", err);
          setConnectionStatus('error');
        } else {
          setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode]);

  // Redirect if opponent leaves
  useEffect(() => {
  if (opponentLeft) {
    const timer = setTimeout(() => navigate('/'), 3000);
    return () => clearTimeout(timer);
  }
}, [opponentLeft, navigate, handleGameStateUpdate]);

  // Sound Effects
  const playYay = () => {
    try { new Audio(yay_sound).play().catch(() => {}); } catch(e) { console.log(e); }
  };

  const playBoo = () => {
    try { new Audio(boo_sound).play().catch(() => {}); } catch(e) { console.log(e); }
  };

  const playCrowdCheer = () => {
    try { new Audio(crowd_cheer).play().catch(() => {}); } catch(e) { console.log(e); }
  };

  // Handle game state updates from realtime subscription
  const handleGameStateUpdate = (newState) => {
    const prevState = prevStateRef.current;
    const currentPlayerId = playerIdRef.current;

    // Update all state
    setPlayer1Runs(newState.player1_runs || 0);
    setPlayer2Runs(newState.player2_runs || 0);
    setBattingPlayer(newState.batting_player);
    setPlayer1Out(newState.player1_out || false);
    setPlayer2Out(newState.player2_out || false);
    setTarget(newState.target);
    setPlayer1Choice(newState.player1_choice);
    setPlayer2Choice(newState.player2_choice);
    setGamePhase(newState.game_phase || 'playing');
    setIsGameStarted(true);
    setRestartRequested(newState.restart_requested || false);
    setRestartRequestedBy(newState.restart_requested_by);
    setPlayer1BallByBall(newState.player1_ball_by_ball || []);
    setPlayer2BallByBall(newState.player2_ball_by_ball || []);
    setPlayer1Name(newState.player1_name || 'Player 1');
    setPlayer2Name(newState.player2_name || 'Player 2');
    setPlayer1Id(newState.player1_id || '');
    setPlayer2Id(newState.player2_id || '');

    // Set opponent name
    if (currentPlayerId === newState.player1_id) {
      setOpponentName(newState.player2_name || 'Waiting...');
    } else {
      setOpponentName(newState.player1_name || 'Opponent');
    }

    // Handle choice reveal and sounds when round is processed
    if (newState.last_batting_choice !== null && newState.last_bowling_choice !== null) {
      const wasOut = newState.last_batting_choice === newState.last_bowling_choice;
      const isBattingPlayer1 = newState.player1_id === (prevState?.batting_player || newState.batting_player);
      
      setChoiceRevealData({
        player1: {
          choice: isBattingPlayer1 ? newState.last_batting_choice : newState.last_bowling_choice,
          isBatting: isBattingPlayer1
        },
        player2: {
          choice: !isBattingPlayer1 ? newState.last_batting_choice : newState.last_bowling_choice,
          isBatting: !isBattingPlayer1
        }
      });
      
      setShowChoiceReveal(true);

      if (wasOut) {
        setLastBallResult('OUT');
        playBoo();
      } else {
        setLastBallResult(newState.last_batting_choice);
        if (newState.last_batting_choice === 6) playYay();
      }

      // Clear last choices after animation
      setTimeout(async () => {
        await supabase.from('game_rooms').update({
          last_batting_choice: null,
          last_bowling_choice: null
        }).eq('room_code', roomCode);
        setLastBallResult(null);
        setShowChoiceReveal(false);
      }, 2000);
    }

    // Re-enable input when choices are null
    if (newState.player1_choice === null && newState.player2_choice === null) {
      setInputDisabled(false);
    }

    // Handle opponent leaving
    if (newState.player_left && newState.player_left !== currentPlayerId) {
      setOpponentLeft(true);
    }

    // Handle restart accepted
    if (newState.restart_accepted) {
      resetLocalState();
      supabase.from('game_rooms').update({ restart_accepted: false }).eq('room_code', roomCode);
    }

    // Handle out message display
    if (newState.game_phase === 'out' && newState.out_message) {
      setOutMessage(newState.out_message);
      setShowOutMessage(true);
      
      // After showing out message, transition to second innings
      setTimeout(async () => {
        setShowOutMessage(false);
        setInputDisabled(false);
        
        // Reset the out flags for second innings and change phase to playing
        await supabase.from('game_rooms').update({
          out_message: '',
          game_phase: 'playing',
          // Don't reset player1_out/player2_out - we need to track who batted first
        }).eq('room_code', roomCode);
      }, 3500);
    } else if (newState.game_phase === 'gameOver') {
      if (prevState?.game_phase !== 'gameOver') {
        playCrowdCheer();
      }
      setShowOutMessage(false);
    } else if (newState.game_phase === 'playing') {
      setShowOutMessage(false);
    }

    prevStateRef.current = newState;
  };

  const resetLocalState = () => {
    setPlayer1Runs(0);
    setPlayer2Runs(0);
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
    setLastBallResult(null);
    setShowChoiceReveal(false);
    setChoiceRevealData(null);
  };

  // Create Room
  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const currentPlayerId = playerIdRef.current;
    
    const { error } = await supabase.from('game_rooms').insert([{
      room_code: code,
      player1_id: currentPlayerId,
      player1_name: playerName,
      player1_runs: 0,
      player2_runs: 0,
      batting_player: currentPlayerId,
      player1_out: false,
      player2_out: false,
      target: null,
      player1_choice: null,
      player2_choice: null,
      game_phase: 'playing',
      player1_ball_by_ball: [],
      player2_ball_by_ball: [],
      last_batting_choice: null,
      last_bowling_choice: null
    }]);

    if (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
      return;
    }

    setPlayer1Name(playerName);
    setPlayer1Id(currentPlayerId);
    setRoomCode(code);
  };

  // Join Room
  const joinRoom = async (code) => {
    if (!code || code.length < 6) {
      alert('Please enter a valid room code');
      return;
    }

    const upperCode = code.toUpperCase();
    const currentPlayerId = playerIdRef.current;
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', upperCode)
      .single();

    if (error || !data) {
      console.error('Room not found:', error);
      alert('Room not found. Please check the code and try again.');
      return;
    }

    if (!data.player2_id) {
      const randomBattingPlayer = Math.random() < 0.5 ? data.player1_id : currentPlayerId;
      await supabase.from('game_rooms').update({
        player2_id: currentPlayerId,
        player2_name: playerName,
        batting_player: randomBattingPlayer
      }).eq('room_code', upperCode);
      
      setOpponentName(data.player1_name);
      setPlayer1Name(data.player1_name);
      setPlayer1Id(data.player1_id);
      setPlayer2Name(playerName);
      setPlayer2Id(currentPlayerId);
      setBattingPlayer(randomBattingPlayer);
    } else if (data.player2_id === currentPlayerId || data.player1_id === currentPlayerId) {
      handleGameStateUpdate(data);
    } else {
      alert('Room is full!');
      return;
    }

    setRoomCode(upperCode);
    setIsGameStarted(true);
  };

  // Main game logic - submit choice and process round
  const handlePlayerInput = async (choice) => {
    setInputDisabled(true);
    const currentPlayerId = playerIdRef.current;

    try {
      // First try RPC
      const { data, error: rpcError } = await supabase.rpc('process_game_round', {
        p_room_code: roomCode,
        p_player_id: currentPlayerId,
        p_choice: choice
      });

      if (rpcError) {
        console.log('RPC error, using fallback:', rpcError.message);
        await fallbackHandleInput(choice, currentPlayerId);
      } else {
        console.log('RPC result:', data);
        // If RPC returned waiting status, keep input disabled
        // State will update via realtime subscription
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      await fallbackHandleInput(choice, currentPlayerId);
    }
  };

  // Fallback if RPC doesn't exist or fails
  const fallbackHandleInput = async (choice, currentPlayerId) => {
    try {
      // Fetch latest game state
      const { data: gameData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (fetchError || !gameData) {
        console.error('Error fetching game:', fetchError);
        setInputDisabled(false);
        return;
      }

      const isPlayer1 = currentPlayerId === gameData.player1_id;
      const myChoiceField = isPlayer1 ? 'player1_choice' : 'player2_choice';
      const otherChoiceField = isPlayer1 ? 'player2_choice' : 'player1_choice';
      const otherChoice = gameData[otherChoiceField];

      console.log('Fallback - My choice:', choice, 'Other choice:', otherChoice, 'Is Player 1:', isPlayer1);

      // Update this player's choice
      const { error: updateError } = await supabase.from('game_rooms')
        .update({ [myChoiceField]: choice })
        .eq('room_code', roomCode);

      if (updateError) {
        console.error('Error updating choice:', updateError);
        setInputDisabled(false);
        return;
      }

      // If other player already made a choice, process the round
      if (otherChoice !== null) {
        console.log('Both players have chosen, processing round...');
        await processRoundLocally(gameData, choice, isPlayer1);
      } else {
        console.log('Waiting for other player...');
        // Don't re-enable input, wait for realtime update
      }
    } catch (err) {
      console.error('Fallback error:', err);
      setInputDisabled(false);
    }
  };

  const processRoundLocally = async (gameData, myChoice, isPlayer1) => {
    try {
      const otherChoice = isPlayer1 ? gameData.player2_choice : gameData.player1_choice;
      const wasBattingPlayer1 = gameData.batting_player === gameData.player1_id;
      
      let battingChoice, bowlingChoice;
      
      if (wasBattingPlayer1) {
        battingChoice = isPlayer1 ? myChoice : otherChoice;
        bowlingChoice = isPlayer1 ? otherChoice : myChoice;
      } else {
        battingChoice = isPlayer1 ? otherChoice : myChoice;
        bowlingChoice = isPlayer1 ? myChoice : otherChoice;
      }

      const isOut = battingChoice === bowlingChoice;
      
      console.log('Processing round - Batting:', battingChoice, 'Bowling:', bowlingChoice, 'Out:', isOut);
      
      // Helper to safely get array (handles both JSONB and TEXT[] from Supabase)
      const getArray = (arr) => {
        if (!arr) return [];
        if (Array.isArray(arr)) return arr;
        // If it's a string (possibly JSON), try to parse
        if (typeof arr === 'string') {
          try { return JSON.parse(arr); } catch { return []; }
        }
        return [];
      };
      
      const updates = {
        last_batting_choice: battingChoice,
        last_bowling_choice: bowlingChoice,
        player1_choice: null,
        player2_choice: null,
        game_phase: 'playing'
      };

      if (wasBattingPlayer1) {
        // Player 1 was batting
        const currentBalls = getArray(gameData.player1_ball_by_ball);
        
        if (isOut) {
          updates.player1_ball_by_ball = [...currentBalls, 'W'];
          updates.player1_out = true;
          
          if (!gameData.target) {
            updates.target = gameData.player1_runs + 1;
            updates.batting_player = gameData.player2_id;
            updates.game_phase = 'out';
            updates.out_message = `${gameData.player1_name} is OUT! Target: ${gameData.player1_runs + 1} runs`;
          } else {
            updates.game_phase = 'gameOver';
            updates.out_message = `${gameData.player1_name} is OUT! ${gameData.player2_name} Wins!`;
          }
        } else {
          const newRuns = gameData.player1_runs + battingChoice;
          updates.player1_ball_by_ball = [...currentBalls, battingChoice];
          updates.player1_runs = newRuns;
          
          if (gameData.target && newRuns >= gameData.target) {
            updates.game_phase = 'gameOver';
            updates.out_message = `${gameData.player1_name} Wins!`;
          }
        }
      } else {
        // Player 2 was batting
        const currentBalls = getArray(gameData.player2_ball_by_ball);
        
        if (isOut) {
          updates.player2_ball_by_ball = [...currentBalls, 'W'];
          updates.player2_out = true;
          
          if (!gameData.target) {
            updates.target = gameData.player2_runs + 1;
            updates.batting_player = gameData.player1_id;
            updates.game_phase = 'out';
            updates.out_message = `${gameData.player2_name} is OUT! Target: ${gameData.player2_runs + 1} runs`;
          } else {
            updates.game_phase = 'gameOver';
            updates.out_message = `${gameData.player2_name} is OUT! ${gameData.player1_name} Wins!`;
          }
        } else {
          const newRuns = gameData.player2_runs + battingChoice;
          updates.player2_ball_by_ball = [...currentBalls, battingChoice];
          updates.player2_runs = newRuns;
          
          if (gameData.target && newRuns >= gameData.target) {
            updates.game_phase = 'gameOver';
            updates.out_message = `${gameData.player2_name} Wins!`;
          }
        }
      }

      console.log('Updating game with:', updates);
      
      const { error } = await supabase.from('game_rooms').update(updates).eq('room_code', roomCode);
      
      if (error) {
        console.error('Error updating game:', error);
        setInputDisabled(false);
      }
    } catch (err) {
      console.error('Process round error:', err);
      setInputDisabled(false);
    }
  };

  const handleRevealComplete = () => {
    setShowChoiceReveal(false);
  };

  // Restart game
  const acceptRestart = async () => {
    const { data: gameData } = await supabase
      .from('game_rooms')
      .select('player1_id, player2_id')
      .eq('room_code', roomCode)
      .single();

    if (!gameData) return;

    const randomBatting = Math.random() < 0.5 ? gameData.player1_id : gameData.player2_id;
    
    // Reset with proper empty arrays for TEXT[] columns
    const { error } = await supabase.from('game_rooms').update({
      player1_runs: 0,
      player2_runs: 0,
      batting_player: randomBatting,
      player1_out: false,
      player2_out: false,
      target: null,
      player1_choice: null,
      player2_choice: null,
      game_phase: 'playing',
      out_message: '',
      restart_requested: false,
      restart_requested_by: null,
      restart_accepted: true,
      player1_ball_by_ball: [],
      player2_ball_by_ball: [],
      last_batting_choice: null,
      last_bowling_choice: null
    }).eq('room_code', roomCode);

    if (error) {
      console.error('Error restarting game:', error);
    }

    resetLocalState();
  };

  const rejectRestart = async () => {
    await supabase.from('game_rooms').update({
      restart_requested: false,
      restart_requested_by: null,
      player_left: playerIdRef.current
    }).eq('room_code', roomCode);
    navigate('/');
  };

  const requestPlayAgain = async () => {
    await supabase.from('game_rooms').update({
      restart_requested: true,
      restart_requested_by: playerIdRef.current
    }).eq('room_code', roomCode);
  };

  const shareRoomCode = (code) => {
    if (navigator.share) {
      navigator.share({
        title: 'Hand Cricket Game',
        text: `Join my Hand Cricket game! Room Code: ${code}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(code)
        .then(() => alert('Room code copied!'))
        .catch(() => {});
    }
  };

  const isPlayerBatting = playerId === battingPlayer;
  const currentRole = isPlayerBatting ? 'BATTING' : 'BOWLING';

  return (
    <div 
      className="min-h-screen bg-cover bg-center text-white py-4 px-4 md:py-8 md:px-8 relative overflow-hidden" 
      style={{ backgroundImage: `url(${cricketField})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-4 md:p-6 mb-6 border border-white/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 mb-1">
                ⚡ Hand Cricket ⚡
              </h1>
              <p className="text-sm md:text-base text-gray-300">
                Welcome, <span className="font-semibold text-yellow-300">{playerKaNaam}</span>!
              </p>
            </div>
            
            {isGameStarted && (
              <div className="bg-white/10 px-4 py-2 rounded-full border border-white/30">
                <p className="text-xs md:text-sm font-semibold">
                  You are <span className={`${isPlayerBatting ? 'text-green-400' : 'text-red-400'} text-lg`}>
                    {currentRole}
                  </span>
                </p>
              </div>
            )}
          </div>

          {player1Name && player2Name && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-4"
            >
              <Scoreboard
                player1Runs={player1Runs}
                player2Runs={player2Runs}
                target={target}
                player1BallByBall={player1BallByBall}
                player2BallByBall={player2BallByBall}
                player1Name={player1Name}
                player2Name={player2Name}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Last Ball Result Animation */}
        <AnimatePresence>
          {lastBallResult !== null && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className={`text-8xl md:text-9xl font-bold ${
                lastBallResult === 'OUT' 
                  ? 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
                  : lastBallResult === 6 
                    ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]'
                    : 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]'
              }`}>
                {lastBallResult === 'OUT' ? '❌ OUT!' : `${lastBallResult} 🏏`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choice Reveal */}
        {showChoiceReveal && choiceRevealData && (
          <ChoiceReveal
            player1={choiceRevealData.player1}
            player2={choiceRevealData.player2}
            onRevealComplete={handleRevealComplete}
          />
        )}

        {/* Room Creation/Joining */}
        {!isGameStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 text-center border border-white/20"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-yellow-300">Let's Play!</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 text-sm md:text-base"
                onClick={createRoom}
              >
                🎮 Create New Game
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 text-sm md:text-base"
                onClick={() => joinRoom(roomCode)}
              >
                🚪 Join Game
              </motion.button>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="border-2 border-white/40 bg-white/10 backdrop-blur-sm py-3 px-6 rounded-full w-full max-w-xs text-center text-white placeholder-gray-300 text-sm md:text-base focus:outline-none focus:border-yellow-400 transition-all"
              />
              {roomCode && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => shareRoomCode(roomCode)}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
                >
                  <img src={share_icon} alt="Share" className="h-6 w-6" />
                </motion.button>
              )}
            </div>
            
            {roomCode && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-gray-300"
              >
                Share this code: <span className="font-bold text-yellow-300 text-lg">{roomCode}</span>
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Game In Progress */}
        {isGameStarted && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-900/80 to-indigo-900/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 text-center border border-white/20"
          >
            {/* Out Message Display */}
            <AnimatePresence>
              {showOutMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  className="mb-6 bg-red-500/90 backdrop-blur-sm p-6 rounded-xl border-4 border-yellow-400 shadow-2xl"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {outMessage}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Playing State */}
            {!showOutMessage && gamePhase === 'playing' && (
              <div className="space-y-6">
                <div className="flex justify-center items-center">
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      rotate: isPlayerBatting ? [0, 5, -5, 0] : [0, -5, 5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="relative"
                  >
                    <img
                      src={isPlayerBatting ? batsman : bowler}
                      alt={isPlayerBatting ? "Batsman" : "Bowler"}
                      className="w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400/50 rounded-full w-24 h-4 blur-sm"
                    />
                  </motion.div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-lg md:text-xl font-semibold">
                    {inputDisabled ? (
                      <>
                        <span className="inline-block animate-pulse">⏳</span> Waiting for {opponentName}...
                      </>
                    ) : (
                      isPlayerBatting 
                        ? <span className="text-green-400">🏏 Your turn to BAT!</span>
                        : <span className="text-red-400">⚾ Your turn to BOWL!</span>
                    )}
                  </p>
                  {target && (
                    <motion.p
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="mt-2 text-yellow-300 font-bold text-base md:text-lg"
                    >
                      🎯 Target: {target} runs
                    </motion.p>
                  )}
                </div>

                {!inputDisabled && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PlayerInput onPlayerInput={handlePlayerInput} disabled={inputDisabled} />
                  </motion.div>
                )}
              </div>
            )}

            {/* Game Over State */}
            {gamePhase === 'gameOver' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 md:p-8 rounded-2xl shadow-2xl border-4 border-white"
                >
                  <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
                    🏆 GAME OVER! 🏆
                  </h2>
                  <p className="text-xl md:text-3xl font-semibold text-gray-900">
                    {player1Runs === player2Runs 
                      ? "🤝 It's a Tie!" 
                      : player1Runs > player2Runs 
                        ? `🎉 ${player1Name} Wins!` 
                        : `🎉 ${player2Name} Wins!`}
                  </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/30 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                    <p className="text-sm text-gray-300 mb-1">{player1Name}</p>
                    <p className="text-3xl md:text-4xl font-bold">{player1Runs}</p>
                  </div>
                  <div className="bg-purple-500/30 backdrop-blur-sm p-4 rounded-xl border border-white/30">
                    <p className="text-sm text-gray-300 mb-1">{player2Name}</p>
                    <p className="text-3xl md:text-4xl font-bold">{player2Runs}</p>
                  </div>
                </div>

                {restartRequested ? (
                  restartRequestedBy !== playerId ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                    >
                      <p className="text-lg md:text-xl mb-4 font-semibold">
                        🔄 {opponentName} wants a rematch!
                      </p>
                      <div className="flex gap-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
                          onClick={acceptRestart}
                        >
                          ✅ Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300"
                          onClick={rejectRestart}
                        >
                          ❌ Decline
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                    >
                      <p className="text-lg md:text-xl">⏳ Waiting for {opponentName} to respond...</p>
                    </motion.div>
                  )
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-10 rounded-full shadow-2xl transition duration-300 text-lg"
                    onClick={requestPlayAgain}
                  >
                    🔄 Play Again
                  </motion.button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg"
          >
            ⚠️ {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection issue'}
          </motion.div>
        )}

        {/* Opponent Left */}
        {opponentLeft && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
          >
            <div className="bg-white text-gray-900 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4">
              <h2 className="text-2xl font-bold mb-4">😢 Opponent Left</h2>
              <p className="mb-4">Your opponent has left the game.</p>
              <p className="text-sm text-gray-600">Redirecting to home...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Game;