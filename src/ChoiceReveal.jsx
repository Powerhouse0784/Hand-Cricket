import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import bat_icon from './assets/bat-icon.png';
import ball_icon from './assets/ball-icon.png';

const ChoiceReveal = ({ player1, player2, onRevealComplete }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            onRevealComplete();
        }, 1500);

        return () => clearTimeout(timer);
    }, [onRevealComplete]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg shadow-lg p-6 w-full max-w-2xl flex">
                        <PlayerChoice player={player1} variants={itemVariants} />
                        <PlayerChoice player={player2} variants={itemVariants} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const PlayerChoice = ({ player, variants }) => (
    <motion.div
        className="w-1/2 p-4 flex flex-col items-center"
        variants={variants}
    >
        <motion.div
            className="bg-green-500 rounded-full p-4 mb-4"
            variants={variants}
        >
            <motion.img
                src={player.isBatting ? bat_icon : ball_icon}
                alt={player.isBatting ? "Bat" : "Ball"}
                className="w-16 h-16"
                variants={variants}
            />
        </motion.div>
        <motion.h3
            className="text-2xl font-bold mb-2 text-white"
            variants={variants}
        >
            {player.isBatting ? "Batting" : "Bowling"}
        </motion.h3>
        <motion.p
            className="text-4xl font-bold text-green-400"
            variants={variants}
        >
            {player.choice}
        </motion.p>
    </motion.div>
);

export default ChoiceReveal;