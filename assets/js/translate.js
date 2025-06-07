const translator = {
  lang: 'en',
  cache: { en: {}, pt: {} },
  originalText: new Map(),
  async translateText(text, targetLang) {
    if(this.cache[targetLang][text]) return this.cache[targetLang][text];
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return text;
      const data = await res.json();
      const translated = data[0].map(part => part[0]).join('');
      this.cache[targetLang][text] = translated;
      return translated;
    } catch (e) {
      console.error('Translation failed', e);
      return text;
    }
  },
  getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if(!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if(['SCRIPT','STYLE','CODE','PRE'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if(!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while(n = walker.nextNode()) nodes.push(n);
    return nodes;
  },
  async translatePage(targetLang) {
    this.lang = targetLang;
    const nodes = this.getTextNodes(document.body);
    const promises = nodes.map(async node => {
      if(!this.originalText.has(node)) this.originalText.set(node, node.nodeValue);
      const original = this.originalText.get(node);
      const translated = await this.translateText(original, targetLang);
      node.nodeValue = translated;
    });
    await Promise.all(promises);
    document.documentElement.lang = targetLang;
  }
};
window.translatePage = lang => translator.translatePage(lang);
