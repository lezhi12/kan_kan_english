// 常见句子的完整翻译映射
const sentencePatterns: Record<string, string> = {
  // 疑问句
  'how many classes do you have': '你有多少节课',
  'how many students are there': '有多少学生',
  'how many books do you have': '你有多少本书',
  'how old are you': '你多大了',
  'how are you': '你好吗',
  'how do you feel': '你感觉怎么样',
  
  'what is your name': '你叫什么名字',
  'what is your favorite color': '你最喜欢的颜色是什么',
  'what is your favorite food': '你最喜欢的食物是什么',
  'what do you like': '你喜欢什么',
  'what do you like to eat': '你喜欢吃什么',
  'what do you want': '你想要什么',
  'what time is it': '现在几点了',
  'what color is it': '它是什么颜色',
  'what are you doing': '你在做什么',
  
  'where do you live': '你住在哪里',
  'where are you from': '你从哪里来',
  'where is the book': '书在哪里',
  'where is my bag': '我的包在哪里',
  
  'when do you go to school': '你什么时候去上学',
  'when is your birthday': '你的生日是什么时候',
  
  'who is your teacher': '谁是你的老师',
  'who is your best friend': '谁是你最好的朋友',
  'who is that': '那是谁',
  
  'why do you like it': '你为什么喜欢它',
  'why are you happy': '你为什么开心',
  
  'do you have a pet': '你有宠物吗',
  'do you like apples': '你喜欢苹果吗',
  'can you swim': '你会游泳吗',
  'can you help me': '你能帮我吗',
  'are you happy': '你开心吗',
  'is it cold': '冷吗',
  
  // 陈述句
  'i like to play basketball': '我喜欢打篮球',
  'i like to play football': '我喜欢踢足球',
  'i love my family': '我爱我的家人',
  'i love my dog': '我爱我的狗',
  'i have a cat': '我有一只猫',
  'i have a dog': '我有一只狗',
  'i have two cats': '我有两只猫',
  'i am a student': '我是一名学生',
  'i am happy': '我很开心',
  'i am hungry': '我饿了',
  'i can swim': '我会游泳',
  'i can read': '我会阅读',
  'i go to school': '我去上学',
  'i like apples': '我喜欢苹果',
  'i like red': '我喜欢红色',
  'i want to play': '我想玩',
  
  'this is my school': '这是我的学校',
  'this is my book': '这是我的书',
  'this is my friend': '这是我的朋友',
  'that is my teacher': '那是我的老师',
  
  'she is my sister': '她是我的姐妹',
  'she is my mother': '她是我的妈妈',
  'she is my friend': '她是我的朋友',
  'she is beautiful': '她很漂亮',
  'she likes to read': '她喜欢阅读',
  
  'he is my brother': '他是我的兄弟',
  'he is my father': '他是我的爸爸',
  'he is my friend': '他是我的朋友',
  'he likes to play': '他喜欢玩',
  'he can run fast': '他跑得很快',
  
  'we are friends': '我们是朋友',
  'we are students': '我们是学生',
  'we like to play': '我们喜欢玩',
  'we go to school': '我们去上学',
  
  'they are happy': '他们很开心',
  'they like to play': '他们喜欢玩',
  
  'the sky is blue': '天空是蓝色的',
  'the cat is cute': '猫很可爱',
  'the book is big': '书很大',
  'my name is tom': '我叫汤姆',
  'my dog is black': '我的狗是黑色的',
  'today is monday': '今天是星期一',
  'it is cold today': '今天很冷',
  'it is hot': '很热',
};

