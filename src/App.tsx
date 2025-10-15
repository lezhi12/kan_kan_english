import React, { useState, useEffect } from 'react';
import { ParentInput } from './components/ParentInput';
import { WordGame } from './components/WordGame';
import { MatchingGame } from './components/MatchingGame';
import { SpellingGame } from './components/SpellingGame';
import { FillInBlankGame } from './components/FillInBlankGame';
import { DialogueGame } from './components/DialogueGame';
import { FolderManager } from './components/FolderManager';
import { ConfigUploader } from './components/ConfigUploader';
import { Button } from './components/ui/button';
import { BookOpen, FolderOpen, Upload } from 'lucide-react';
import { initSpeech } from './utils/speech';
import { type Question } from './utils/storage';

type ViewMode = 'input' | 'folders' | 'upload' | 'game';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    initSpeech();
  }, []);

  // 单个题目开始
  const handleStartGame = (question: Question) => {
    setCurrentQuestion(question);
    setQuestionList([question]);
    setCurrentIndex(0);
    setViewMode('game');
  };

  // 批量题目开始（全部播放）
  const handleStartPlaylist = (questions: Question[]) => {
    if (questions.length > 0) {
      setQuestionList(questions);
      setCurrentIndex(0);
      setCurrentQuestion(questions[0]);
      setViewMode('game');
    }
  };

  // 下一题
  const handleNextQuestion = () => {
    if (currentIndex < questionList.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentQuestion(questionList[nextIndex]);
    }
  };

  // 返回菜单
  const handleBackToMenu = () => {
    setViewMode('folders');
    setCurrentQuestion(null);
    setQuestionList([]);
    setCurrentIndex(0);
  };

  const hasNextQuestion = currentIndex < questionList.length - 1;

  return (
    <>
      {viewMode === 'input' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-blue-600 mb-4">🎯 英语学习小助手</h1>
              <p className="text-gray-600">
                适合 8-9 岁孩子的英语学习工具
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button
                onClick={() => setViewMode('input')}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 bg-white/80 hover:bg-white border-blue-200"
              >
                <BookOpen className="w-8 h-8 text-blue-500" />
                <span>快速练习</span>
              </Button>

              <Button
                onClick={() => setViewMode('folders')}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 bg-white/80 hover:bg-white border-purple-200"
              >
                <FolderOpen className="w-8 h-8 text-purple-500" />
                <span>题库管理</span>
              </Button>

              <Button
                onClick={() => setViewMode('upload')}
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 bg-white/80 hover:bg-white border-orange-200"
              >
                <Upload className="w-8 h-8 text-orange-500" />
                <span>配置导入</span>
              </Button>
            </div>

            <ParentInput onStartGame={handleStartGame} />
          </div>
        </div>
      )}

      {viewMode === 'folders' && (
        <FolderManager 
          onBack={() => setViewMode('input')}
          onStartGame={handleStartGame}
          onStartPlaylist={handleStartPlaylist}
        />
      )}

      {viewMode === 'upload' && (
        <ConfigUploader 
          onBack={() => setViewMode('input')} 
          onImportComplete={() => setViewMode('folders')}
        />
      )}

      {viewMode === 'game' && currentQuestion && (
        <>
          {currentQuestion.type === 'sentence-building' ? (
            <WordGame
              sentence={currentQuestion.sentence}
              translation={currentQuestion.translation}
              onBack={handleBackToMenu}
              onNext={hasNextQuestion ? handleNextQuestion : undefined}
              currentIndex={currentIndex + 1}
              totalCount={questionList.length}
            />
          ) : currentQuestion.type === 'matching' && currentQuestion.words && currentQuestion.wordTranslations ? (
            <MatchingGame
              words={currentQuestion.words}
              wordTranslations={currentQuestion.wordTranslations}
              onBack={handleBackToMenu}
              onNext={hasNextQuestion ? handleNextQuestion : undefined}
              currentIndex={currentIndex + 1}
              totalCount={questionList.length}
            />
          ) : currentQuestion.type === 'spelling' && currentQuestion.word && currentQuestion.meaning && currentQuestion.distractors ? (
            <SpellingGame
              word={currentQuestion.word}
              phonetic={currentQuestion.phonetic}
              meaning={currentQuestion.meaning}
              distractors={currentQuestion.distractors}
              onComplete={handleBackToMenu}
              onBack={handleBackToMenu}
              onNext={hasNextQuestion ? handleNextQuestion : undefined}
              currentIndex={currentIndex + 1}
              totalCount={questionList.length}
            />
          ) : currentQuestion.type === 'fill-in-blank' && currentQuestion.blanks ? (
            <FillInBlankGame
              sentence={currentQuestion.sentence}
              blanks={currentQuestion.blanks}
              translation={currentQuestion.translation}
              onComplete={handleBackToMenu}
              onBack={handleBackToMenu}
              onNext={hasNextQuestion ? handleNextQuestion : undefined}
              currentIndex={currentIndex + 1}
              totalCount={questionList.length}
            />
          ) : currentQuestion.type === 'dialogue' && currentQuestion.question && currentQuestion.answer ? (
            <DialogueGame
              question={currentQuestion.question}
              answer={currentQuestion.answer}
              translation={currentQuestion.translation}
              showQuestion={currentQuestion.showQuestion ?? true}
              onBack={handleBackToMenu}
              onNext={hasNextQuestion ? handleNextQuestion : undefined}
              currentIndex={currentIndex + 1}
              totalCount={questionList.length}
            />
          ) : (
            <div className="text-center text-red-500">题目数据错误</div>
          )}
        </>
      )}
    </>
  );
}
