import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Volume2, RotateCcw, CheckCircle2, Lightbulb, ArrowLeft } from 'lucide-react';
import { speakText } from '../utils/speech';
import { motion, AnimatePresence } from 'motion/react';

interface SpellingGameProps {
  word: string;
  phonetic?: string;
  meaning: string;
  distractors: string[];
  onComplete: () => void;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// 彩虹颜色方案（用于字母块）
const LETTER_COLORS = [
  'bg-red-400 hover:bg-red-500',
  'bg-orange-400 hover:bg-orange-500',
  'bg-yellow-400 hover:bg-yellow-500',
  'bg-green-400 hover:bg-green-500',
  'bg-blue-400 hover:bg-blue-500',
  'bg-purple-400 hover:bg-purple-500',
  'bg-pink-400 hover:bg-pink-500',
];

// 选项颜色
const OPTION_COLORS = [
  'bg-blue-100 hover:bg-blue-200 border-blue-300',
  'bg-green-100 hover:bg-green-200 border-green-300',
  'bg-orange-100 hover:bg-orange-200 border-orange-300',
  'bg-purple-100 hover:bg-purple-200 border-purple-300',
];

export function SpellingGame({ word, phonetic, meaning, distractors, onComplete, onBack, onNext, currentIndex, totalCount }: SpellingGameProps) {
  const [spelledWord, setSpelledWord] = useState<string[]>([]);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // 准备选项（1个正确 + 3个干扰项，随机排序）
  const [options, setOptions] = useState<string[]>([]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  useEffect(() => {
    // 随机排序选项
    const allOptions = [meaning, ...distractors];
    const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setCorrectOptionIndex(shuffled.indexOf(meaning));
  }, [meaning, distractors]);

  // 当题目内容变化时，重置所有状态
  useEffect(() => {
    setSpelledWord([]);
    setSelectedMeaning(null);
    setShowResult(false);
    setIsCorrect(false);
    setShowAnswer(false);
  }, [word, meaning]);

  // 播放单词发音（更慢更清楚）
  const playWordSound = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.6; // 更慢的语速，方便孩子听清每个音节
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // 获取最佳英文语音
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google'))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // 添加字母（允许重复点击同一字母）
  const addLetter = (letter: string) => {
    if (showAnswer) return; // 如果已显示答案，禁止操作
    setSpelledWord([...spelledWord, letter]);
    
    // 播放点击音效
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGGS57OKbSgoKUKXi8LhjHAU2jdXvzIEuBSh+yO3ejj0JGGWy5tycTQoJUqvn7a1aFgxAnNn0xnMpBSh4w+vYjj0JGWiz5tmXSwkHUIzW66NeGQk9lM7tx3UqBSh6yu7dkUAKF2y46+CZTgsFU6vj7atiGgU7ns/wvnMoBSZ3xu3aijkHGGe56uCZTAoEUaXh7bBiGgU6mtD0xnYrBSR1xO3aizYIGGW25tmYSQkGT6nh7a1gGwU6m9L1yHMrBSR3w+vXizkIGWW35tqaSwkFUKXh7a1hGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGUKbh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGgU5mdD0xnYpBSV2w+3YizcHGGS16NqYSwoGT6bh7a1gGg==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  // 删除最后一个字母
  const removeLast = () => {
    if (spelledWord.length === 0 || showAnswer) return; // 如果已显示答案，禁止操作
    setSpelledWord(spelledWord.slice(0, -1));
  };

  // 重新开始
  const restart = () => {
    setSpelledWord([]);
    setSelectedMeaning(null);
    setShowResult(false);
    setIsCorrect(false);
    setShowAnswer(false);
  };

  // 显示正确答案
  const handleShowAnswer = () => {
    setShowAnswer(true);
    setSpelledWord(word.toUpperCase().split(''));
    setSelectedMeaning(correctOptionIndex);
    setShowResult(false);
  };

  // 检查答案
  const checkAnswer = () => {
    if (spelledWord.length === 0 || selectedMeaning === null) return;
    
    const spellingCorrect = spelledWord.join('').toLowerCase() === word.toLowerCase();
    const meaningCorrect = selectedMeaning === correctOptionIndex;
    const bothCorrect = spellingCorrect && meaningCorrect;
    
    setIsCorrect(bothCorrect);
    setShowResult(true);

    if (bothCorrect) {
      // 正确 - 播放成功音效
      speakText('Perfect!');
    } else {
      // 错误 - 播放错误提示
      speakText('Try again!');
    }
  };

  // 检查拼写是否正确
  const isSpellingCorrect = spelledWord.join('').toLowerCase() === word.toLowerCase();
  const isMeaningCorrect = selectedMeaning === correctOptionIndex;

  // 获取错误提示信息
  const getErrorMessage = () => {
    if (showResult && !isCorrect) {
      if (!isSpellingCorrect && !isMeaningCorrect) {
        return '😢 拼写和中文意思都不对哦，再试一次吧！';
      } else if (!isSpellingCorrect) {
        return '😊 中文意思选对了，但是拼写不对哦！';
      } else if (!isMeaningCorrect) {
        return '😊 拼写正确，但是中文意思选错了哦！';
      }
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 p-8">
      <Card className="max-w-4xl mx-auto p-8 shadow-2xl bg-white/95 backdrop-blur">
        {/* 顶部返回按钮 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={onBack || onComplete}
            className="text-gray-600 border-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回题库
          </Button>
          
          {!showAnswer && (
            <Button
              variant="outline"
              onClick={handleShowAnswer}
              className="text-orange-600 border-orange-300"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              显示答案
            </Button>
          )}
          
          {totalCount && totalCount > 1 && (
            <span className="text-sm text-gray-600">
              第 {currentIndex} / {totalCount} 题
            </span>
          )}
          {onNext && isCorrect && (
            <Button 
              onClick={onNext}
              className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              下一题 →
            </Button>
          )}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-pink-600 mb-4">🔤 单词拼写</h2>
          <p className="text-gray-600">听音拼写，并选择正确的中文意思</p>
        </div>

        {/* 播放发音按钮和音标 */}
        <div className="flex flex-col items-center mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={playWordSound}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
          >
            <Volume2 className="w-12 h-12 text-white" />
          </motion.button>
          
          {/* 音标显示 */}
          <div className="mt-4 min-h-[32px] flex items-center justify-center">
            {phonetic ? (
              <div className="px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <span className="text-purple-700 text-xl font-mono">{phonetic}</span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm italic">（未设置音标）</div>
            )}
          </div>
          
          {showAnswer && (
            <div className="mt-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <span className="text-blue-600 font-bold text-xl">{word}</span>
            </div>
          )}
        </div>

        {/* 拼写区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-600">你的拼写：</span>
            {showResult && !isSpellingCorrect && (
              <span className="text-sm text-red-600">(拼写错误)</span>
            )}
            {showResult && isSpellingCorrect && (
              <span className="text-sm text-green-600">✓ (拼写正确)</span>
            )}
            {showAnswer && (
              <span className="text-sm text-blue-600">(正确答案)</span>
            )}
          </div>
          
          <div className="flex justify-center gap-2 mb-4 min-h-[80px]">
            <AnimatePresence>
              {spelledWord.map((letter, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className={`
                    w-16 h-16 rounded-xl shadow-lg flex items-center justify-center
                    text-white transform transition-transform
                    ${showAnswer ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}
                    ${LETTER_COLORS[index % LETTER_COLORS.length]}
                  `}
                  onClick={showAnswer ? undefined : removeLast}
                >
                  <span className="text-2xl font-bold">{letter}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {spelledWord.length > 0 && !showAnswer && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={removeLast}
                className="text-orange-600 border-orange-300"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                删除
              </Button>
            </div>
          )}
        </div>

        {/* 26个字母 */}
        {!showAnswer && (
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-4">点击字母进行拼写：</p>
            <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
              {ALPHABET.map((letter, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addLetter(letter)}
                  className={`
                    w-12 h-12 rounded-lg shadow-md flex items-center justify-center
                    text-white font-bold transition-all
                    ${LETTER_COLORS[index % LETTER_COLORS.length]}
                  `}
                >
                  {letter}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 选择中文意思 */}
        <div className="mb-8">
          <p className="text-center text-gray-600 mb-4">选择正确的中文意思：</p>
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
            {options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: showAnswer ? 1 : 1.05 }}
                whileTap={{ scale: showAnswer ? 1 : 0.95 }}
                onClick={() => !showAnswer && setSelectedMeaning(index)}
                disabled={showAnswer}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center
                  ${selectedMeaning === index 
                    ? 'ring-4 ring-blue-300 border-blue-500 bg-blue-200' 
                    : OPTION_COLORS[index % OPTION_COLORS.length]
                  }
                  ${showResult && index === correctOptionIndex ? 'ring-4 ring-green-400 bg-green-200' : ''}
                  ${showResult && selectedMeaning === index && index !== correctOptionIndex ? 'ring-4 ring-red-400 bg-red-200' : ''}
                  ${showAnswer && index === correctOptionIndex ? 'ring-4 ring-blue-400 bg-blue-200' : ''}
                `}
              >
                <div className="font-bold text-gray-700 mb-1">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="text-gray-800">{option}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 错误提示信息 */}
        {getErrorMessage() && (
          <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg text-center">
            <p className="text-orange-800">{getErrorMessage()}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          {!showResult && !showAnswer && (
            <Button
              onClick={checkAnswer}
              disabled={spelledWord.length === 0 || selectedMeaning === null}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              检查答案
            </Button>
          )}
          
          {showResult && !isCorrect && (
            <Button
              onClick={restart}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新尝试
            </Button>
          )}
          
          {showAnswer && (
            <Button
              onClick={restart}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新尝试
            </Button>
          )}
        </div>

        {/* 结果提示 */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className={`
                text-6xl font-bold p-8 rounded-3xl shadow-2xl
                ${isCorrect 
                  ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white' 
                  : 'bg-gradient-to-r from-red-400 to-orange-400 text-white'
                }
              `}>
                {isCorrect ? '🎉 太棒了！' : '😢 再试一次！'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
