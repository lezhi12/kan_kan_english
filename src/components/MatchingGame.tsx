import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, Volume2, PartyPopper, X } from 'lucide-react';
import { speakWord, playCelebration, playError } from '../utils/speech';
import { motion, AnimatePresence } from 'motion/react';

interface MatchingGameProps {
  words: string[];
  wordTranslations: string[];
  onBack: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

interface Match {
  englishIndex: number;
  chineseIndex: number;
}

export function MatchingGame({ words, wordTranslations, onBack, onNext, currentIndex, totalCount }: MatchingGameProps) {
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [shuffledChinese, setShuffledChinese] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [wrongPairs, setWrongPairs] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  // 初始化：打乱中文顺序
  useEffect(() => {
    const indices = Array.from({ length: wordTranslations.length }, (_, i) => i);
    
    // Fisher-Yates 洗牌算法，确保不在同一行
    let shuffled: number[];
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      shuffled = [...indices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      attempts++;
    } while (
      attempts < maxAttempts &&
      shuffled.some((idx, pos) => idx === pos) &&
      shuffled.length > 1
    );
    
    setShuffledChinese(shuffled.map(i => wordTranslations[i]));
  }, [wordTranslations]);

  const handleEnglishClick = (index: number) => {
    // 如果已经匹配过，不允许再次点击
    if (matches.some(m => m.englishIndex === index)) {
      return;
    }

    // 朗读单词
    speakWord(words[index]);

    if (selectedEnglish === index) {
      setSelectedEnglish(null);
    } else {
      setSelectedEnglish(index);
    }
  };

  const handleChineseClick = (displayIndex: number) => {
    if (selectedEnglish === null) return;

    // 如果已经匹配过，不允许再次点击
    if (matches.some(m => m.chineseIndex === displayIndex)) {
      return;
    }

    // 找到这个显示位置对应的原始索引
    const originalIndex = wordTranslations.indexOf(shuffledChinese[displayIndex]);

    // 检查是否匹配正确
    if (selectedEnglish === originalIndex) {
      // 正确匹配
      const newMatches = [...matches, { englishIndex: selectedEnglish, chineseIndex: displayIndex }];
      setMatches(newMatches);
      setSelectedEnglish(null);
      playCelebration();

      // 检查是否全部完成
      if (newMatches.length === words.length) {
        setIsComplete(true);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } else {
      // 错误匹配
      playError();
      const pairKey = `${selectedEnglish}-${displayIndex}`;
      setWrongPairs(prev => new Set(prev).add(pairKey));
      
      // 1秒后清除错误标记
      setTimeout(() => {
        setWrongPairs(prev => {
          const newSet = new Set(prev);
          newSet.delete(pairKey);
          return newSet;
        });
      }, 1000);

      setSelectedEnglish(null);
    }
  };

  const handleReset = () => {
    setMatches([]);
    setSelectedEnglish(null);
    setWrongPairs(new Set());
    setIsComplete(false);
    
    // 重新打乱中文顺序
    const indices = Array.from({ length: wordTranslations.length }, (_, i) => i);
    let shuffled: number[];
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      shuffled = [...indices];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      attempts++;
    } while (
      attempts < maxAttempts &&
      shuffled.some((idx, pos) => idx === pos) &&
      shuffled.length > 1
    );
    
    setShuffledChinese(shuffled.map(i => wordTranslations[i]));
  };

  const isEnglishMatched = (index: number) => matches.some(m => m.englishIndex === index);
  const isChineseMatched = (index: number) => matches.some(m => m.chineseIndex === index);
  const isWrongPair = (englishIdx: number, chineseIdx: number) => 
    wrongPairs.has(`${englishIdx}-${chineseIdx}`);

  const progress = (matches.length / words.length) * 100;

  return (
    <div className="max-w-5xl mx-auto">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          {totalCount && totalCount > 1 && (
            <span className="text-sm text-gray-600">
              第 {currentIndex} / {totalCount} 题
            </span>
          )}
        </div>
        <div className="flex-1 mx-8">
          <div className="bg-white rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-green-600 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-center mt-2 text-sm text-gray-600">
            已完成: {matches.length} / {words.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleReset} variant="outline">
            重新开始
          </Button>
          {onNext && isComplete && (
            <Button 
              onClick={onNext}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              下一题 →
            </Button>
          )}
        </div>
      </div>

      {/* 提示文字 */}
      <Card className="p-6 mb-6 bg-white/80 backdrop-blur">
        <p className="text-center text-gray-700">
          👆 点击左侧英文单词，再点击右侧对应的中文翻译进行连线匹配
        </p>
      </Card>

      {/* 连线区域 */}
      <div className="grid grid-cols-2 gap-8">
        {/* 左侧：英文单词 */}
        <div className="space-y-3">
          {words.map((word, index) => {
            const matched = isEnglishMatched(index);
            const selected = selectedEnglish === index;
            const isWrong = selectedEnglish === index && 
              Array.from(wrongPairs).some(pair => pair.startsWith(`${index}-`));

            return (
              <motion.div
                key={index}
                whileHover={!matched ? { scale: 1.02 } : {}}
                whileTap={!matched ? { scale: 0.98 } : {}}
              >
                <Card
                  className={`
                    p-4 cursor-pointer transition-all
                    ${matched ? 'bg-green-100 border-green-400 opacity-60' : 'bg-white hover:shadow-lg'}
                    ${selected ? 'ring-4 ring-blue-400 shadow-lg' : ''}
                    ${isWrong ? 'ring-4 ring-red-400 animate-shake' : ''}
                  `}
                  onClick={() => handleEnglishClick(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${matched ? 'line-through' : ''}`}>
                      {word}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(word);
                      }}
                      className="ml-2"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {matched && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 text-sm text-green-600"
                    >
                      ✓ 已匹配
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* 右侧：中文翻译 */}
        <div className="space-y-3">
          {shuffledChinese.map((translation, displayIndex) => {
            const matched = isChineseMatched(displayIndex);
            const isWrong = selectedEnglish !== null && 
              isWrongPair(selectedEnglish, displayIndex);

            return (
              <motion.div
                key={displayIndex}
                whileHover={!matched ? { scale: 1.02 } : {}}
                whileTap={!matched ? { scale: 0.98 } : {}}
              >
                <Card
                  className={`
                    p-4 cursor-pointer transition-all
                    ${matched ? 'bg-green-100 border-green-400 opacity-60' : 'bg-white hover:shadow-lg'}
                    ${selectedEnglish !== null && !matched ? 'ring-2 ring-purple-300' : ''}
                    ${isWrong ? 'ring-4 ring-red-400 animate-shake' : ''}
                  `}
                  onClick={() => handleChineseClick(displayIndex)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${matched ? 'line-through' : ''}`}>
                      {translation}
                    </span>
                    {matched && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-green-600"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 完成庆祝动画 */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white rounded-3xl p-12 shadow-2xl">
              <div className="flex items-center gap-4">
                <PartyPopper className="w-16 h-16 animate-bounce" />
                <div>
                  <h2 className="text-4xl mb-2">太棒了！</h2>
                  <p className="text-xl">全部匹配正确！🎉</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
