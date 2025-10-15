import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WordBlock } from './WordBlock';
import { speakWord, speakEncouragement, initSpeech } from '../utils/speech';

interface WordGameProps {
  sentence: string;
  translation: string;
  onBack: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function WordGame({ sentence, translation, onBack, onNext, currentIndex, totalCount }: WordGameProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // 生成干扰词
  const distractorWords = [
    'the', 'is', 'are', 'am', 'was', 'were', 'can', 'will',
    'she', 'he', 'it', 'they', 'we', 'my', 'your', 'his',
    'go', 'come', 'eat', 'drink', 'run', 'walk', 'see', 'look',
    'very', 'much', 'some', 'any', 'many', 'few', 'good', 'bad',
  ];

  useEffect(() => {
    initializeGame();
    initSpeech(); // 初始化语音
  }, [sentence]);

  const initializeGame = () => {
    // 将句子拆分成单词，保留标点
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    // 选择3-5个干扰词（不与正确单词重复）
    const numDistractors = Math.min(5, Math.max(3, Math.floor(words.length * 0.5)));
    const filteredDistractors = distractorWords.filter(d => !words.includes(d));
    const shuffledDistractors = [...filteredDistractors].sort(() => Math.random() - 0.5);
    const selectedDistractors = shuffledDistractors.slice(0, numDistractors);
    
    // 合并并打乱所有单词
    const allWords = [...words, ...selectedDistractors].sort(() => Math.random() - 0.5);
    
    setAvailableWords(allWords);
    setSelectedWords([]);
    setShowFeedback(null);
    setIsComplete(false);
  };

  const handleWordClick = (word: string, index: number) => {
    if (isComplete) return;
    
    // 读出单词
    speakWord(word);
    
    // 将单词从可用列表移到已选列表
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const handleSelectedWordClick = (index: number) => {
    if (isComplete) return;
    
    // 将单词从已选列表移回可用列表
    const word = selectedWords[index];
    setAvailableWords([...availableWords, word]);
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };

  const handleCheck = () => {
    const userSentence = selectedWords.join(' ').toLowerCase();
    const correctSentence = sentence.toLowerCase();
    
    if (userSentence === correctSentence) {
      setShowFeedback('correct');
      setIsComplete(true);
      speakEncouragement('correct');
    } else {
      setShowFeedback('wrong');
      speakEncouragement('wrong');
      setTimeout(() => {
        setShowFeedback(null);
      }, 2000); // 延长显示时间，让语音播放完
    }
  };

  const handleReset = () => {
    initializeGame();
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          重新开始
        </Button>
        {totalCount && totalCount > 1 && (
          <span className="text-sm text-gray-600">
            第 {currentIndex} / {totalCount} 题
          </span>
        )}
        {onNext && isComplete && (
          <Button 
            onClick={onNext}
            className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            下一题 →
          </Button>
        )}
      </div>

      <Card className="p-8 shadow-xl">
        {/* 中文提示 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-lg">
            <Sparkles className="w-5 h-5 inline-block mr-2" />
            <span>{translation}</span>
          </div>
        </div>

        {/* 已选择的单词区域 */}
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-3">你的答案：</p>
          <div className="min-h-[120px] bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-wrap gap-2 items-start">
            <AnimatePresence>
              {selectedWords.map((word, index) => (
                <WordBlock
                  key={`selected-${index}-${word}`}
                  word={word}
                  onClick={() => handleSelectedWordClick(index)}
                  variant="selected"
                />
              ))}
            </AnimatePresence>
            {selectedWords.length === 0 && (
              <p className="text-gray-400 w-full text-center py-8">点击下方单词块来组成句子</p>
            )}
          </div>
        </div>

        {/* 可选择的单词区域 */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">选择单词：</p>
          <div className="min-h-[120px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 flex flex-wrap gap-3 justify-center">
            <AnimatePresence>
              {availableWords.map((word, index) => (
                <WordBlock
                  key={`available-${index}-${word}`}
                  word={word}
                  onClick={() => handleWordClick(word, index)}
                  variant="available"
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 检查按钮 */}
        {selectedWords.length > 0 && !isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button
              onClick={handleCheck}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              size="lg"
            >
              检查答案
            </Button>
          </motion.div>
        )}

        {/* 反馈动画 */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              {showFeedback === 'correct' ? (
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.2, 1.1, 1.2, 1],
                  }}
                  transition={{ duration: 0.6 }}
                  className="bg-green-500 text-white px-12 py-8 rounded-3xl shadow-2xl text-center"
                >
                  <div className="text-6xl mb-2">🎉</div>
                  <div className="text-3xl">太棒了！</div>
                  <div className="text-xl mt-2">答对了！</div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{
                    x: [-10, 10, -10, 10, 0],
                  }}
                  transition={{ duration: 0.4 }}
                  className="bg-orange-500 text-white px-12 py-8 rounded-3xl shadow-2xl text-center"
                >
                  <div className="text-6xl mb-2">🤔</div>
                  <div className="text-2xl">好像哪里不对劲</div>
                  <div className="text-xl mt-2">再重新试试吧！</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 完成后的庆祝效果 */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-4xl mb-4"
              >
                ⭐️✨🌟⭐️✨
              </motion.div>
              <p className="text-gray-600">完成了！点击"重新开始"继续练习</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
