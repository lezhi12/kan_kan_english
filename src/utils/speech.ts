// 语音合成工具函数

let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];

// 初始化语音（加载语音列表）
export function initSpeech(): void {
  if ('speechSynthesis' in window) {
    // 加载语音列表
    const loadVoices = () => {
      availableVoices = window.speechSynthesis.getVoices();
      voicesLoaded = availableVoices.length > 0;
    };
    
    loadVoices();
    
    // 某些浏览器需要等待voiceschanged事件
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // 延迟加载以确保语音列表可用
    setTimeout(loadVoices, 100);
  }
}

// 选择最佳的英文女声
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (!voicesLoaded || availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }
  
  // 优先选择的英文女声名称
  const preferredNames = [
    'Samantha',
    'Karen',
    'Victoria',
    'Fiona',
    'Google US English',
    'Microsoft Zira',
    'Alex',
  ];
  
  // 首先尝试找到首选名称的语音
  for (const name of preferredNames) {
    const voice = availableVoices.find(v => 
      v.name.includes(name) && v.lang.startsWith('en')
    );
    if (voice) return voice;
  }
  
  // 然后查找任何包含"female"的英文语音
  const femaleVoice = availableVoices.find(voice => 
    voice.lang.startsWith('en') && 
    (voice.name.toLowerCase().includes('female') || 
     voice.name.toLowerCase().includes('woman'))
  );
  if (femaleVoice) return femaleVoice;
  
  // 最后返回任何en-US语音
  const usVoice = availableVoices.find(v => v.lang === 'en-US');
  if (usVoice) return usVoice;
  
  // 或任何英文语音
  return availableVoices.find(v => v.lang.startsWith('en')) || null;
}

// 选择最佳的中文女声
function getBestChineseVoice(): SpeechSynthesisVoice | null {
  if (!voicesLoaded || availableVoices.length === 0) {
    availableVoices = window.speechSynthesis.getVoices();
  }
  
  // 优先选择的中文女声名称
  const preferredNames = [
    'Ting-Ting',
    'Mei-Jia',
    'Yaoyao',
    'Huihui',
    'Google 普通话',
    'Microsoft Huihui',
  ];
  
  // 首先尝试找到首选名称的语音
  for (const name of preferredNames) {
    const voice = availableVoices.find(v => 
      v.name.includes(name) && (v.lang.startsWith('zh') || v.lang.includes('CN'))
    );
    if (voice) return voice;
  }
  
  // 然后查找任何包含"female"的中文语音
  const femaleVoice = availableVoices.find(voice => 
    (voice.lang.startsWith('zh') || voice.lang.includes('CN')) && 
    (voice.name.toLowerCase().includes('female') || 
     voice.name.toLowerCase().includes('woman'))
  );
  if (femaleVoice) return femaleVoice;
  
  // 最后返回任何中文语音
  return availableVoices.find(v => 
    v.lang.startsWith('zh') || v.lang.includes('CN')
  ) || null;
}

// 读出单词（优化的英文女声）
export function speakWord(word: string): void {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(word);
    
    // 设置语音属性 - 调整为更自然的参数
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // 稍慢，方便孩子听清
    utterance.pitch = 1.0; // 自然音调
    utterance.volume = 1.0; // 最大音量
    
    // 选择最佳女声
    const voice = getBestEnglishVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

// 说出鼓励的话（优化的中文女声）
export function speakEncouragement(type: 'correct' | 'wrong'): void {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel();
    
    const text = type === 'correct' 
      ? '太棒了！选对了！' 
      : '好像哪里不对劲，再重新试试吧！';
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语音属性 - 更温柔友好的参数
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9; // 稍慢一点，让孩子听得更清楚
    utterance.pitch = 1.1; // 稍微高一点但不过分
    utterance.volume = 1.0; // 最大音量
    
    // 选择最佳中文女声
    const voice = getBestChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    // 添加结束事件以确保语音播放完成
    utterance.onend = () => {
      console.log('Speech finished');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

// 播放庆祝音效（正确答题）
export function playCelebration(): void {
  speakEncouragement('correct');
}

// 播放错误音效（答错）
export function playError(): void {
  speakEncouragement('wrong');
}

// 通用的文本朗读函数（自动检测语言）
export function speakText(text: string): void {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 检测是否为中文
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    
    if (isChinese) {
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      const voice = getBestChineseVoice();
      if (voice) {
        utterance.voice = voice;
      }
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      const voice = getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    utterance.volume = 1.0;
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
    };
    
    window.speechSynthesis.speak(utterance);
  }
}
