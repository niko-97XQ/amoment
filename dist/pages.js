const KEY = 'amoment-lang';
const nodes = () => document.querySelectorAll('[data-zh]');

export function initLanguage() {
  const apply = lang => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    nodes().forEach(el => {
      if (!el.dataset.en) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === 'zh' ? el.dataset.zh : el.dataset.en;
    });
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = lang === 'zh' ? 'EN' : '中文';
      btn.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
      btn.setAttribute('aria-pressed', String(lang === 'zh'));
    });
    try { localStorage.setItem(KEY, lang); } catch (_) { /* the page still works without storage */ }
  };

  let saved = 'en';
  try { saved = localStorage.getItem(KEY) || 'en'; } catch (_) { /* private mode */ }
  apply(saved);

  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      apply(document.documentElement.lang === 'zh-CN' ? 'en' : 'zh');
    });
  });
}

initLanguage();
