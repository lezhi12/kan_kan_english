// 数据类型定义
export interface Question {
  id: string;
  type: 'sentence-building' | 'matching' | 'spelling' | 'fill-in-blank' | 'dialogue'; // 题目类型
  sentence: string;
  translation: string;
  words?: string[]; // 连线题的英文单词列表
  wordTranslations?: string[]; // 连线题的中文翻译列表
  word?: string; // 单词拼写题 - 要拼写的单词
  phonetic?: string; // 单词拼写题 - 音标
  meaning?: string; // 单词拼写题 - 正确的中文意思
  distractors?: string[]; // 单词拼写题 - 3个干扰选项（错误的中文意思）
  blanks?: string[]; // 填空题 - 正确答案数组（sentence中用___标记空白位置）
  question?: string; // 对话题 - 问题
  answer?: string; // 对话题 - 回答
  showQuestion?: boolean; // 对话题 - true显示问题让孩子拼回答，false显示回答让孩子拼问题
  folderId?: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  parentId?: string; // 父目录ID，用于支持二级目录
  createdAt: number;
}

// 本地存储键
const QUESTIONS_KEY = 'english_learning_questions';
const FOLDERS_KEY = 'english_learning_folders';

// 题目管理
export function saveQuestions(questions: Question[]): void {
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
}

export function loadQuestions(): Question[] {
  const data = localStorage.getItem(QUESTIONS_KEY);
  if (!data) return [];
  
  const questions = JSON.parse(data);
  
  // 迁移旧数据：为没有type字段的题目添加默认类型
  const migratedQuestions = questions.map((q: any) => {
    if (!q.type) {
      return { ...q, type: 'sentence-building' };
    }
    return q;
  });
  
  // 如果有迁移，保存更新后的数据
  if (migratedQuestions.some((q: any, i: number) => !questions[i].type)) {
    saveQuestions(migratedQuestions);
  }
  
  return migratedQuestions;
}

export function addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Question {
  const questions = loadQuestions();
  const newQuestion: Question = {
    ...question,
    id: generateId(),
    createdAt: Date.now(),
  };
  questions.push(newQuestion);
  saveQuestions(questions);
  return newQuestion;
}

export function updateQuestion(id: string, updates: Partial<Question>): void {
  const questions = loadQuestions();
  const index = questions.findIndex(q => q.id === id);
  if (index !== -1) {
    questions[index] = { ...questions[index], ...updates };
    saveQuestions(questions);
  }
}

export function deleteQuestion(id: string): void {
  const questions = loadQuestions();
  const filtered = questions.filter(q => q.id !== id);
  saveQuestions(filtered);
}

export function getQuestionsByFolder(folderId?: string): Question[] {
  const questions = loadQuestions();
  if (folderId === undefined) {
    return questions.filter(q => !q.folderId);
  }
  return questions.filter(q => q.folderId === folderId);
}

// 目录管理
export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function loadFolders(): Folder[] {
  const data = localStorage.getItem(FOLDERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addFolder(data: { name: string; color: string; parentId?: string }): Folder {
  const folders = loadFolders();
  const newFolder: Folder = {
    id: generateId(),
    name: data.name,
    color: data.color,
    parentId: data.parentId,
    createdAt: Date.now(),
  };
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
}

export function updateFolder(id: string, updates: Partial<Folder>): void {
  const folders = loadFolders();
  const index = folders.findIndex(f => f.id === id);
  if (index !== -1) {
    folders[index] = { ...folders[index], ...updates };
    saveFolders(folders);
  }
}

export function deleteFolder(id: string): void {
  const folders = loadFolders();
  
  // 获取所有需要删除的folder ID（包括子目录）
  const idsToDelete = new Set<string>();
  const collectChildIds = (parentId: string) => {
    idsToDelete.add(parentId);
    folders
      .filter(f => f.parentId === parentId)
      .forEach(f => collectChildIds(f.id));
  };
  collectChildIds(id);
  
  // 删除目录时，将这些目录下的题目移到未分类
  const questions = loadQuestions();
  questions.forEach(q => {
    if (q.folderId && idsToDelete.has(q.folderId)) {
      q.folderId = undefined;
    }
  });
  saveQuestions(questions);

  // 删除目录（包括子目录）
  const filtered = folders.filter(f => !idsToDelete.has(f.id));
  saveFolders(filtered);
}

// 根据路径查找folder，如果不存在则创建
// 支持路径格式：
// - "基础句型" - 创建一级目录
// - "基础句型/基础1" - 创建二级目录（基础1是基础句型的子目录）
export function findOrCreateFolder(path: string): Folder {
  const folders = loadFolders();
  
  // 使用 / 分隔路径
  const parts = path.split('/').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length === 0) {
    throw new Error('目录路径不能为空');
  }
  
  // 预设颜色
  const presetColors = [
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-yellow-200 text-yellow-800',
    'bg-orange-200 text-orange-800',
    'bg-red-200 text-red-800',
    'bg-indigo-200 text-indigo-800',
  ];
  
  let parentId: string | undefined = undefined;
  let currentFolder: Folder | undefined;
  
  // 逐级处理路径
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i];
    
    // 查找当前层级是否已存在该目录
    currentFolder = loadFolders().find(f => 
      f.name === name && f.parentId === parentId
    );
    
    // 如果不存在，创建新目录
    if (!currentFolder) {
      const allFolders = loadFolders();
      const colorIndex = allFolders.length % presetColors.length;
      const color = presetColors[colorIndex];
      
      currentFolder = addFolder({ name, color, parentId });
    }
    
    // 设置为下一级的父目录
    parentId = currentFolder.id;
  }
  
  // 返回最后一级目录
  return currentFolder!;
}

// 获取folder的完整路径
export function getFolderPath(folderId: string): string {
  const folders = loadFolders();
  const parts: string[] = [];
  
  let currentId: string | undefined = folderId;
  while (currentId) {
    const folder = folders.find(f => f.id === currentId);
    if (!folder) break;
    
    parts.unshift(folder.name);
    currentId = folder.parentId;
  }
  
  return parts.join(' / ');
}

// 获取指定目录的子目录
export function getChildFolders(parentId?: string): Folder[] {
  const folders = loadFolders();
  return folders.filter(f => f.parentId === parentId);
}

// 获取所有一级目录（没有父目录的）
export function getRootFolders(): Folder[] {
  return getChildFolders(undefined);
}

// 工具函数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
