import React, { useState } from 'react';
import { motion } from 'framer-motion';

function PlayerInput({ onPlayerInput, disabled }) {
  const [selectedNumber, setSelectedNumber] = useState(null);

  const handleNumberClick = (number) => {
    setSelectedNumber(number);
    onPlayerInput(number);
  };

  const numbers = [1, 2, 3, 4, 5, 6];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      <h4 className="text-xl mb-4 text-white font-bold">Choose your number:</h4>
      <div className="grid grid-cols-3 gap-4">
        {numbers.map((number) => (
          <motion.button
            key={number}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-4 rounded-lg text-2xl font-bold ${
              disabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            onClick={() => handleNumberClick(number)}
            disabled={disabled}
          >
            {number}
          </motion.button>
        ))}
      </div>
      {selectedNumber && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-lg text-white"
        >
          You selected: {selectedNumber}
        </motion.p>
      )}
    </motion.div>
  );
}

export default PlayerInput;