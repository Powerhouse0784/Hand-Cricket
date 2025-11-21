import React from 'react';
import { motion } from 'framer-motion';
import BallByBallScorecard from './BallByBallScorecard';

function Scoreboard({ player1Runs, player2Runs, target, player1BallByBall, player2BallByBall, player1Name, player2Name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 md:p-6 mt-4 md:mt-6 shadow-lg"
    >
      <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">Scoreboard</h2>
      <div className="flex justify-between items-center mb-4">
        <div className="text-center bg-green-500 rounded-lg p-3 w-2/5">
          <p className="text-sm md:text-base font-semibold text-white">{player1Name}</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{player1Runs}</p>
        </div>
        <div className="text-center bg-green-500 rounded-lg p-3 w-2/5">
          <p className="text-sm md:text-base font-semibold text-white">{player2Name}</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{player2Runs}</p>
        </div>
      </div>
      <BallByBallScorecard
        player1BallByBall={player1BallByBall}
        player2BallByBall={player2BallByBall}
        player1Name={player1Name}
        player2Name={player2Name}
      />
      {target && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-center bg-purple-500 rounded-lg p-3"
        >
          <p className="text-sm md:text-base font-semibold text-white">Target</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{target}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default Scoreboard;