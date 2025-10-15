import React from 'react';
import { motion } from 'motion/react';

interface WordBlockProps {
  word: string;
  onClick: () => void;
  variant: 'available' | 'selected';
}

export function WordBlock({ word, onClick, variant }: WordBlockProps) {
  const colors = [
    'from-red-400 to-red-500',
    'from-blue-400 to-blue-500',
    'from-green-400 to-green-500',
    'from-yellow-400 to-yellow-500',
    'from-purple-400 to-purple-500',
    'from-pink-400 to-pink-500',
    'from-indigo-400 to-indigo-500',
    'from-orange-400 to-orange-500',
  ];

  // 根据单词生成一致的颜色
  const colorIndex = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1, rotate: variant === 'available' ? 5 : -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        bg-gradient-to-br ${colorClass}
        text-white px-6 py-3 rounded-xl shadow-lg
        cursor-pointer select-none
        transform transition-all
        hover:shadow-xl
        ${variant === 'selected' ? 'ring-2 ring-white ring-offset-2' : ''}
      `}
    >
      <span className="drop-shadow-sm">{word}</span>
    </motion.button>
  );
}
