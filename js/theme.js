document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Simple theme apply
  function applyTheme(name) {
    if (name === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      try { document.body.classList.add('dark'); document.body.classList.remove('light'); } catch(e){}
      // fallback background in case utilities are overridden
      try { document.body.style.backgroundColor = ''; document.body.style.color = ''; } catch(e){}
    } else if (name === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      try { document.body.classList.remove('dark'); document.body.classList.add('light'); } catch(e){}
      // ensure a bright background if some styles remain
      try { document.body.style.backgroundColor = '#f8fafc'; document.body.style.color = '#0f172a'; } catch(e){}
    }
    if (themeBtn) {
      const isDark = root.classList.contains('dark');
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  // initialize
  if (stored === 'dark' || (stored == null && prefersDark)) applyTheme('dark');
  else applyTheme('light');

  themeBtn?.addEventListener('click', () => {
    const nowDark = !root.classList.contains('dark');
    applyTheme(nowDark ? 'dark' : 'light');
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  });
  // Non-theme UI (reveal, modal, typing, scrolling) moved to `js/script.js`
});
