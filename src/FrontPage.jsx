import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import welcome_img from './assets/welcome_img.jpg';
import cricketField from './assets/cricket-field.png';

function FrontPage() {
  const [playerName, setPlayerName] = useState('');
  const [weatherEffect] = useState('cloudy');
  const navigate = useNavigate();

  const handleStartGame = () => {
    if (playerName.trim()) {
      navigate('/game', { state: { playerName } });
    }
  };

  return (
    <div
      className={`min-h-screen bg-cover bg-center flex items-center justify-center px-4 ${weatherEffect}`}
      style={{ backgroundImage: `url(${cricketField})` }}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg shadow-lg p-8 max-w-md w-full text-center"
      >
        <motion.img
          src={welcome_img}
          alt="Hand Cricket"
          className="mx-auto mb-6 w-40 h-40 rounded-full shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.h1
          className="text-4xl font-bold mb-6 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Welcome to Hand Cricket
        </motion.h1>
        <motion.input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full border-2 border-white bg-transparent py-2 px-4 rounded-full mb-6 text-white placeholder-white text-center focus:outline-none focus:ring-2 focus:ring-white"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />
        <motion.button
          onClick={handleStartGame}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Enter Game
        </motion.button>
      </motion.div>
    </div>
  );
}

export default FrontPage;