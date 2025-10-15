import React, { useState, useEffect } from 'react';
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
  DialogFooter,
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
import { Plus, Edit2, Trash2, Play, FolderOpen, Languages, Type, Link2, PencilLine, FileText, MessageCircle } from 'lucide-react';
import {
  Question,
  Folder,
  loadQuestions,
  loadFolders,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from '../utils/storage';
import { translateSentence } from '../utils/translator';

interface QuestionManagerProps {
  onStartGame: (question: Question) => void;
}

export function QuestionManager({ onStartGame }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  
  // 对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // 表单状态
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formType, setFormType] = useState<'sentence-building' | 'matching' | 'spelling' | 'fill-in-blank' | 'dialogue'>('sentence-building');
  const [formSentence, setFormSentence] = useState('');
  const [formTranslation, setFormTranslation] = useState('');
  const [formWords, setFormWords] = useState('');
  const [formWordTranslations, setFormWordTranslations] = useState('');
  // 单词拼写题字段
  const [formWord, setFormWord] = useState('');
  const [formPhonetic, setFormPhonetic] = useState('');
  const [formMeaning, setFormMeaning] = useState('');
  const [formDistractors, setFormDistractors] = useState('');
  // 填空题字段
  const [formBlanks, setFormBlanks] = useState('');
  // 对话题字段
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formShowQuestion, setFormShowQuestion] = useState(true);
  const [formFolderId, setFormFolderId] = useState<string | undefined>(undefined);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setQuestions(loadQuestions());
    setFolders(loadFolders());
  };

  // 自动翻译（仅对拼句子题）
  useEffect(() => {
    if (formType === 'sentence-building' && formSentence.trim()) {
      const translated = translateSentence(formSentence.trim());
      setFormTranslation(translated);
    } else if (formType === 'matching') {
      // 连线题不自动翻译
      // 保持当前的translation值不变
    } else {
      setFormTranslation('');
    }
  }, [formSentence, formType]);

  // 打开新建对话框
  const handleOpenAddDialog = () => {
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
    setFormFolderId(selectedFolder);
    setIsAddDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEditDialog = (question: Question) => {
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
    setIsEditDialogOpen(true);
  };

  // 保存新题目
  const handleAddQuestion = () => {
    // 单词拼写题验证
    if (formType === 'spelling') {
      if (!formWord.trim() || !formMeaning.trim()) {
        alert('单词拼写题需要填写单词和中文意思');
        return;
      }
      
      const distractors = formDistractors.split(',').map(d => d.trim()).filter(d => d);
      if (distractors.length !== 3) {
        alert('需要提供3个干扰选项（错误的中文意思），用逗号分隔');
        return;
      }
      
      addQuestion({
        type: 'spelling',
        sentence: formWord.trim(),
        translation: formMeaning.trim(),
        word: formWord.trim(),
        phonetic: formPhonetic.trim() || undefined,
        meaning: formMeaning.trim(),
        distractors: distractors,
        folderId: formFolderId,
      });
      
      loadData();
      setIsAddDialogOpen(false);
      return;
    }
    
    // 填空题验证
    if (formType === 'fill-in-blank') {
      if (!formSentence.trim() || !formTranslation.trim()) {
        alert('填空题需要填写句子和中文翻译');
        return;
      }
      
      // 统计句子中 ___ 的数量
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
      
      addQuestion({
        type: 'fill-in-blank',
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        blanks: blanks,
        folderId: formFolderId,
      });
      
      loadData();
      setIsAddDialogOpen(false);
      return;
    }
    
    // 对话题验证
    if (formType === 'dialogue') {
      if (!formQuestion.trim() || !formAnswer.trim() || !formTranslation.trim()) {
        alert('对话题需要填写问题、回答和中文翻译');
        return;
      }
      
      addQuestion({
        type: 'dialogue',
        sentence: `${formQuestion.trim()} / ${formAnswer.trim()}`,
        translation: formTranslation.trim(),
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        showQuestion: formShowQuestion,
        folderId: formFolderId,
      });
      
      loadData();
      setIsAddDialogOpen(false);
      return;
    }
    
    if (formSentence.trim() && formTranslation.trim()) {
      const questionData: any = {
        type: formType,
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        folderId: formFolderId,
      };

      // 连线题需要额外的字段
      if (formType === 'matching') {
        const words = formWords.split(',').map(w => w.trim()).filter(w => w);
        const translations = formWordTranslations.split(',').map(t => t.trim()).filter(t => t);
        
        if (words.length === 0 || translations.length === 0 || words.length !== translations.length) {
          alert('连线题的单词和翻译数量必须相同且不能为空');
          return;
        }

        questionData.words = words;
        questionData.wordTranslations = translations;
      }

      addQuestion(questionData);
      loadData();
      setIsAddDialogOpen(false);
    }
  };

  // 保存编辑
  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;
    
    // 单词拼写题验证
    if (formType === 'spelling') {
      if (!formWord.trim() || !formMeaning.trim()) {
        alert('单词拼写题需要填写单词和中文意思');
        return;
      }
      
      const distractors = formDistractors.split(',').map(d => d.trim()).filter(d => d);
      if (distractors.length !== 3) {
        alert('需要提供3个干扰选项（错误的中文意思），用逗号分隔');
        return;
      }
      
      updateQuestion(editingQuestion.id, {
        type: 'spelling',
        sentence: formWord.trim(),
        translation: formMeaning.trim(),
        word: formWord.trim(),
        phonetic: formPhonetic.trim() || undefined,
        meaning: formMeaning.trim(),
        distractors: distractors,
        folderId: formFolderId,
      });
      
      loadData();
      setIsEditDialogOpen(false);
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
      
      updateQuestion(editingQuestion.id, {
        type: 'fill-in-blank',
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        blanks: blanks,
        folderId: formFolderId,
      });
      
      loadData();
      setIsEditDialogOpen(false);
      return;
    }
    
    // 对话题验证
    if (formType === 'dialogue') {
      if (!formQuestion.trim() || !formAnswer.trim() || !formTranslation.trim()) {
        alert('对话题需要填写问题、回答和中文翻译');
        return;
      }
      
      updateQuestion(editingQuestion.id, {
        type: 'dialogue',
        sentence: `${formQuestion.trim()} / ${formAnswer.trim()}`,
        translation: formTranslation.trim(),
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        showQuestion: formShowQuestion,
        folderId: formFolderId,
      });
      
      loadData();
      setIsEditDialogOpen(false);
      return;
    }
    
    if (formSentence.trim() && formTranslation.trim()) {
      const updates: any = {
        type: formType,
        sentence: formSentence.trim(),
        translation: formTranslation.trim(),
        folderId: formFolderId,
      };

      // 连线题需要额外的字段
      if (formType === 'matching') {
        const words = formWords.split(',').map(w => w.trim()).filter(w => w);
        const translations = formWordTranslations.split(',').map(t => t.trim()).filter(t => t);
        
        if (words.length === 0 || translations.length === 0 || words.length !== translations.length) {
          alert('连线题的单词和翻译数量必须相同且不能为空');
          return;
        }

        updates.words = words;
        updates.wordTranslations = translations;
      } else {
        updates.words = undefined;
        updates.wordTranslations = undefined;
      }

      updateQuestion(editingQuestion.id, updates);
      loadData();
      setIsEditDialogOpen(false);
    }
  };

  // 删除题目
  const handleDeleteQuestion = (id: string) => {
    deleteQuestion(id);
    loadData();
    setDeleteConfirmId(null);
  };

  // 筛选题目
  const filteredQuestions = questions.filter(q => {
    if (selectedFolder === undefined) {
      return !q.folderId; // 未分类
    }
    return q.folderId === selectedFolder;
  });

  // 获取目录名称
  const getFolderName = (folderId?: string) => {
    if (!folderId) return '未分类';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || '未知目录';
  };

  // 获取目录颜色
  const getFolderColor = (folderId?: string) => {
    if (!folderId) return 'bg-gray-100 text-gray-700';
    const folder = folders.find(f => f.id === folderId);
    return folder?.color || 'bg-gray-100 text-gray-700';
  };

  // 统计每个目录的题目数量
  const getFolderCount = (folderId?: string) => {
    return questions.filter(q => q.folderId === folderId).length;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-6">
        {/* 左侧：目录列表 */}
        <Card className="w-64 p-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-purple-600">目录</h2>
          </div>

          <div className="space-y-1">
            {/* 未分类 */}
            <button
              onClick={() => setSelectedFolder(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedFolder === undefined
                  ? 'bg-purple-100 text-purple-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span>未分类</span>
                </div>
                <span className="text-xs text-gray-500">{getFolderCount(undefined)}</span>
              </div>
            </button>

            {/* 其他目录 */}
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${folder.color}`} />
                    <span>{folder.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{getFolderCount(folder.id)}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* 右侧：题目列表 */}
        <div className="flex-1">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-purple-600">
                {selectedFolder === undefined
                  ? '未分类题目'
                  : getFolderName(selectedFolder)}
              </h1>
              <Button
                onClick={handleOpenAddDialog}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建题目
              </Button>
            </div>

            {/* 题目列表 */}
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>暂无题目</p>
                <p className="text-sm mt-2">点击"新建题目"添加第一道题</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map(question => (
                  <div
                    key={question.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {question.type === 'matching' ? (
                            <Link2 className="w-4 h-4 text-blue-500" />
                          ) : question.type === 'spelling' ? (
                            <PencilLine className="w-4 h-4 text-orange-500" />
                          ) : question.type === 'fill-in-blank' ? (
                            <FileText className="w-4 h-4 text-purple-500" />
                          ) : question.type === 'dialogue' ? (
                            <MessageCircle className="w-4 h-4 text-pink-500" />
                          ) : (
                            <Type className="w-4 h-4 text-green-500" />
                          )}
                          <p className="text-gray-800">{question.sentence}</p>
                        </div>
                        <p className="text-sm text-gray-500">{question.translation}</p>
                        {question.type === 'matching' && question.words && (
                          <p className="text-xs text-gray-400 mt-1">
                            {question.words.length} 组单词配对
                          </p>
                        )}
                        {question.type === 'spelling' && question.distractors && (
                          <p className="text-xs text-gray-400 mt-1">
                            拼写单词 + {question.distractors.length + 1} 个选项
                          </p>
                        )}
                        {question.type === 'fill-in-blank' && question.blanks && (
                          <p className="text-xs text-gray-400 mt-1">
                            {question.blanks.length} 个填空
                          </p>
                        )}
                        {question.type === 'dialogue' && (
                          <p className="text-xs text-gray-400 mt-1">
                            {question.showQuestion ? '显示问题，拼回答' : '显示回答，拼问题'}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            question.type === 'matching' 
                              ? 'bg-blue-100 text-blue-700' 
                              : question.type === 'spelling'
                              ? 'bg-orange-100 text-orange-700'
                              : question.type === 'fill-in-blank'
                              ? 'bg-purple-100 text-purple-700'
                              : question.type === 'dialogue'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {question.type === 'matching' ? '连线题' : question.type === 'spelling' ? '单词拼写' : question.type === 'fill-in-blank' ? '填空题' : question.type === 'dialogue' ? '对话题' : '拼句子'}
                          </span>
                          {question.folderId && (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs ${getFolderColor(
                                question.folderId
                              )}`}
                            >
                              {getFolderName(question.folderId)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => onStartGame(question)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditDialog(question)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(question.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 新建题目对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建题目</DialogTitle>
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
                </SelectContent>
              </Select>
            </div>

            {/* 单词拼写题特有字段 */}
            {formType === 'spelling' ? (
              <>
                <div>
                  <Label htmlFor="add-word">英文单词</Label>
                  <Input
                    id="add-word"
                    value={formWord}
                    onChange={e => setFormWord(e.target.value)}
                    placeholder="例如：apple"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-phonetic">音标（可选）</Label>
                  <Input
                    id="add-phonetic"
                    value={formPhonetic}
                    onChange={e => setFormPhonetic(e.target.value)}
                    placeholder="例如：/ˈæp.əl/"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">建议填写音标，帮助孩子学习发音</p>
                </div>
                <div>
                  <Label htmlFor="add-meaning">正确的中文意思</Label>
                  <Input
                    id="add-meaning"
                    value={formMeaning}
                    onChange={e => setFormMeaning(e.target.value)}
                    placeholder="例如：苹果"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-distractors">干扰选项（3个错误的中文意思，用逗号分隔）</Label>
                  <Input
                    id="add-distractors"
                    value={formDistractors}
                    onChange={e => setFormDistractors(e.target.value)}
                    placeholder="例如：香蕉, 橙子, 葡萄"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">提供3个错误的中文意思作为干扰项</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="add-sentence">
                    {formType === 'matching' ? '题目标题' : formType === 'fill-in-blank' ? '英文句子（用 ___ 标记填空位置）' : '英文句子'}
                  </Label>
                  <Textarea
                    id="add-sentence"
                    value={formSentence}
                    onChange={e => setFormSentence(e.target.value)}
                    placeholder={
                      formType === 'matching' 
                        ? '例如：动物单词' 
                        : formType === 'fill-in-blank'
                        ? '例如：I ___ to school every day'
                        : '例如：How many classes do you have'
                    }
                    className="mt-2"
                    rows={3}
                  />
                  {formType === 'fill-in-blank' && (
                    <p className="text-xs text-gray-500 mt-1">使用三个下划线 ___ 标记每个填空位置</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="add-translation">
                      {formType === 'matching' ? '题目描述' : '中文翻译'}
                    </Label>
                    {formType === 'sentence-building' && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Languages className="w-3 h-3" />
                        <span>自动生成，可修改</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="add-translation"
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
                      <Label htmlFor="add-words">英文单词（用逗号分隔）</Label>
                      <Input
                        id="add-words"
                        value={formWords}
                        onChange={e => setFormWords(e.target.value)}
                        placeholder="例如：dog, cat, bird, fish"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-word-translations">中文翻译（用逗号分隔，顺序对应）</Label>
                      <Input
                        id="add-word-translations"
                        value={formWordTranslations}
                        onChange={e => setFormWordTranslations(e.target.value)}
                        placeholder="例如：狗, 猫, 鸟, 鱼"
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
                
                {/* 填空题特有字段 */}
                {formType === 'fill-in-blank' && (
                  <div>
                    <Label htmlFor="add-blanks">填空答案（用逗号分隔，顺序对应）</Label>
                    <Input
                      id="add-blanks"
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

            {/* 对话题特有字段 */}
            {formType === 'dialogue' && (
              <>
                <div>
                  <Label htmlFor="add-question">问题（英文）</Label>
                  <Input
                    id="add-question"
                    value={formQuestion}
                    onChange={e => setFormQuestion(e.target.value)}
                    placeholder="例如：What is your name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-answer">回答（英文）</Label>
                  <Input
                    id="add-answer"
                    value={formAnswer}
                    onChange={e => setFormAnswer(e.target.value)}
                    placeholder="例如：My name is Tom"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-dialogue-translation">中文翻译</Label>
                  <Input
                    id="add-dialogue-translation"
                    value={formTranslation}
                    onChange={e => setFormTranslation(e.target.value)}
                    placeholder="例如：你叫什么名字？我叫汤姆。"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="add-show-question">练习模式</Label>
                  <select
                    id="add-show-question"
                    value={formShowQuestion ? 'question' : 'answer'}
                    onChange={e => setFormShowQuestion(e.target.value === 'question')}
                    className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                  >
                    <option value="question">显示问题，让孩子拼回答</option>
                    <option value="answer">显示回答，让孩子拼问题</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">选择显示对话的哪一方，让孩子拼出另一方</p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="add-folder">所属目录</Label>
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
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={
                formType === 'spelling' 
                  ? (!formWord.trim() || !formMeaning.trim())
                  : (!formSentence.trim() || !formTranslation.trim())
              }
              className="bg-purple-500 hover:bg-purple-600"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑题目对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑题目</DialogTitle>
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
                </SelectContent>
              </Select>
            </div>

            {/* 单词拼写题特有字段 */}
            {formType === 'spelling' ? (
              <>
                <div>
                  <Label htmlFor="edit-word">英文单词</Label>
                  <Input
                    id="edit-word"
                    value={formWord}
                    onChange={e => setFormWord(e.target.value)}
                    placeholder="例如：apple"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phonetic">音标（可选）</Label>
                  <Input
                    id="edit-phonetic"
                    value={formPhonetic}
                    onChange={e => setFormPhonetic(e.target.value)}
                    placeholder="例如：/ˈæp.əl/"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">建议填写音标，帮助孩子学习发音</p>
                </div>
                <div>
                  <Label htmlFor="edit-meaning">正确的中文意思</Label>
                  <Input
                    id="edit-meaning"
                    value={formMeaning}
                    onChange={e => setFormMeaning(e.target.value)}
                    placeholder="例如：苹果"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-distractors">干扰选项（3个错误的中文意思，用逗号分隔）</Label>
                  <Input
                    id="edit-distractors"
                    value={formDistractors}
                    onChange={e => setFormDistractors(e.target.value)}
                    placeholder="例如：香蕉, 橙子, 葡萄"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">提供3个错误的中文意思作为干扰项</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="edit-sentence">
                    {formType === 'matching' ? '题目标题' : formType === 'fill-in-blank' ? '英文句子（用 ___ 标记填空位置）' : '英文句子'}
                  </Label>
                  <Textarea
                    id="edit-sentence"
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
                  <Label htmlFor="edit-translation">
                    {formType === 'matching' ? '题目描述' : '中文翻译'}
                  </Label>
                  <Input
                    id="edit-translation"
                    value={formTranslation}
                    onChange={e => setFormTranslation(e.target.value)}
                    placeholder={
                      formType === 'fill-in-blank' 
                        ? '例如：我每天去上学'
                        : undefined
                    }
                  />
                </div>

                {/* 连线题特有字段 */}
                {formType === 'matching' && (
                  <>
                    <div>
                      <Label htmlFor="edit-words">英文单词（用逗号分隔）</Label>
                      <Input
                        id="edit-words"
                        value={formWords}
                        onChange={e => setFormWords(e.target.value)}
                        placeholder="例如：dog, cat, bird, fish"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-word-translations">中文翻译（用逗号分隔，顺序对应）</Label>
                      <Input
                        id="edit-word-translations"
                        value={formWordTranslations}
                        onChange={e => setFormWordTranslations(e.target.value)}
                        placeholder="例如：狗, 猫, 鸟, 鱼"
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
                
                {/* 填空题特有字段 */}
                {formType === 'fill-in-blank' && (
                  <div>
                    <Label htmlFor="edit-blanks">填空答案（用逗号分隔，顺序对应）</Label>
                    <Input
                      id="edit-blanks"
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

            {/* 对话题特有字段 */}
            {formType === 'dialogue' && (
              <>
                <div>
                  <Label htmlFor="edit-question">问题（英文）</Label>
                  <Input
                    id="edit-question"
                    value={formQuestion}
                    onChange={e => setFormQuestion(e.target.value)}
                    placeholder="例如：What is your name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-answer">回答（英文）</Label>
                  <Input
                    id="edit-answer"
                    value={formAnswer}
                    onChange={e => setFormAnswer(e.target.value)}
                    placeholder="例如：My name is Tom"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dialogue-translation">中文翻译</Label>
                  <Input
                    id="edit-dialogue-translation"
                    value={formTranslation}
                    onChange={e => setFormTranslation(e.target.value)}
                    placeholder="例如：你叫什么名字？我叫汤姆。"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-show-question">练习模式</Label>
                  <select
                    id="edit-show-question"
                    value={formShowQuestion ? 'question' : 'answer'}
                    onChange={e => setFormShowQuestion(e.target.value === 'question')}
                    className="mt-2 w-full h-10 px-3 rounded-md border border-gray-300"
                  >
                    <option value="question">显示问题，让孩子拼回答</option>
                    <option value="answer">显示回答，让孩子拼问题</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">选择显示对话的哪一方，让孩子拼出另一方</p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="edit-folder">所属目录</Label>
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
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleUpdateQuestion}
              disabled={
                formType === 'spelling' 
                  ? (!formWord.trim() || !formMeaning.trim())
                  : (!formSentence.trim() || !formTranslation.trim())
              }
              className="bg-purple-500 hover:bg-purple-600"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这道题目吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteQuestion(deleteConfirmId)}
              className="bg-red-500 hover:bg-red-600"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
