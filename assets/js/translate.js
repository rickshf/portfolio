const translator = (() => {
  const cacheKey = lang => `translation-cache-${lang}`;
  const cache = { en: {}, pt: {} };
  const originalText = new WeakMap();

  function loadCache(lang) {
    try {
      const stored = localStorage.getItem(cacheKey(lang));
      if (stored) Object.assign(cache[lang], JSON.parse(stored));
    } catch (_) {}
  }

  function saveCache(lang) {
    try {
      localStorage.setItem(cacheKey(lang), JSON.stringify(cache[lang]));
    } catch (_) {}
  }

  async function translateText(text, targetLang) {
    loadCache(targetLang);
    if (cache[targetLang][text]) return cache[targetLang][text];
    const res = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' })
    });
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data.translatedText;
    cache[targetLang][text] = translated;
    saveCache(targetLang);
    return translated;
  }

  function getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement.tagName;
        if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  async function translatePage(targetLang) {
    if (targetLang === 'en') {
      for (const [node, text] of originalText) {
        node.nodeValue = text;
      }
      document.documentElement.lang = 'en';
      return;
    }

    const nodes = getTextNodes(document.body);
    const promises = nodes.map(async node => {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const original = originalText.get(node);
      const translated = await translateText(original, targetLang);
      node.nodeValue = translated;
    });
    await Promise.all(promises);
    document.documentElement.lang = targetLang;
  }

  return { translatePage };
})();

window.translatePage = lang => translator.translatePage(lang);
