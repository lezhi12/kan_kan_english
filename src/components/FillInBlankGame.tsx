import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckCircle2, RotateCcw, ArrowLeft, Lightbulb } from 'lucide-react';
import { speakText } from '../utils/speech';
import { motion, AnimatePresence } from 'motion/react';

interface FillInBlankGameProps {
  sentence: string; // 带 ___ 标记的句子，如 "I ___ to school every day"
  blanks: string[]; // 正确答案数组，如 ["go"]
  translation: string;
  onComplete: () => void;
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function FillInBlankGame({ sentence, blanks, translation, onComplete, onBack, onNext, currentIndex, totalCount }: FillInBlankGameProps) {
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sentenceParts, setSentenceParts] = useState<string[]>([]);
  const [blankCount, setBlankCount] = useState(0);

  useEffect(() => {
    // 解析句子，分割成文本部分和空白部分
    const parts = sentence.split(/___+/);
    setSentenceParts(parts);
    setBlankCount(parts.length - 1);
    setUserAnswers(new Array(parts.length - 1).fill(''));
  }, [sentence]);

  const handleInputChange = (index: number, value: string) => {
    if (showAnswer) return;
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const checkAnswer = () => {
    if (userAnswers.some(answer => !answer.trim())) {
      return; // 有空白未填写
    }

    // 检查所有答案是否正确（不区分大小写）
    const allCorrect = userAnswers.every((answer, index) => 
      answer.trim().toLowerCase() === blanks[index]?.toLowerCase()
    );

    setIsCorrect(allCorrect);
    setShowResult(true);

    if (allCorrect) {
      speakText('Perfect!');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      speakText('Try again!');
    }
  };

  const restart = () => {
    setUserAnswers(new Array(blankCount).fill(''));
    setShowResult(false);
    setIsCorrect(false);
    setShowAnswer(false);
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setUserAnswers([...blanks]);
    setShowResult(false);
  };

  // 获取每个空白的状态（正确、错误、未填写）
  const getBlankStatus = (index: number): 'correct' | 'incorrect' | 'neutral' => {
    if (!showResult && !showAnswer) return 'neutral';
    if (showAnswer) return 'correct';
    if (userAnswers[index]?.trim().toLowerCase() === blanks[index]?.toLowerCase()) {
      return 'correct';
    }
    return 'incorrect';
  };

  // 获取错误提示信息
  const getErrorMessage = () => {
    if (showResult && !isCorrect) {
      const incorrectCount = userAnswers.filter((answer, index) => 
        answer.trim().toLowerCase() !== blanks[index]?.toLowerCase()
      ).length;
      
      if (incorrectCount === blankCount) {
        return '😢 所有空都填错了，再仔细想想吧！';
      } else {
        return `😊 还有 ${incorrectCount} 个空填错了，再试一次！`;
      }
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
      <Card className="max-w-4xl mx-auto p-8 shadow-2xl bg-white/95 backdrop-blur">
        {/* 顶部按钮 */}
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

        {/* 标题 */}
        <div className="text-center mb-8">
          <h2 className="text-blue-600 mb-4">📝 填空题</h2>
          <p className="text-gray-600">{translation}</p>
        </div>

        {/* 填空句子 */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex flex-wrap items-center justify-center gap-2 text-2xl">
              {sentenceParts.map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-800">{part}</span>
                  {index < sentenceParts.length - 1 && (
                    <div className="relative">
                      <Input
                        value={userAnswers[index] || ''}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        disabled={showAnswer}
                        className={`
                          w-32 h-12 text-center text-xl font-bold
                          ${getBlankStatus(index) === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                          ${getBlankStatus(index) === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : ''}
                          ${getBlankStatus(index) === 'neutral' ? 'border-blue-300 bg-white' : ''}
                        `}
                        placeholder="___"
                      />
                      {showResult && getBlankStatus(index) === 'correct' && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                      {showResult && getBlankStatus(index) === 'incorrect' && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✗</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 正确答案提示 */}
        {showResult && !isCorrect && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">正确答案：</p>
            <div className="flex flex-wrap gap-2">
              {blanks.map((blank, index) => (
                <span key={index} className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full font-bold">
                  第{index + 1}空: {blank}
                </span>
              ))}
            </div>
          </div>
        )}

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
              disabled={userAnswers.some(answer => !answer.trim())}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              检查答案
            </Button>
          )}
          
          {(showResult && !isCorrect) || showAnswer ? (
            <Button
              onClick={restart}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新尝试
            </Button>
          ) : null}
        </div>

        {/* 结果提示动画 */}
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