// 详细的单词词典
const dictionary: Record<string, string> = {
  // 疑问词
  'what': '什么',
  'where': '哪里',
  'when': '什么时候',
  'who': '谁',
  'why': '为什么',
  'how': '如何',
  'which': '哪个',
  
  // 代词
  'i': '我',
  'you': '你',
  'he': '他',
  'she': '她',
  'it': '它',
  'we': '我们',
  'they': '他们',
  'my': '我的',
  'your': '你的',
  'his': '他的',
  'her': '她的',
  'our': '我们的',
  'their': '他们的',
  'me': '我',
  'him': '他',
  'them': '他们',
  
  // be动词
  'am': '是',
  'is': '是',
  'are': '是',
  'was': '是',
  'were': '是',
  
  // 助动词
  'have': '有',
  'has': '有',
  'had': '有',
  'do': '做',
  'does': '做',
  'did': '做了',
  'can': '能',
  'could': '能',
  'will': '将',
  'would': '会',
  'may': '可能',
  'might': '可能',
  'must': '必须',
  'should': '应该',
  
  // 常用动词
  'like': '喜欢',
  'love': '爱',
  'want': '想要',
  'need': '需要',
  'go': '去',
  'come': '来',
  'eat': '吃',
  'drink': '喝',
  'play': '玩',
  'run': '跑',
  'walk': '走',
  'see': '看见',
  'look': '看',
  'watch': '观看',
  'read': '读',
  'write': '写',
  'listen': '听',
  'speak': '说',
  'talk': '说话',
  'get': '得到',
  'give': '给',
  'make': '制作',
  'take': '拿',
  'know': '知道',
  'think': '想',
  'feel': '感觉',
  'work': '工作',
  'study': '学习',
  'learn': '学习',
  'teach': '教',
  'help': '帮助',
  'live': '住',
  'swim': '游泳',
  'sleep': '睡觉',
  'wake': '醒来',
  'open': '打开',
  'close': '关闭',
  'start': '开始',
  'stop': '停止',
  'find': '找到',
  'lose': '丢失',
  'buy': '买',
  'sell': '卖',
  
  // 名词
  'class': '课',
  'classes': '课',
  'school': '学校',
  'teacher': '老师',
  'student': '学生',
  'students': '学生',
  'book': '书',
  'books': '书',
  'desk': '书桌',
  'chair': '椅子',
  'bag': '包',
  'pen': '笔',
  'pencil': '铅笔',
  'paper': '纸',
  
  // 颜色
  'color': '颜色',
  'red': '红色',
  'blue': '蓝色',
  'green': '绿色',
  'yellow': '黄色',
  'black': '黑色',
  'white': '白色',
  'orange': '橙色',
  'purple': '紫色',
  'pink': '粉色',
  'brown': '棕色',
  'gray': '灰色',
  'grey': '灰色',
  
  // 运动和游戏
  'basketball': '篮球',
  'football': '足球',
  'soccer': '足球',
  'ball': '球',
  'game': '游戏',
  'sport': '运动',
  
  // 食物
  'food': '食物',
  'water': '水',
  'milk': '牛奶',
  'juice': '果汁',
  'apple': '苹果',
  'apples': '苹果',
  'banana': '香蕉',
  'orange': '橙子',
  'bread': '面包',
  'rice': '米饭',
  'cake': '蛋糕',
  'egg': '鸡蛋',
  'meat': '肉',
  'fish': '鱼',
  
  // 动物
  'dog': '狗',
  'cat': '猫',
  'cats': '猫',
  'bird': '鸟',
  'rabbit': '兔子',
  'mouse': '老鼠',
  'pet': '宠物',
  'animal': '动物',
  
  // 家庭
  'home': '家',
  'house': '房子',
  'room': '房间',
  'family': '家庭',
  'mother': '妈妈',
  'mom': '妈妈',
  'father': '爸爸',
  'dad': '爸爸',
  'sister': '姐妹',
  'brother': '兄弟',
  'parent': '父母',
  'parents': '父母',
  'friend': '朋友',
  'friends': '朋友',
  
  // 人名
  'tom': '汤姆',
  'mary': '玛丽',
  'john': '约翰',
  'lucy': '露西',
  'jack': '杰克',
  
  // 身体
  'name': '名字',
  'eye': '眼睛',
  'eyes': '眼睛',
  'ear': '耳朵',
  'nose': '鼻子',
  'mouth': '嘴巴',
  'hand': '手',
  'foot': '脚',
  'head': '头',
  'body': '身体',
  
  // 时间
  'day': '天',
  'time': '时间',
  'morning': '早上',
  'afternoon': '下午',
  'evening': '晚上',
  'night': '夜晚',
  'today': '今天',
  'tomorrow': '明天',
  'yesterday': '昨天',
  'monday': '星期一',
  'tuesday': '星期二',
  'wednesday': '星期三',
  'thursday': '星期四',
  'friday': '星期五',
  'saturday': '星期六',
  'sunday': '星期日',
  'week': '星期',
  'month': '月',
  'year': '年',
  'birthday': '生日',
  
  // 形容词
  'good': '好的',
  'bad': '坏的',
  'big': '大的',
  'small': '小的',
  'little': '小的',
  'large': '大的',
  'happy': '快乐的',
  'sad': '悲伤的',
  'favorite': '最喜欢的',
  'beautiful': '美丽的',
  'cute': '可爱的',
  'nice': '好的',
  'great': '很棒的',
  'wonderful': '精彩的',
  'new': '新的',
  'old': '旧的',
  'young': '年轻的',
  'hot': '热的',
  'cold': '冷的',
  'warm': '温暖的',
  'cool': '凉爽的',
  'tall': '高的',
  'short': '矮的',
  'long': '长的',
  'fast': '快的',
  'slow': '慢的',
  'hungry': '饿的',
  'thirsty': '渴的',
  'tired': '累的',
  'busy': '忙的',
  'free': '空闲的',
  'easy': '容易的',
  'hard': '困难的',
  'difficult': '困难的',
  'right': '对的',
  'wrong': '错的',
  
  // 数词
  'one': '一',
  'two': '两',
  'three': '三',
  'four': '四',
  'five': '五',
  'six': '六',
  'seven': '七',
  'eight': '八',
  'nine': '九',
  'ten': '十',
  'eleven': '十一',
  'twelve': '十二',
  'twenty': '二十',
  'thirty': '三十',
  'hundred': '百',
  'many': '许多',
  'much': '很多',
  'some': '一些',
  'any': '任何',
  'few': '少数',
  'all': '所有',
  'both': '两者都',
  'each': '每个',
  'every': '每个',
  'first': '第一',
  'second': '第二',
  'third': '第三',
  
  // 介词
  'in': '在...里',
  'on': '在...上',
  'at': '在',
  'to': '到',
  'from': '从',
  'with': '和',
  'for': '为了',
  'of': '的',
  'by': '通过',
  'about': '关于',
  'under': '在...下',
  'over': '在...上方',
  'before': '在...之前',
  'after': '在...之后',
  'between': '在...之间',
  'near': '在...附近',
  'behind': '在...后面',
  
  // 连词
  'and': '和',
  'or': '或者',
  'but': '但是',
  'because': '因为',
  'so': '所以',
  'if': '如果',
  'when': '当',
  'while': '当',
  'until': '直到',
  
  // 副词
  'very': '非常',
  'too': '太',
  'so': '如此',
  'not': '不',
  'no': '不',
  'yes': '是',
  'now': '现在',
  'then': '然后',
  'here': '这里',
  'there': '那里',
  'always': '总是',
  'usually': '通常',
  'often': '经常',
  'sometimes': '有时',
  'never': '从不',
  'again': '再次',
  'also': '也',
  'only': '只',
  'just': '刚刚',
  'already': '已经',
  'still': '仍然',
  'well': '好',
  'fast': '快地',
  
  // 其他
  'the': '',
  'a': '',
  'an': '',
  'this': '这个',
  'that': '那个',
  'these': '这些',
  'those': '那些',
  'there': '那里',
  'thing': '东西',
  'things': '东西',
  'people': '人们',
  'person': '人',
  'place': '地方',
  'way': '方式',
};

