import React from 'react';
import { motion } from 'framer-motion';

function BallByBallScorecard({ player1BallByBall, player2BallByBall }) {
  const renderBallByBall = (scores) => {
    return scores.map((score, index) => (
      <motion.span
        key={index}
        className={`w-6 h-6 md:w-7 md:h-7 rounded-full mr-1 mb-1 md:mr-2 md:mb-2 text-xs md:text-sm font-bold flex items-center justify-center ${
          score === 'W' ? 'bg-red-500' : 'bg-green-500'
        }`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        {score}
      </motion.span>
    ));
  };

  return (
    <div className="mt-4 md:mt-5 bg-white bg-opacity-20 rounded-lg p-3 md:p-4 flex">
      <div className="w-1/2 pr-2 md:pr-3 border-r border-gray-300">
        <div className="flex flex-wrap">{renderBallByBall(player1BallByBall)}</div>
      </div>
      <div className="w-1/2 pl-2 md:pl-3">
        <div className="flex flex-wrap">{renderBallByBall(player2BallByBall)}</div>
      </div>
    </div>
  );
}

export default BallByBallScorecard;