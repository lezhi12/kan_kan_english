import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Type,
  Link2,
  PencilLine,
  FileText,
  MessageCircle,
  Languages,
  PlayCircle
} from 'lucide-react';
import {
  Question,
  Folder,
  loadQuestions,
  loadFolders,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addFolder,
  updateFolder,
  deleteFolder,
} from '../utils/storage';
import { translateSentence } from '../utils/translator';

interface FolderManagerProps {
  onBack: () => void;
  onStartGame: (question: Question) => void;
  onStartPlaylist: (questions: Question[]) => void;
}

export function FolderManager({ onBack, onStartGame, onStartPlaylist }: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // 文件夹对话框
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('bg-blue-500');
  const [parentFolderId, setParentFolderId] = useState<string | undefined>(undefined);
  
  // 题目对话框
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formType, setFormType] = useState<'sentence-building' | 'matching' | 'spelling' | 'fill-in-blank' | 'dialogue'>('sentence-building');
  const [formSentence, setFormSentence] = useState('');
  const [formTranslation, setFormTranslation] = useState('');
  const [formWords, setFormWords] = useState('');
  const [formWordTranslations, setFormWordTranslations] = useState('');
  const [formWord, setFormWord] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formDistractors, setFormDistractors] = useState('');
  const [formBlanks, setFormBlanks] = useState('');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formShowQuestion, setFormShowQuestion] = useState(true);
  const [formFolderId, setFormFolderId] = useState<string | undefined>(undefined);
  
  // 删除确认对话框
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'folder' | 'question', id: string, name: string } | null>(null);

  const colorOptions = [
    { value: 'bg-red-500', label: '红色' },
    { value: 'bg-blue-500', label: '蓝色' },
    { value: 'bg-green-500', label: '绿色' },
    { value: 'bg-yellow-500', label: '黄色' },
    { value: 'bg-purple-500', label: '紫色' },
    { value: 'bg-pink-500', label: '粉色' },
    { value: 'bg-indigo-500', label: '靛蓝' },
    { value: 'bg-orange-500', label: '橙色' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  // 自动翻译
  useEffect(() => {
    if (formType === 'sentence-building' && formSentence.trim()) {
      const translated = translateSentence(formSentence.trim());
      setFormTranslation(translated);
    } else if (formType === 'matching') {
      // 连线题不自动翻译
    } else {
      setFormTranslation('');
    }
  }, [formSentence, formType]);

  const loadData = () => {
    setFolders(loadFolders());
    setQuestions(loadQuestions());
  };

  // 切换文件夹展开/折叠
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // 获取子文件夹
  const getChildFolders = (parentId: string | undefined) => {
    return folders.filter(f => f.parentId === parentId);
  };

  // 获取文件夹下的题目
  const getFolderQuestions = (folderId: string | undefined) => {
    return questions.filter(q => q.folderId === folderId);
  };

  // 获取文件夹及其所有子文件夹的题目总数
  const getFolderTotalCount = (folderId: string): number => {
    const directQuestions = questions.filter(q => q.folderId === folderId).length;
    const childFolders = getChildFolders(folderId);
    const childCount = childFolders.reduce((sum, child) => sum + getFolderTotalCount(child.id), 0);
    return directQuestions + childCount;
  };

  // 获取文件夹及其所有子文件夹的所有题目（用于全部播放）
  const getAllFolderQuestions = (folderId: string): Question[] => {
    const directQuestions = questions.filter(q => q.folderId === folderId);
    const childFolders = getChildFolders(folderId);
    const childQuestions = childFolders.flatMap(child => getAllFolderQuestions(child.id));
    return [...directQuestions, ...childQuestions];
  };

  // 判断是否是叶子文件夹（没有子文件夹）
  const isLeafFolder = (folderId: string): boolean => {
    return getChildFolders(folderId).length === 0;
  };

  // 获取文件夹路径名称
  const getFolderPath = (folderId: string | undefined): string => {
    if (!folderId) return '未分类';
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return '未分类';
    if (folder.parentId) {
      return getFolderPath(folder.parentId) + ' / ' + folder.name;
    }
    return folder.name;
  };

  // 新建文件夹
  const handleAddFolder = (parentId?: string) => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('bg-blue-500');
    setParentFolderId(parentId);
    setIsFolderDialogOpen(true);
  };

  // 编辑文件夹
  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setParentFolderId(folder.parentId);
    setIsFolderDialogOpen(true);
  };

  // 保存文件夹
  const handleSaveFolder = () => {
    if (!folderName.trim()) {
      alert('请输入文件夹名称');
      return;
    }

    if (editingFolder) {
      updateFolder(editingFolder.id, {
        name: folderName.trim(),
        color: folderColor,
        parentId: parentFolderId,
      });
    } else {
      addFolder({
        name: folderName.trim(),
        color: folderColor,
        parentId: parentFolderId,
      });
    }

    loadData();
    setIsFolderDialogOpen(false);
  };

  // 删除文件夹
  const handleDeleteFolder = (folderId: string) => {
    // 递归删除子文件夹和题目
    const deleteRecursive = (id: string) => {
      // 删除该文件夹下的所有题目
      const folderQuestions = questions.filter(q => q.folderId === id);
      folderQuestions.forEach(q => deleteQuestion(q.id));

      // 递归删除子文件夹
      const childFolders = getChildFolders(id);
      childFolders.forEach(child => deleteRecursive(child.id));

      // 删除文件夹本身
      deleteFolder(id);
    };

    deleteRecursive(folderId);
    loadData();
    setDeleteConfirm(null);
  };

  // 新建题目
  const handleAddQuestion = (folderId?: string) => {
    setEditingQuestion(null);
    setFormType('sentence-building');
    setFormSentence('');
    setFormTranslation('');
    setFormWords('');
    setFormWordTranslations('');
    setFormWord('');
    setFormPhonetic('');
    setFormMeaning('');
    setFormDistractors('');
    setFormBlanks('');
    setFormQuestion('');
    setFormAnswer('');
    setFormShowQuestion(true);
    setFormFolderId(folderId);
    setIsQuestionDialogOpen(true);
  };

  // 编辑题目
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setFormType(question.type);
    setFormSentence(question.sentence);
    setFormTranslation(question.translation);
    setFormWords(question.words?.join(', ') || '');
    setFormWordTranslations(question.wordTranslations?.join(', ') || '');
    setFormWord(question.word || '');
    setFormPhonetic(question.phonetic || '');
    setFormMeaning(question.meaning || '');
    setFormDistractors(question.distractors?.join(', ') || '');
    setFormBlanks(question.blanks?.join(', ') || '');
    setFormQuestion(question.question || '');
    setFormAnswer(question.answer || '');
    setFormShowQuestion(question.showQuestion ?? true);
    setFormFolderId(question.folderId);
    setIsQuestionDialogOpen(true);
  };

  // 保存题目
  const handleSaveQuestion = () => {
    // 单词拼写题验证
    if (formType === 'spelling') {
      if (!formWord.trim() || !formMeaning.trim()) {
        alert('单词拼写题需要填写单词和正确意思');
        return;
      }
      
      const distractors = formDistractors.split(',').map(d => d.trim()).filter(d => d);
      if (distractors.length !== 3) {
        alert('请提供3个干扰选项，用逗号分隔');
        return;
      }

      const questionData: any = {
        type: 'spelling',
        sentence: formWord.trim(),
        translation: formMeaning.trim(),
        word: formWord.trim(),
        phonetic: formPhonetic.trim() || undefined,
        meaning: formMeaning.trim(),
        distractors: distractors,
        folderId: formFolderId,
      };

      if (editingQuestion) {
        updateQuestion(editingQuestion.id, questionData);
      } else {
        addQuestion(questionData);
      }

      loadData();
      setIsQuestionDialogOpen(false);
      return;
    }

    // 填空题验证
    if (formType === 'fill-in-blank') {
      if (!formSentence.trim() || !formTranslation.trim()) {
        alert('填空题需要填写句子和中文翻译');
        return;
      }
      
      const blankCount = (formSentence.match(/___+/g) || []).length;
      if (blankCount === 0) {
        alert('句子中需要包含至少一个空（用 ___ 表示）');
        return;
      }
      
      const blanks = formBlanks.split(',').map(b => b.trim()).filter(b => b);
      if (blanks.length !== blankCount) {
        alert(`句子中有 ${blankCount} 个空，需要提供 ${blankCount} 个答案，用逗号分隔`);
        return;
      }
      
      const questionData: any = {
        type: 'fill-in-blank',
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        blanks: blanks,
        folderId: formFolderId,
      };

      if (editingQuestion) {
        updateQuestion(editingQuestion.id, questionData);
      } else {
        addQuestion(questionData);
      }
      
      loadData();
      setIsQuestionDialogOpen(false);
      return;
    }

    // 对话题验证
    if (formType === 'dialogue') {
      if (!formQuestion.trim() || !formAnswer.trim() || !formTranslation.trim()) {
        alert('对话题需要填写问题、回答和中文翻译');
        return;
      }
      
      const questionData: any = {
        type: 'dialogue',
        sentence: `${formQuestion.trim()} / ${formAnswer.trim()}`,
        translation: formTranslation.trim(),
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        showQuestion: formShowQuestion,
        folderId: formFolderId,
      };

      if (editingQuestion) {
        updateQuestion(editingQuestion.id, questionData);
      } else {
        addQuestion(questionData);
      }
      
      loadData();
      setIsQuestionDialogOpen(false);
      return;
    }

    if (formSentence.trim() && formTranslation.trim()) {
      const questionData: any = {
        type: formType,
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        folderId: formFolderId,
      };

      if (formType === 'matching') {
        const words = formWords.split(',').map(w => w.trim()).filter(w => w);
        const translations = formWordTranslations.split(',').map(t => t.trim()).filter(t => t);
        
        if (words.length === 0 || translations.length === 0) {
          alert('请填写单词和翻译');
          return;
        }
        
        if (words.length !== translations.length) {
          alert('单词和翻译的数量必须相同');
          return;
        }

        questionData.words = words;
        questionData.wordTranslations = translations;
      }

      if (editingQuestion) {
        updateQuestion(editingQuestion.id, questionData);
      } else {
        addQuestion(questionData);
      }

      loadData();
      setIsQuestionDialogOpen(false);
    } else {
      alert('请填写完整信息');
    }
  };

  // 删除题目
  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(questionId);
    loadData();
    setDeleteConfirm(null);
  };

  // 渲染题目图标
  const renderQuestionIcon = (type: string) => {
    switch (type) {
      case 'matching':
        return <Link2 className="w-4 h-4 text-blue-500" />;
      case 'spelling':
        return <PencilLine className="w-4 h-4 text-orange-500" />;
      case 'fill-in-blank':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'dialogue':
        return <MessageCircle className="w-4 h-4 text-pink-500" />;
      default:
        return <Type className="w-4 h-4 text-green-500" />;
    }
  };

  // 渲染题目标签
  const renderQuestionBadge = (type: string) => {
    const badges = {
      'matching': { text: '连线题', color: 'bg-blue-100 text-blue-700' },
      'spelling': { text: '单词拼写', color: 'bg-orange-100 text-orange-700' },
      'fill-in-blank': { text: '填空题', color: 'bg-purple-100 text-purple-700' },
      'dialogue': { text: '对话题', color: 'bg-pink-100 text-pink-700' },
      'sentence-building': { text: '拼句子', color: 'bg-green-100 text-green-700' },
    };
    const badge = badges[type as keyof typeof badges] || badges['sentence-building'];
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // 递归渲染文件夹树
  const renderFolderTree = (parentId: string | undefined, level: number = 0) => {
    const childFolders = getChildFolders(parentId);
    const folderQuestions = getFolderQuestions(parentId);

    return (
      <div className={level > 0 ? 'ml-6' : ''}>
        {/* 文件夹 */}
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const totalCount = getFolderTotalCount(folder.id);

          return (
            <div key={folder.id} className="mb-2">
              {/* 文件夹头部 */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                <div className={`w-3 h-3 rounded-full ${folder.color}`} />
                
                <span className="flex-1 font-medium">{folder.name}</span>
                
                <span className="text-xs text-gray-500">{totalCount} 题</span>
                
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  {/* 叶子目录显示全部播放按钮 */}
                  {isLeafFolder(folder.id) && totalCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStartPlaylist(getAllFolderQuestions(folder.id))}
                      className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="全部播放"
                    >
                      <PlayCircle className="w-3 h-3 mr-1" />
                      <span className="text-xs">全部播放</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddQuestion(folder.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddFolder(folder.id)}
                    className="h-7 w-7 p-0"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditFolder(folder)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm({ type: 'folder', id: folder.id, name: folder.name })}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 展开内容 */}
              {isExpanded && (
                <div className="ml-6 mt-2">
                  {/* 该文件夹下的题目 */}
                  {getFolderQuestions(folder.id).map(question => (
                    <div
                      key={question.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group mb-1"
                    >
                      {renderQuestionIcon(question.type)}
                      <span className="flex-1 text-sm">{question.sentence}</span>
                      {renderQuestionBadge(question.type)}
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onStartGame(question)}
                          className="h-7 w-7 p-0"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuestion(question)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirm({ type: 'question', id: question.id, name: question.sentence })}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* 递归渲染子文件夹 */}
                  {renderFolderTree(folder.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* 根级别的题目（未分类） */}
        {parentId === undefined && folderQuestions.map(question => (
          <div
            key={question.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group mb-1"
          >
            {renderQuestionIcon(question.type)}
            <span className="flex-1 text-sm">{question.sentence}</span>
            {renderQuestionBadge(question.type)}
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStartGame(question)}
                className="h-7 w-7 p-0"
              >
                <Play className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditQuestion(question)}
                className="h-7 w-7 p-0"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteConfirm({ type: 'question', id: question.id, name: question.sentence })}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-8">
      <Card className="max-w-6xl mx-auto p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主页
            </Button>
            <h1 className="text-purple-600">📚 题库管理</h1>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => handleAddFolder()}>
              <FolderPlus className="w-4 h-4 mr-2" />
              新建文件夹
            </Button>
            <Button onClick={() => handleAddQuestion()}>
              <Plus className="w-4 h-4 mr-2" />
              新建题目
            </Button>
          </div>
        </div>

        {/* 树形列表 */}
        <div className="bg-white rounded-lg p-4 min-h-[400px]">
          {folders.length === 0 && questions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>还没有任何题目，点击"新建题目"开始创建吧！</p>
            </div>
          ) : (
            renderFolderTree(undefined)
          )}
        </div>
      </Card>

      {/* 文件夹对话框 */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? '编辑文件夹' : '新建文件夹'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="folder-name">文件夹名称</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="例如：基础句型"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="folder-color">颜色</Label>
              <Select value={folderColor} onValueChange={setFolderColor}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${option.value}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="parent-folder">父文件夹（可选）</Label>
              <Select 
                value={parentFolderId || 'none'} 
                onValueChange={val => setParentFolderId(val === 'none' ? undefined : val)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无（根目录）</SelectItem>
                  {folders
                    .filter(f => !editingFolder || f.id !== editingFolder.id)
                    .map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {getFolderPath(folder.id)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveFolder}>
              {editingFolder ? '保存' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 题目对话框 */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? '编辑题目' : '新建题目'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 题目类型 */}
            <div>
              <Label>题目类型</Label>
              <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentence-building">拼句子题</SelectItem>
                  <SelectItem value="matching">连线题</SelectItem>
                  <SelectItem value="spelling">单词拼写题</SelectItem>
                  <SelectItem value="fill-in-blank">填空题</SelectItem>
                  <SelectItem value="dialogue">对话题</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 单词拼写题特有字段 */}
            {formType === 'spelling' ? (
              <>
                <div>
                  <Label htmlFor="word">单词</Label>
                  <Input
                    id="word"
                    value={formWord}
                    onChange={e => setFormWord(e.target.value)}
                    placeholder="例如：apple"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phonetic">音标（可选）</Label>
                  <Input
                    id="phonetic"
                    value={formPhonetic}
                    onChange={e => setFormPhonetic(e.target.value)}
                    placeholder="例如：/ˈæp.əl/"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="meaning">正确的中文意思</Label>
                  <Input
                    id="meaning"
                    value={formMeaning}
                    onChange={e => setFormMeaning(e.target.value)}
                    placeholder="例如：苹果"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="distractors">3个干扰选项（用逗号分隔）</Label>
                  <Input
                    id="distractors"
                    value={formDistractors}
                    onChange={e => setFormDistractors(e.target.value)}
                    placeholder="例如：香蕉, 橙子, 葡萄"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">提供3个错误的中文意思作为干扰项</p>
                </div>
              </>
            ) : formType === 'dialogue' ? (
              <>
                <div>
                  <Label htmlFor="question">问题（英文）</Label>
                  <Input
                    id="question"
                    value={formQuestion}
                    onChange={e => setFormQuestion(e.target.value)}
                    placeholder="例如：What is your name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="answer">回答（英文）</Label>
                  <Input
                    id="answer"
                    value={formAnswer}
                    onChange={e => setFormAnswer(e.target.value)}
                    placeholder="例如：My name is Tom"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="dialogue-translation">中文翻译</Label>
                  <Input
                    id="dialogue-translation"
                    value={formTranslation}
                    onChange={e => setFormTranslation(e.target.value)}
                    placeholder="例如：你叫什么名字？我叫汤姆。"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="show-question">练习模式</Label>
                  <select
                    id="show-question"
                    value={formShowQuestion ? 'question' : 'answer'}
                    onChange={e => setFormShowQuestion(e.target.value === 'question')}
                    className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                  >
                    <option value="question">显示问题，让孩子拼回答</option>
                    <option value="answer">显示回答，让孩子拼问题</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="sentence">
                    {formType === 'matching' ? '题目标题' : formType === 'fill-in-blank' ? '英文句子（用 ___ 标记填空位置）' : '英文句子'}
                  </Label>
                  <Textarea
                    id="sentence"
                    value={formSentence}
                    onChange={e => setFormSentence(e.target.value)}
                    placeholder={
                      formType === 'fill-in-blank' 
                        ? '例如：I ___ to school every day'
                        : undefined
                    }
                    className="mt-2"
                    rows={3}
                  />
                  {formType === 'fill-in-blank' && (
                    <p className="text-xs text-gray-500 mt-1">使用三个下划线 ___ 标记每个填空位置</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="translation">
                    {formType === 'matching' ? '题目描述' : '中文翻译'}
                  </Label>
                  <div className="relative">
                    {formType === 'sentence-building' && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <Languages className="w-3 h-3" />
                        <span>自动生成，可修改</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="translation"
                    value={formTranslation}
                    onChange={e => setFormTranslation(e.target.value)}
                    placeholder={
                      formType === 'matching' 
                        ? '例如：学习常见动物的英文单词' 
                        : formType === 'fill-in-blank'
                        ? '例如：我每天去上学'
                        : '中文翻译'
                    }
                  />
                </div>

                {/* 连线题特有字段 */}
                {formType === 'matching' && (
                  <>
                    <div>
                      <Label htmlFor="words">英文单词（用逗号分隔）</Label>
                      <Input
                        id="words"
                        value={formWords}
                        onChange={e => setFormWords(e.target.value)}
                        placeholder="例如：dog, cat, bird, fish"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wordTranslations">中文翻译（用逗号分隔，顺序对应）</Label>
                      <Input
                        id="wordTranslations"
                        value={formWordTranslations}
                        onChange={e => setFormWordTranslations(e.target.value)}
                        placeholder="例如：狗, 猫, 鸟, 鱼"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">中文翻译的顺序必须与英文单词对应</p>
                    </div>
                  </>
                )}

                {/* 填空题特有字段 */}
                {formType === 'fill-in-blank' && (
                  <div>
                    <Label htmlFor="blanks">填空答案（用逗号分隔，顺序对应）</Label>
                    <Input
                      id="blanks"
                      value={formBlanks}
                      onChange={e => setFormBlanks(e.target.value)}
                      placeholder="例如：go"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">按照填空的顺序填写答案，用逗号分隔</p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="folder">所属文件夹</Label>
              <Select
                value={formFolderId || 'none'}
                onValueChange={val => setFormFolderId(val === 'none' ? undefined : val)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分类</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {getFolderPath(folder.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveQuestion}>
              {editingQuestion ? '保存' : '创建'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'folder' ? (
                <>
                  确定要删除文件夹 <strong>"{deleteConfirm.name}"</strong> 吗？
                  <br />
                  <span className="text-red-600">
                    这将同时删除该文件夹下的所有子文件夹和题目，此操作无法撤销！
                  </span>
                </>
              ) : (
                <>
                  确定要删除题目 <strong>"{deleteConfirm?.name}"</strong> 吗？
                  <br />
                  此操作无法撤销。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === 'folder') {
                  handleDeleteFolder(deleteConfirm.id);
                } else if (deleteConfirm) {
                  handleDeleteQuestion(deleteConfirm.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
