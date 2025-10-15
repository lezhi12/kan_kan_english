import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { BookOpen, Play, Languages } from 'lucide-react';
import { translateSentence } from '../utils/translator';

interface ParentInputProps {
  onStart: (sentence: string, translation: string) => void;
}

export function ParentInput({ onStart }: ParentInputProps) {
  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');

  // 自动翻译 - 每次句子改变都重新生成翻译
  useEffect(() => {
    if (sentence.trim()) {
      const translated = translateSentence(sentence.trim());
      setTranslation(translated); // 直接设置翻译结果（可能为空）
    } else {
      setTranslation('');
    }
  }, [sentence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.trim() && translation.trim()) {
      onStart(sentence.trim(), translation.trim());
    }
  };

  // 预设示例
  const examples = [
    { sentence: 'How many classes do you have', translation: '你有多少节课' },
    { sentence: 'What is your favorite color', translation: '你最喜欢的颜色是什么' },
    { sentence: 'I like to play basketball', translation: '我喜欢打篮球' },
    { sentence: 'Where do you live', translation: '你住在哪里' },
    { sentence: 'I love my family', translation: '我爱我的家人' },
    { sentence: 'Can you help me', translation: '你能帮我吗' },
  ];

  const loadExample = (example: typeof examples[0]) => {
    setSentence(example.sentence);
    // translation会由useEffect自动设置
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card className="p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h1 className="text-purple-600">家长设置</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="sentence">英文句子</Label>
            <Textarea
              id="sentence"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="例如：How many classes do you have"
              className="mt-2"
              rows={3}
            />
          </div>

          {/* 中文翻译（可编辑） */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="translation">中文翻译</Label>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Languages className="w-3 h-3" />
                <span>自动生成，可修改</span>
              </div>
            </div>
            <Input
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="自动生成的中文翻译"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={!sentence.trim() || !translation.trim()}
          >
            <Play className="w-5 h-5 mr-2" />
            开始游戏
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-600 mb-3">快速示例：</p>
          <div className="space-y-2">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
              >
                <div className="text-gray-700">{example.sentence}</div>
                <div className="text-gray-500 text-xs mt-1">{example.translation}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
