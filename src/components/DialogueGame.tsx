import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, RotateCcw, Volume2, Lightbulb } from 'lucide-react';
import { speakText } from '../utils/speech';
import { WordBlock } from './WordBlock';
import { motion, AnimatePresence } from 'motion/react';

interface DialogueGameProps {
  question: string; // 问题
  answer: string; // 回答
  translation: string; // 中文翻译
  showQuestion: boolean; // true: 显示问题让孩子拼回答，false: 显示回答让孩子拼问题
  onBack?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function DialogueGame({ 
  question, 
  answer, 
  translation, 
  showQuestion,
  onBack,
  onNext,
  currentIndex,
  totalCount
}: DialogueGameProps) {
  // 已知的句子和需要拼的句子
  const knownSentence = showQuestion ? question : answer;
  const targetSentence = showQuestion ? answer : question;
  
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    initGame();
  }, [targetSentence]);

  const initGame = () => {
    // 分割目标句子
    const words = targetSentence.split(' ').filter(w => w.length > 0);
    
    // 生成干扰词
    const distractors = generateDistractors(words);
    
    // 打乱所有单词
    const allWords = [...words, ...distractors];
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    
    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsComplete(false);
    setShowError(false);
    setShowAnswer(false);
  };

  const generateDistractors = (words: string[]): string[] => {
    const commonWords = ['the', 'is', 'are', 'am', 'was', 'were', 'have', 'has', 'do', 'does', 
                         'can', 'will', 'would', 'should', 'could', 'in', 'on', 'at', 'to', 'from',
                         'very', 'much', 'many', 'some', 'any', 'this', 'that', 'these', 'those'];
    
    const distractors: string[] = [];
    const usedWords = new Set(words.map(w => w.toLowerCase()));
    
    // 添加3-5个干扰词
    const count = Math.min(5, Math.max(3, Math.floor(words.length * 0.4)));
    
    for (let i = 0; i < count && distractors.length < count; i++) {
      const word = commonWords[Math.floor(Math.random() * commonWords.length)];
      if (!usedWords.has(word.toLowerCase()) && !distractors.includes(word)) {
        distractors.push(word);
        usedWords.add(word.toLowerCase());
      }
    }
    
    return distractors;
  };

  const handleWordClick = (word: string, index: number) => {
    if (showAnswer) return;
    
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
    setSelectedWords(prev => [...prev, word]);
    setShowError(false);
  };

  const handleSelectedWordClick = (index: number) => {
    if (showAnswer) return;
    
    const word = selectedWords[index];
    setSelectedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, word]);
    setShowError(false);
  };

  const checkAnswer = () => {
    const userSentence = selectedWords.join(' ');
    const correctSentence = targetSentence;
    
    if (userSentence.toLowerCase().trim() === correctSentence.toLowerCase().trim()) {
      setIsComplete(true);
      speakText('Perfect!');
      // 只有在没有下一题选项时才自动返回，否则等待用户点击下一题
      if (!onNext) {
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      }
    } else {
      setShowError(true);
      speakText('Try again!');
    }
  };

  const handleShowAnswer = () => {
    const correctWords = targetSentence.split(' ').filter(w => w.length > 0);
    setSelectedWords(correctWords);
    setAvailableWords([]);
    setShowAnswer(true);
    setShowError(false);
  };

  const handleReset = () => {
    initGame();
  };

  const handleSpeak = (text: string) => {
    speakText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
      <Card className="max-w-4xl mx-auto p-8 shadow-2xl bg-white/95 backdrop-blur">
        {/* 顶部按钮 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="text-gray-600 border-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回题库
          </Button>
          
          {!showAnswer && !isComplete && (
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
          {onNext && isComplete && (
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
          <h2 className="text-blue-600 mb-4">💬 对话练习</h2>
          <p className="text-gray-600">{translation}</p>
        </div>

        {/* 对话区域 */}
        <div className="mb-8 space-y-4">
          {/* 已知句子（对话气泡） */}
          <div className={`flex ${showQuestion ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] ${showQuestion ? 'bg-blue-100' : 'bg-green-100'} rounded-2xl p-4 shadow-md`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">{showQuestion ? '问：' : '答：'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeak(knownSentence)}
                  className="h-6 w-6 p-0"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-800">{knownSentence}</p>
            </div>
          </div>

          {/* 需要拼的句子（对话气泡） */}
          <div className={`flex ${showQuestion ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${showQuestion ? 'bg-green-100' : 'bg-blue-100'} rounded-2xl p-4 shadow-md`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">{showQuestion ? '答：' : '问：'}</span>
                {selectedWords.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpeak(selectedWords.join(' '))}
                    className="h-6 w-6 p-0"
                    title="播放我拼的句子"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSpeak(targetSentence)}
                  className="h-6 w-6 p-0 text-orange-500 hover:text-orange-600"
                  title="听听正确答案（提示）"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 选中的单词区域 */}
              <div className="min-h-[60px] bg-white/50 rounded-lg p-3 mb-2">
                {selectedWords.length === 0 ? (
                  <p className="text-gray-400 text-center">从下方选择单词组成{showQuestion ? '回答' : '问题'}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((word, index) => (
                      <React.Fragment key={`selected-${index}-${word}`}>
                        <WordBlock
                          word={word}
                          onClick={() => handleSelectedWordClick(index)}
                          variant="selected"
                        />
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>

              {showAnswer && (
                <p className="text-xs text-green-700 mt-2">✓ 正确答案已显示</p>
              )}
            </div>
          </div>
        </div>

        {/* 可选单词区域 */}
        {availableWords.length > 0 && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-3 text-center">可选单词</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {availableWords.map((word, index) => (
                  <React.Fragment key={`available-${index}-${word}`}>
                    <WordBlock
                      word={word}
                      onClick={() => handleWordClick(word, index)}
                      variant="available"
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {showError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-center">
            <p className="text-red-800">😢 再试一次！仔细检查单词顺序</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          {!isComplete && !showAnswer && selectedWords.length > 0 && (
            <Button
              onClick={checkAnswer}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
            >
              检查答案
            </Button>
          )}
          
          {(showError || showAnswer) && (
            <Button
              onClick={handleReset}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-6 text-lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              重新开始
            </Button>
          )}
        </div>

        {/* 完成动画 */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-green-400 to-blue-400 text-white text-6xl font-bold p-8 rounded-3xl shadow-2xl">
                🎉 完美！
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
