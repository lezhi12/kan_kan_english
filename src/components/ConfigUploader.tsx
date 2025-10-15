import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Upload, FileJson, Download, CheckCircle, XCircle, Info, FolderPlus, Folder, ArrowLeft } from 'lucide-react';
import { addQuestion, findOrCreateFolder, loadFolders, getFolderPath, type Question } from '../utils/storage';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';

interface ConfigUploaderProps {
  onBack?: () => void;
  onImportComplete?: () => void;
}

interface ImportPreview {
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  newFolders: string[]; // 将要创建的新目录路径
  existingFolders: string[]; // 已存在的目录路径
  data: any[]; // 原始数据
}

export function ConfigUploader({ onBack, onImportComplete }: ConfigUploaderProps) {
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    foldersCreated?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 预览对话框状态
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    preview: ImportPreview | null;
  }>({ open: false, preview: null });

  // 分析配置文件，生成预览信息
  const analyzeConfigFile = (data: any[]): ImportPreview => {
    const existingFolders = loadFolders();
    const newFolderPaths = new Set<string>();
    const existingFolderPaths = new Set<string>();
    let validCount = 0;
    let invalidCount = 0;

    for (const item of data) {
      // 验证必填字段（对话题不需要sentence字段）
      if (!item.type || !item.translation) {
        invalidCount++;
        continue;
      }
      
      // 对于非对话题，验证sentence字段
      if (item.type !== 'dialogue' && !item.sentence) {
        invalidCount++;
        continue;
      }

      // 验证题目类型
      if (item.type !== 'sentence-building' && item.type !== 'matching' && item.type !== 'spelling' && item.type !== 'fill-in-blank' && item.type !== 'dialogue') {
        invalidCount++;
        continue;
      }

      // 连线题需要验证单词列表
      if (item.type === 'matching') {
        if (!Array.isArray(item.words) || !Array.isArray(item.wordTranslations)) {
          invalidCount++;
          continue;
        }
        if (item.words.length !== item.wordTranslations.length) {
          invalidCount++;
          continue;
        }
      }

      // 单词拼写题需要验证字段
      if (item.type === 'spelling') {
        if (!item.word || !item.meaning || !Array.isArray(item.distractors)) {
          invalidCount++;
          continue;
        }
        if (item.distractors.length !== 3) {
          invalidCount++;
          continue;
        }
      }

      // 填空题需要验证字段
      if (item.type === 'fill-in-blank') {
        if (!Array.isArray(item.blanks) || item.blanks.length === 0) {
          invalidCount++;
          continue;
        }
        // 验证句子中 ___ 的数量是否与 blanks 数量一致
        const blankCount = (item.sentence?.match(/___+/g) || []).length;
        if (blankCount !== item.blanks.length) {
          invalidCount++;
          continue;
        }
      }

      // 对话题需要验证字段
      if (item.type === 'dialogue') {
        if (!item.question || !item.answer) {
          invalidCount++;
          continue;
        }
      }

      validCount++;

      // 分析目录
      if (item.folderName && typeof item.folderName === 'string') {
        const folderPath = item.folderName.trim();
        
        // 检查每一级目录是否存在
        const parts = folderPath.split('/').map(p => p.trim()).filter(p => p.length > 0);
        let currentPath = '';
        
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) currentPath += '/';
          currentPath += parts[i];
          
          // 检查这个路径是否已存在
          const pathExists = checkFolderPathExists(currentPath, existingFolders);
          
          if (pathExists) {
            existingFolderPaths.add(currentPath);
          } else {
            newFolderPaths.add(currentPath);
          }
        }
      }
    }

    return {
      totalQuestions: data.length,
      validQuestions: validCount,
      invalidQuestions: invalidCount,
      newFolders: Array.from(newFolderPaths).sort(),
      existingFolders: Array.from(existingFolderPaths).sort(),
      data,
    };
  };

  // 检查目录路径是否存在
  const checkFolderPathExists = (path: string, folders: any[]): boolean => {
    const parts = path.split('/').map(p => p.trim()).filter(p => p.length > 0);
    let parentId: string | undefined = undefined;

    for (const name of parts) {
      const folder = folders.find(f => f.name === name && f.parentId === parentId);
      if (!folder) return false;
      parentId = folder.id;
    }

    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据格式
      if (!Array.isArray(data)) {
        setImportResult({
          success: false,
          message: '配置文件格式错误：根元素必须是数组',
        });
        return;
      }

      // 分析配置文件并显示预览
      const preview = analyzeConfigFile(data);
      setPreviewDialog({ open: true, preview });
      
    } catch (error) {
      setImportResult({
        success: false,
        message: '文件解析失败，请检查JSON格式是否正确',
      });
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 确认导入
  const confirmImport = () => {
    const preview = previewDialog.preview;
    if (!preview) return;

    try {
      // 记录导入前的folder数量
      const foldersBefore = loadFolders().length;
      
      // 导入题目
      let successCount = 0;
      const createdFolders = new Set<string>();
      
      for (const item of preview.data) {
        try {
          // 验证必填字段（对话题不需要sentence字段）
          if (!item.type || !item.translation) {
            continue;
          }
          
          // 对于非对话题，验证sentence字段
          if (item.type !== 'dialogue' && !item.sentence) {
            continue;
          }

          // 验证题目类型
          if (item.type !== 'sentence-building' && item.type !== 'matching' && item.type !== 'spelling' && item.type !== 'fill-in-blank' && item.type !== 'dialogue') {
            continue;
          }

          // 连线题需要验证单词列表
          if (item.type === 'matching') {
            if (!Array.isArray(item.words) || !Array.isArray(item.wordTranslations)) {
              continue;
            }
            if (item.words.length !== item.wordTranslations.length) {
              continue;
            }
          }

          // 单词拼写题需要验证字段
          if (item.type === 'spelling') {
            if (!item.word || !item.meaning || !Array.isArray(item.distractors)) {
              continue;
            }
            if (item.distractors.length !== 3) {
              continue;
            }
          }

          // 填空题需要验证字段
          if (item.type === 'fill-in-blank') {
            if (!Array.isArray(item.blanks) || item.blanks.length === 0) {
              continue;
            }
            const blankCount = (item.sentence?.match(/___+/g) || []).length;
            if (blankCount !== item.blanks.length) {
              continue;
            }
          }

          // 对话题需要验证字段
          if (item.type === 'dialogue') {
            if (!item.question || !item.answer) {
              continue;
            }
          }

          // 处理folder：如果提供了folderName，查找或创建该folder
          let folderId: string | undefined = undefined;
          if (item.folderName && typeof item.folderName === 'string') {
            const folderName = item.folderName.trim();
            const folder = findOrCreateFolder(folderName);
            folderId = folder.id;
            createdFolders.add(folderName);
          } else if (item.folderId) {
            // 兼��旧格式，直接使用folderId
            folderId = item.folderId;
          }

          // 添加题目
          addQuestion({
            type: item.type,
            sentence: item.type === 'dialogue' ? `${item.question} / ${item.answer}` : item.sentence,
            translation: item.translation,
            words: item.words,
            wordTranslations: item.wordTranslations,
            word: item.word,
            phonetic: item.phonetic,
            meaning: item.meaning,
            distractors: item.distractors,
            blanks: item.blanks,
            question: item.question,
            answer: item.answer,
            showQuestion: item.showQuestion ?? true,
            folderId: folderId,
          });

          successCount++;
        } catch (err) {
          console.error('导入题目失败:', err);
        }
      }

      // 计算新创建的folder数量
      const foldersAfter = loadFolders().length;
      const newFoldersCount = foldersAfter - foldersBefore;

      let message = `成功导入 ${successCount} 道题目`;
      if (newFoldersCount > 0) {
        message += `，创建了 ${newFoldersCount} 个新目录`;
      }

      setImportResult({
        success: true,
        message: message,
        count: successCount,
        foldersCreated: newFoldersCount,
      });

      // 关闭预览对话框
      setPreviewDialog({ open: false, preview: null });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: '导入失败，请重试',
      });
      setPreviewDialog({ open: false, preview: null });
    }
  };

  const downloadExample = (type: 'sentence' | 'matching' | 'spelling' | 'fill-in-blank' | 'dialogue' | 'mixed') => {
    let example;
    
    if (type === 'sentence') {
      example = [
        {
          type: 'sentence-building',
          sentence: 'I love my family',
          translation: '我爱我的家人',
          folderName: '基础句型/家庭相关'
        },
        {
          type: 'sentence-building',
          sentence: 'What is your favorite color',
          translation: '你最喜欢的颜色是什么',
          folderName: '基础句型/日常问答'
        },
        {
          type: 'sentence-building',
          sentence: 'I like to play basketball',
          translation: '我喜欢打篮球',
          folderName: '兴趣爱好/运动类'
        },
        {
          type: 'sentence-building',
          sentence: 'How old are you',
          translation: '你多大了',
          folderName: '日常问候'
        },
        {
          type: 'sentence-building',
          sentence: 'Nice to meet you',
          translation: '很高兴见到你',
          folderName: '日常问候'
        }
      ];
    } else if (type === 'matching') {
      example = [
        {
          type: 'matching',
          sentence: '动物单词',
          translation: '学习常见动物的英文单词',
          words: ['dog', 'cat', 'bird', 'fish', 'rabbit'],
          wordTranslations: ['狗', '猫', '鸟', '鱼', '兔子'],
          folderName: '词汇练习/动物类'
        },
        {
          type: 'matching',
          sentence: '颜色单词',
          translation: '学习常见颜色的英文单词',
          words: ['red', 'blue', 'green', 'yellow', 'black', 'white'],
          wordTranslations: ['红色', '蓝色', '绿色', '黄色', '黑色', '白色'],
          folderName: '词汇练习/颜色类'
        },
        {
          type: 'matching',
          sentence: '水果单词',
          translation: '学习常见水果的英文单词',
          words: ['apple', 'banana', 'orange', 'grape', 'strawberry'],
          wordTranslations: ['苹果', '香蕉', '橙子', '葡萄', '草莓'],
          folderName: '词汇练习/食物类'
        }
      ];
    } else if (type === 'spelling') {
      example = [
        {
          type: 'spelling',
          sentence: 'apple',
          translation: '苹果',
          word: 'apple',
          phonetic: '/ˈæp.əl/',
          meaning: '苹果',
          distractors: ['香蕉', '橙子', '葡萄'],
          folderName: '单词拼写/水果类'
        },
        {
          type: 'spelling',
          sentence: 'dog',
          translation: '狗',
          word: 'dog',
          phonetic: '/dɔːɡ/',
          meaning: '狗',
          distractors: ['猫', '鸟', '鱼'],
          folderName: '单词拼写/动物类'
        },
        {
          type: 'spelling',
          sentence: 'red',
          translation: '红色',
          word: 'red',
          phonetic: '/red/',
          meaning: '红色',
          distractors: ['蓝色', '绿色', '黄色'],
          folderName: '单词拼写/颜色类'
        }
      ];
    } else if (type === 'fill-in-blank') {
      example = [
        {
          type: 'fill-in-blank',
          sentence: 'I ___ to school every day',
          translation: '我每天去上学',
          blanks: ['go'],
          folderName: '填空练习/日常生活'
        },
        {
          type: 'fill-in-blank',
          sentence: 'She ___ a book in the library',
          translation: '她在图书馆读书',
          blanks: ['reads'],
          folderName: '填空练习/学习活动'
        },
        {
          type: 'fill-in-blank',
          sentence: 'My ___ is in the kitchen',
          translation: '我妈妈在厨房',
          blanks: ['mother'],
          folderName: '填空练习/家庭成员'
        }
      ];
    } else if (type === 'dialogue') {
      example = [
        {
          type: 'dialogue',
          question: 'What is your name',
          answer: 'My name is Tom',
          translation: '你叫什么名字？我叫汤姆。',
          showQuestion: true,
          folderName: '对话练习/自我介绍'
        },
        {
          type: 'dialogue',
          question: 'How old are you',
          answer: 'I am eight years old',
          translation: '你多大了？我八岁了。',
          showQuestion: true,
          folderName: '对话练习/日常问候'
        },
        {
          type: 'dialogue',
          question: 'What do you like',
          answer: 'I like reading books',
          translation: '你喜欢什么？我喜欢读书。',
          showQuestion: false,
          folderName: '对话练习/兴趣爱好'
        }
      ];
    } else {
      example = [
        {
          type: 'sentence-building',
          sentence: 'I love my family',
          translation: '我爱我的家人',
          folderName: '基础句型/家庭相关'
        },
        {
          type: 'matching',
          sentence: '动物单词',
          translation: '学习常见动物的英文单词',
          words: ['dog', 'cat', 'bird', 'fish'],
          wordTranslations: ['狗', '猫', '鸟', '鱼'],
          folderName: '词汇练习/动物类'
        },
        {
          type: 'spelling',
          sentence: 'apple',
          translation: '苹果',
          word: 'apple',
          phonetic: '/ˈæp.əl/',
          meaning: '苹果',
          distractors: ['香蕉', '橙子', '葡萄'],
          folderName: '单词拼写/水果类'
        },
        {
          type: 'fill-in-blank',
          sentence: 'I ___ to school every day',
          translation: '我每天去上学',
          blanks: ['go'],
          folderName: '填空练习/日常生活'
        },
        {
          type: 'sentence-building',
          sentence: 'What is your name',
          translation: '你叫什么名字',
          folderName: '日常问候'
        },
        {
          type: 'matching',
          sentence: '颜色单词',
          translation: '学习常见颜色的英文单词',
          words: ['red', 'blue', 'green', 'yellow'],
          wordTranslations: ['红色', '蓝色', '绿色', '黄色'],
          folderName: '词汇练习/颜色类'
        }
      ];
    }

    const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-example.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 shadow-xl bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-blue-600" />
              <h2 className="text-blue-600">配置文件导入</h2>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回主页
              </Button>
            )}
          </div>

        {/* 上传区域 */}
        <div className="mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="config-upload"
            />
            <label
              htmlFor="config-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-700 mb-2">点击上传JSON配置文件</p>
              <p className="text-sm text-gray-500">支持批量导入拼句子题和连线题</p>
            </label>
          </div>
        </div>

        {/* 导入结果提示 */}
        {importResult && (
          <Alert className={`mb-8 ${importResult.success ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <AlertDescription className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                {importResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* 配置样例 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-purple-600" />
            <h3 className="text-purple-600">配置文件样例</h3>
          </div>

          <Tabs defaultValue="sentence" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="sentence">拼句子题</TabsTrigger>
              <TabsTrigger value="matching">连线题</TabsTrigger>
              <TabsTrigger value="spelling">单词拼写题</TabsTrigger>
              <TabsTrigger value="fill-in-blank">填空题</TabsTrigger>
              <TabsTrigger value="dialogue">对话题</TabsTrigger>
              <TabsTrigger value="mixed">混合题型</TabsTrigger>
            </TabsList>

            <TabsContent value="sentence" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "sentence-building",
    "sentence": "I love my family",
    "translation": "我爱我的家人",
    "folderName": "基础句型/家庭相关"
  },
  {
    "type": "sentence-building",
    "sentence": "What is your favorite color",
    "translation": "你最喜欢的颜色是什么",
    "folderName": "基础句型/日常问答"
  },
  {
    "type": "sentence-building",
    "sentence": "Nice to meet you",
    "translation": "很高兴见到你",
    "folderName": "日常问候"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('sentence')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载拼句子题样例
              </Button>
              <Alert>
                <AlertDescription className="text-sm text-gray-600">
                  💡 <strong>多级目录</strong>：使用 <code className="bg-gray-200 px-1 rounded">/</code> 分隔符表示层级，如 <code className="bg-gray-200 px-1 rounded">"基础句型/家庭相关"</code> 表示"家庭相关"是"基础句型"的子目录。
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="matching" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "matching",
    "sentence": "动物单词",
    "translation": "学习常见动物的英文单词",
    "words": ["dog", "cat", "bird", "fish", "rabbit"],
    "wordTranslations": ["狗", "猫", "鸟", "鱼", "兔子"],
    "folderName": "词汇练习/动物类"
  },
  {
    "type": "matching",
    "sentence": "颜色单词",
    "translation": "学习常见颜色的英文单词",
    "words": ["red", "blue", "green", "yellow"],
    "wordTranslations": ["红色", "蓝色", "绿色", "黄色"],
    "folderName": "词汇练习/颜色类"
  },
  {
    "type": "matching",
    "sentence": "水果单词",
    "translation": "学习常见水果的英文单词",
    "words": ["apple", "banana", "orange"],
    "wordTranslations": ["苹果", "香蕉", "橙子"],
    "folderName": "词汇练习/食物类"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('matching')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载连线题样例
              </Button>
              <Alert>
                <AlertDescription className="text-sm text-gray-600">
                  📌 连线题说明：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>sentence: 题目标题</li>
                    <li>translation: 题目描述</li>
                    <li>words: 英文单词数组</li>
                    <li>wordTranslations: 中文翻译数组（顺序对应）</li>
                    <li>folderName: 支持多级目录，如 <code className="bg-gray-200 px-1 rounded">"词汇练习/动物类"</code></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="spelling" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "spelling",
    "sentence": "apple",
    "translation": "苹果",
    "word": "apple",
    "meaning": "苹果",
    "distractors": ["香蕉", "橙子", "葡萄"],
    "folderName": "单词拼写/水果类"
  },
  {
    "type": "spelling",
    "sentence": "dog",
    "translation": "狗",
    "word": "dog",
    "meaning": "狗",
    "distractors": ["猫", "鸟", "鱼"],
    "folderName": "单词拼写/动物类"
  },
  {
    "type": "spelling",
    "sentence": "red",
    "translation": "红色",
    "word": "red",
    "meaning": "红色",
    "distractors": ["蓝色", "绿色", "黄色"],
    "folderName": "单词拼写/颜色类"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('spelling')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载单词拼写题样例
              </Button>
              <Alert>
                <AlertDescription className="text-sm text-gray-600">
                  📌 单词拼写题说明：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>word: 要拼写的英文单词</li>
                    <li>meaning: 正确的中文意思</li>
                    <li>distractors: 3个干扰选项（错误的中文意思）</li>
                    <li>sentence和translation: 保持和word、meaning一致即可</li>
                    <li>folderName: 支持多级目录，如 <code className="bg-gray-200 px-1 rounded">"单词拼写/水果类"</code></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="fill-in-blank" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "fill-in-blank",
    "sentence": "I ___ to school every day",
    "translation": "我每天去上学",
    "blanks": ["go"],
    "folderName": "填空练习/日常生活"
  },
  {
    "type": "fill-in-blank",
    "sentence": "She ___ a book",
    "translation": "她读一本书",
    "blanks": ["reads"],
    "folderName": "填空练习/学习活动"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('fill-in-blank')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载填空题样例
              </Button>
              <Alert>
                <AlertDescription className="text-sm text-gray-600">
                  📌 填空题说明：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>sentence: 带有填空标记的句子（用 ___ 表示填空位置）</li>
                    <li>blanks: 填空答案数组（顺序对应句子中的填空）</li>
                    <li>folderName: 支持多级目录</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="dialogue" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "dialogue",
    "question": "What is your name",
    "answer": "My name is Tom",
    "translation": "你叫什么名字？我叫汤姆。",
    "showQuestion": true,
    "folderName": "对话练习/自我介绍"
  },
  {
    "type": "dialogue",
    "question": "How old are you",
    "answer": "I am eight years old",
    "translation": "你多大了？我八岁了。",
    "showQuestion": true,
    "folderName": "对话练习/日常问候"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('dialogue')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载对话题样例
              </Button>
              <Alert>
                <AlertDescription className="text-sm text-gray-600">
                  📌 对话题说明：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>question: 问题（英文）</li>
                    <li>answer: 回答（英文）</li>
                    <li>translation: 中文翻译（问答的完整翻译）</li>
                    <li>showQuestion: true表示显示问题让孩子拼回答，false表示显示回答让孩子拼问题</li>
                    <li>folderName: 支持多级目录</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="mixed" className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto">
{`[
  {
    "type": "sentence-building",
    "sentence": "I love my family",
    "translation": "我爱我的家人",
    "folderName": "基础句型/家庭相关"
  },
  {
    "type": "matching",
    "sentence": "动物单词",
    "translation": "学习常见动物的英文单词",
    "words": ["dog", "cat", "bird", "fish"],
    "wordTranslations": ["狗", "猫", "鸟", "鱼"],
    "folderName": "词汇练习/动物类"
  },
  {
    "type": "spelling",
    "sentence": "apple",
    "translation": "苹果",
    "word": "apple",
    "meaning": "苹果",
    "distractors": ["香蕉", "橙子", "葡萄"],
    "folderName": "单词拼写/水果类"
  },
  {
    "type": "sentence-building",
    "sentence": "What is your name",
    "translation": "你叫什么名字",
    "folderName": "日常问候"
  }
]`}
                </pre>
              </div>
              <Button
                onClick={() => downloadExample('mixed')}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                下载混合题型样例
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* 字段说明 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-blue-900 mb-2">📋 字段说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>type</strong>: 题目类型 (sentence-building、matching、spelling、fill-in-blank 或 dialogue)</li>
            <li><strong>sentence</strong>: 拼句子题的英文句子 / 连线题的标题 / 单词拼写题的单词 / 填空题的句子</li>
            <li><strong>translation</strong>: 中文翻译</li>
            <li><strong>words, wordTranslations</strong>: (仅连线题) 英文单词数组和中文翻译数组</li>
            <li><strong>word, meaning, distractors</strong>: (仅单词拼写题) 单词、正确意思、3个干扰选项</li>
            <li><strong>blanks</strong>: (仅填空题) 填空答案数组</li>
            <li><strong>question, answer, showQuestion</strong>: (仅对话题) 问题、回答、显示模式</li>
            <li><strong>folderName</strong>: 目录名称，系统会自动创建不存在的目录 ✨</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 <strong>多级目录支持</strong>：使用 <code className="bg-blue-100 px-1 rounded">/</code> 分隔符表示层级，如 <code className="bg-blue-100 px-1 rounded">"基础句型/基础1"</code>。
              导入前会显示预览，确认后才会创建目录和导入题目。
            </p>
          </div>
        </div>
      </Card>

      {/* 导入预览对话框 */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => !open && setPreviewDialog({ open: false, preview: null })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入预览</DialogTitle>
            <DialogDescription>
              请确认以下信息后再导入
            </DialogDescription>
          </DialogHeader>

          {previewDialog.preview && (
            <div className="space-y-4 py-4">
              {/* 题目统计 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📊 题目统计</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">总计：</span>
                    <span className="ml-1 font-semibold">{previewDialog.preview.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-green-600">有效：</span>
                    <span className="ml-1 font-semibold text-green-700">{previewDialog.preview.validQuestions}</span>
                  </div>
                  <div>
                    <span className="text-red-600">无效：</span>
                    <span className="ml-1 font-semibold text-red-700">{previewDialog.preview.invalidQuestions}</span>
                  </div>
                </div>
              </div>

              {/* 新建目录 */}
              {previewDialog.preview.newFolders.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderPlus className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-green-700">
                      将创建 {previewDialog.preview.newFolders.length} 个新目录
                    </h3>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {previewDialog.preview.newFolders.map((path, index) => (
                      <div key={index} className="text-sm text-green-700 flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="font-mono bg-white px-2 py-1 rounded">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 已存在目录 */}
              {previewDialog.preview.existingFolders.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-700">
                      使用 {previewDialog.preview.existingFolders.length} 个已存在的目录
                    </h3>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {previewDialog.preview.existingFolders.map((path, index) => (
                      <div key={index} className="text-sm text-blue-700 flex items-center gap-2">
                        <span className="text-blue-500">•</span>
                        <span className="font-mono bg-white px-2 py-1 rounded">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 警告信息 */}
              {previewDialog.preview.invalidQuestions > 0 && (
                <Alert className="border-yellow-300 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    ⚠️ 检测到 {previewDialog.preview.invalidQuestions} 道格式错误的题目，这些题目将被跳过
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialog({ open: false, preview: null })}
            >
              取消
            </Button>
            <Button
              onClick={confirmImport}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              disabled={!previewDialog.preview || previewDialog.preview.validQuestions === 0}
            >
              确认导入 ({previewDialog.preview?.validQuestions || 0} 道题目)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