// 简单的逐词翻译作为后备方案
function translateWordByWord(sentence: string): string {
  const words = sentence.toLowerCase().split(/\s+/);
  const translatedWords: string[] = [];
  
  for (const word of words) {
    // 去除标点符号
    const cleanWord = word.replace(/[.,!?;:'"\-()]/g, '');
    if (cleanWord) {
      const translation = dictionary[cleanWord];
      if (translation && translation !== '') {
        translatedWords.push(translation);
      }
    }
  }
  
  // 如果翻译出了至少一半的单词，返回翻译结果
  if (translatedWords.length >= words.length * 0.4) {
    return translatedWords.join('');
  }
  
  // 否则返回空，让用户手动输入
  return '';
}

// 翻译句子的主函数
export function translateSentence(sentence: string): string {
  const normalized = sentence.toLowerCase().trim();
  
  // 1. 首先检查是否有完全匹配的句子模式
  if (sentencePatterns[normalized]) {
    return sentencePatterns[normalized];
  }
  
  // 2. 检查部分匹配（处理一些变体）
  const cleanedNormalized = normalized.replace(/[?.!,]/g, '');
  for (const [pattern, translation] of Object.entries(sentencePatterns)) {
    if (cleanedNormalized === pattern || cleanedNormalized === pattern.replace(/[?.!,]/g, '')) {
      return translation;
    }
  }
  
  // 3. 尝试逐词翻译
  const wordByWord = translateWordByWord(sentence);
  if (wordByWord) {
    return wordByWord;
  }
  
  // 4. 如果都失败了，返回空字符串让家长手动输入
  return '';
}
