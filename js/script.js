document.addEventListener('DOMContentLoaded', () => {
  // Simple staggered reveal for elements with [data-animate]
  const items = Array.from(document.querySelectorAll('[data-animate]'));
  items.forEach((el, i) => {
    el.style.transitionDelay = (i * 80) + 'ms';
    el.classList.remove('opacity-0');
    el.classList.remove('translate-y-4');
    el.classList.add('opacity-100');
    el.classList.add('translate-y-0');
  });

  // Respect reduced motion preference
  const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq && mq.matches) {
    items.forEach(el => {
      el.style.transition = 'none';
    });
  }

  // Visitor name modal logic
  const modal = document.getElementById('visitor-modal');
  const form = document.getElementById('visitor-form');
  const input = document.getElementById('visitor-name');
  const cancelBtn = document.getElementById('visitor-cancel');
  const greetingEl = document.getElementById('visitor-greeting');
  const topGreeting = document.getElementById('top-greeting');
  const greetingNameEl = document.getElementById('greeting-name');
  const greetingCursor = document.getElementById('greeting-cursor');
  const dismissGreetingBtn = document.getElementById('dismiss-greeting');
  const heroNameEl = document.getElementById('greeting-name-hero');
  const heroCursor = document.getElementById('greeting-hero-cursor');

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    // clear input each time (do not persist visitor name)
    try { if (input) input.value = ''; } catch (e) { }
    setTimeout(() => input?.focus(), 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
  }

  function setVisitor(name) {
    // If name is empty or falsy, treat as Guest. Do not persist to localStorage.
    const display = name && name.trim() ? name.trim() : 'Guest';
    showGreeting(display);
    // Auto-fill contact form name when visitor provides a name
    try {
      const contactNameInput = document.getElementById('contact-name');
      if (contactNameInput) {
        if (name && name.trim()) {
          contactNameInput.value = name.trim();
        }
        // trigger input event to refresh any live preview
        contactNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (e) { /* noop */ }
  }

  // Typing loop controller for hero name
  let heroTypingController = null;

  function stopHeroTyping() {
    if (heroTypingController) heroTypingController.stopped = true;
    heroTypingController = null;
    if (heroCursor) heroCursor.style.opacity = '0';
  }

  function startHeroTyping(el, text) {
    stopHeroTyping();
    if (!el) return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = text;
      if (heroCursor) heroCursor.style.opacity = '0';
      return;
    }
    heroCursor && (heroCursor.style.opacity = '1');
    const controller = { stopped: false };
    heroTypingController = controller;

    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pause = 1000;

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    (async function loop() {
      while (!controller.stopped) {
        // type
        for (let i = 1; i <= text.length; i++) {
          el.textContent = text.slice(0, i);
          await wait(typeSpeed);
          if (controller.stopped) return;
        }
        await wait(pause);
        if (controller.stopped) return;
        for (let i = text.length; i > 1; i--) {
          el.textContent = text.slice(0, i - 1);
          await wait(deleteSpeed);
          if (controller.stopped) return;
        }
        await wait(pause / 2);
      }
    })();
  }

  function showGreeting(name) {
    // Show the hero greeting container (above "Hello, I'm")
    if (greetingEl) {
      greetingEl.hidden = false;
    }
    const finalText = name && name.trim() ? name.trim() : 'Guest';
    // start looping typing on the hero name element
    if (heroNameEl) startHeroTyping(heroNameEl, finalText);
  }

  // Always show modal on page load (do not persist name across reloads)
  setTimeout(() => openModal(), 700);

  // Form handlers
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input?.value;
    // if empty, show Guest; otherwise show provided name
    setVisitor(val);
    closeModal();
  });
  cancelBtn?.addEventListener('click', () => { setVisitor('Guest'); closeModal(); });

  // close modal when clicking backdrop
  document.querySelectorAll('[data-modal-backdrop]').forEach(back => {
    back.addEventListener('click', () => closeModal());
  });

  // close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Mobile menu toggle (hamburger) — slide-down full-screen drawer with backdrop
  (function () {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const siteNav = document.getElementById('site-nav');
    if (!mobileBtn || !siteNav) return;

    const icon = mobileBtn.querySelector('i');
    let backdrop = null;

    function createBackdrop() {
      if (backdrop) return;
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-nav-backdrop';
      document.body.appendChild(backdrop);
      // allow transition
      requestAnimationFrame(() => backdrop.classList.add('show'));
      backdrop.addEventListener('click', () => setOpen(false));
    }

    function removeBackdrop() {
      if (!backdrop) return;
      backdrop.classList.remove('show');
      // wait for fade-out then remove
      setTimeout(() => {
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        backdrop = null;
      }, 260);
    }

    let navTimers = [];
    let focusTrapHandler = null;

    function setOpen(open) {
      mobileBtn.setAttribute('aria-expanded', String(Boolean(open)));
      if (open) {
        siteNav.classList.add('nav-open');
        siteNav.setAttribute('aria-hidden', 'false');
        if (icon) icon.className = 'fa-solid fa-xmark';
        createBackdrop();
        // lock body scroll while drawer is open
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        // animate nav items with stagger
        const links = Array.from(siteNav.querySelectorAll('a'));
        links.forEach((a, idx) => {
          // clear any previous
          a.classList.remove('nav-item-in');
          const t = setTimeout(() => a.classList.add('nav-item-in'), idx * 70 + 80);
          navTimers.push(t);
        });
        // focus trap: keep tab inside drawer
        const focusables = () => Array.from(siteNav.querySelectorAll('a,button,input,textarea,select')).filter(el => !el.hasAttribute('disabled'));
        focusTrapHandler = function (e) {
          if (e.key !== 'Tab') return;
          const list = focusables();
          if (list.length === 0) return;
          const first = list[0];
          const last = list[list.length - 1];
          if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        };
        document.addEventListener('keydown', focusTrapHandler);
        // focus first link for accessibility
        const first = siteNav.querySelector('a,button');
        first && first.focus();
      } else {
        siteNav.classList.remove('nav-open');
        siteNav.setAttribute('aria-hidden', 'true');
        if (icon) icon.className = 'fa-solid fa-bars';
        removeBackdrop();
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        // clear stagger timers and remove classes
        navTimers.forEach(t => clearTimeout(t)); navTimers = [];
        siteNav.querySelectorAll('a.nav-item-in').forEach(a => a.classList.remove('nav-item-in'));
        if (focusTrapHandler) document.removeEventListener('keydown', focusTrapHandler);
        focusTrapHandler = null;
        mobileBtn.focus();
      }
    }

    mobileBtn.addEventListener('click', (e) => {
      const isOpen = mobileBtn.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    // close on Escape (also ensures nav closes if open)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Close drawer when a nav link is clicked (mobile)
    siteNav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // only handle mobile drawer clicks
      if (window.innerWidth <= 768) {
        setOpen(false);
      }
    });

    // Drawer header quick actions
    const drawerTheme = document.getElementById('drawer-theme-toggle');
    const drawerContact = document.getElementById('drawer-contact');
    const mainThemeBtn = document.getElementById('theme-toggle');
    const contactSection = document.getElementById('contact');
    if (drawerTheme && mainThemeBtn) {
      drawerTheme.addEventListener('click', () => mainThemeBtn.click());
    }
    if (drawerContact && contactSection) {
      drawerContact.addEventListener('click', () => {
        setOpen(false);
        setTimeout(() => {
          const contactTop = contactSection.getBoundingClientRect().top + window.pageYOffset - (document.querySelector('header')?.offsetHeight || 0) - 8;
          window.scrollTo({ top: contactTop, behavior: 'smooth' });
          const contactName = document.getElementById('contact-name');
          contactName && contactName.focus();
        }, 260);
      });
    }
  })();

  // Option to dismiss top greeting quickly
  dismissGreetingBtn?.addEventListener('click', () => {
    if (!topGreeting) return;
    topGreeting.style.opacity = '0';
    topGreeting.style.transform = 'translateY(-6px)';
    setTimeout(() => topGreeting.classList.add('hidden'), 320);
  });

  // Smooth scroll for internal anchor links with sticky header offset
  (function () {
    const header = document.querySelector('header');
    const getHeaderHeight = () => (header ? header.getBoundingClientRect().height : 0);
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const offset = getHeaderHeight() + 8; // small gap
        const top = Math.round(target.getBoundingClientRect().top + window.pageYOffset - offset);
        window.scrollTo({ top, behavior: 'smooth' });
        // focus target for accessibility after scroll finishes
        setTimeout(() => { try { target.focus({ preventScroll: true }); } catch (e) { } }, 600);
      });
    });
  })();

  // Project lightbox/modal preview
  const lightbox = (function () {
    const lb = document.createElement('div');
    lb.id = 'project-lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop" data-lb-backdrop></div>
      <div class="lb-panel" role="dialog" aria-modal="true" aria-labelledby="lb-title">
        <button class="lb-close btn-secondary glass-action" aria-label="Close preview">×</button>
        <div class="lb-content">
          <div class="lb-image"><img src="" alt=""/></div>
          <div class="lb-meta">
            <h3 id="lb-title"></h3>
            <p id="lb-desc" class="text-sm text-slate-600 dark:text-slate-300"></p>
            <div class="lb-controls">
              <a id="lb-demo" class="lb-btn btn-primary glass-action" href="#" target="_blank" rel="noopener noreferrer">Demo</a>
              <a id="lb-code" class="lb-btn btn-secondary glass-action" href="#" target="_blank" rel="noopener noreferrer">Code</a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(lb);

    const panel = lb.querySelector('.lb-panel');
    const img = lb.querySelector('.lb-image img');
    const title = lb.querySelector('#lb-title');
    const desc = lb.querySelector('#lb-desc');
    const demoLink = lb.querySelector('#lb-demo');
    const codeLink = lb.querySelector('#lb-code');
    const closeBtn = lb.querySelector('.lb-close');

    // toast element for contextual messages
    const toast = document.createElement('div');
    toast.className = 'site-toast';
    document.body.appendChild(toast);
    function showToast(msg, ms = 2500) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => { toast.classList.remove('show'); }, ms);
    }

    let currentIndex = -1;
    let items = [];

    function open(i) {
      if (!items[i]) return;
      currentIndex = i;
      const it = items[i];
      img.src = it.image;
      img.alt = it.title;
      title.textContent = it.title;
      desc.textContent = it.description;
      demoLink.href = it.demo || '#';
      codeLink.href = it.code || '#';
      // Demo link: if missing (#) show Coming soon state
      if (!it.demo || it.demo === '#') {
        demoLink.classList.add('disabled');
        demoLink.setAttribute('aria-disabled', 'true');
        demoLink.textContent = 'Coming soon';
        demoLink.removeAttribute('target');
      } else {
        demoLink.classList.remove('disabled');
        demoLink.removeAttribute('aria-disabled');
        demoLink.textContent = 'Demo';
        demoLink.setAttribute('target', '_blank');
      }
      // Code link: if missing (#) show unpublished when clicked
      if (!it.code || it.code === '#') {
        codeLink.classList.add('disabled');
        codeLink.removeAttribute('href');
        codeLink.addEventListener('click', codeMissingHandler);
      } else {
        codeLink.classList.remove('disabled');
        codeLink.href = it.code;
        codeLink.removeEventListener('click', codeMissingHandler);
      }
      lb.classList.add('open');
      // focus for accessibility
      closeBtn.focus();
    }
    function codeMissingHandler(e) { e && e.preventDefault(); showToast('Code not published yet.'); }
    function close() { lb.classList.remove('open'); }
    function next() { open((currentIndex + 1) % items.length); }
    function prev() { open((currentIndex - 1 + items.length) % items.length); }

    // close handlers
    lb.querySelectorAll('[data-lb-backdrop]').forEach(b => b.addEventListener('click', close));
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    return { attach(list) { items = list; }, open, close, next, prev };
  })();

  // Gather project cards and wire click handlers
  const projectEls = Array.from(document.querySelectorAll('#projects article'));
  const projects = projectEls.map((el, idx) => {
    const img = el.querySelector('img');
    return {
      title: el.querySelector('h3')?.textContent?.trim() || `Project ${idx + 1}`,
      description: el.querySelector('p')?.textContent?.trim() || '',
      image: img?.getAttribute('src') || '',
      demo: el.querySelector('a.text-sm.text-indigo-600')?.getAttribute('href') || '#',
      code: (el.querySelectorAll('a.text-sm')[2] && el.querySelectorAll('a.text-sm')[2].getAttribute('href')) || '#'
    };
  });
  lightbox.attach(projects);
  projectEls.forEach((el, i) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      // ignore clicks on links inside the card
      if (e.target.closest('a')) return;
      lightbox.open(i);
    });
    // keyboard accessible
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox.open(i); } });
  });

  /* Contact form: validation + live preview + reset */
  (function () {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const nameEl = document.getElementById('contact-name');
    const dobEl = document.getElementById('contact-dob');
    const messageEl = document.getElementById('contact-message');
    const previewName = document.getElementById('preview-name');
    const previewMeta = document.getElementById('preview-meta');
    const chatMessages = document.getElementById('chat-messages');
    const chatDraft = document.getElementById('chat-draft');
    const resetBtn = document.getElementById('contact-reset');

    const toastEl = document.querySelector('.site-toast');
    function showToast(msg, ms = 2200) {
      if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
    }

    function validate() {
      let ok = true;
      // name
      const name = nameEl.value.trim();
      const errName = document.getElementById('error-name');
      if (!name) { errName.classList.add('visible'); nameEl.setAttribute('aria-invalid', 'true'); ok = false; } else { errName.classList.remove('visible'); nameEl.removeAttribute('aria-invalid'); }
      // dob
      const dob = dobEl.value;
      const errDob = document.getElementById('error-dob');
      if (!dob) { errDob.classList.add('visible'); dobEl.setAttribute('aria-invalid', 'true'); ok = false; }
      else {
        const d = new Date(dob); const now = new Date();
        if (d > now) { errDob.classList.add('visible'); dobEl.setAttribute('aria-invalid', 'true'); ok = false; }
        else { errDob.classList.remove('visible'); dobEl.removeAttribute('aria-invalid'); }
      }
      // gender
      const gender = form.querySelector('input[name="gender"]:checked');
      const errGender = document.getElementById('error-gender');
      if (!gender) { errGender.classList.add('visible'); ok = false; } else { errGender.classList.remove('visible'); }
      // message
      const msg = messageEl.value.trim();
      const errMsg = document.getElementById('error-message');
      if (!msg || msg.length < 10) { errMsg.classList.add('visible'); messageEl.setAttribute('aria-invalid', 'true'); ok = false; } else { errMsg.classList.remove('visible'); messageEl.removeAttribute('aria-invalid'); }
      return ok;
    }

    // In-memory message store for the preview chat
    const messages = [];

    function formatTimestamp(d) {
      try {
        return d.toLocaleString();
      } catch (e) { return d.toString(); }
    }

    function renderMessages() {
      if (!chatMessages) return;
      chatMessages.innerHTML = messages.map(m => {
        const time = formatTimestamp(new Date(m.time));
        return `\n          <div class="chat-bubble ${m.me ? 'me' : 'other'}">\n            <div class="body">${escapeHtml(m.text)}</div>\n            <span class="chat-time">${time}</span>\n          </div>`;
      }).join('');
      // scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updatePreview() {
      const name = nameEl.value.trim() || '—';
      const dob = dobEl.value ? new Date(dobEl.value).toLocaleDateString() : '—';
      const gender = (form.querySelector('input[name="gender"]:checked') || {}).value || '—';
      const draft = messageEl.value.trim();
      previewName.textContent = `Nama: ${name}`;
      previewMeta.textContent = `Tanggal Lahir: ${dob} • Jenis Kelamin: ${gender}`;
      if (!chatDraft) return;
      if (!draft) {
        chatDraft.textContent = 'Belum ada pesan.';
        chatDraft.setAttribute('aria-hidden', 'true');
      } else {
        chatDraft.innerHTML = `<div class="chat-bubble me"><div class="body">${escapeHtml(draft)}</div><span class="chat-time">${formatTimestamp(new Date())}</span></div>`;
        chatDraft.setAttribute('aria-hidden', 'false');
      }
    }

    // simple escaping to avoid HTML injection in preview (we set textContent elsewhere for form values)
    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // initial preview
    updatePreview();

    [nameEl, dobEl, messageEl].forEach(el => el && el.addEventListener('input', updatePreview));
    form.querySelectorAll('input[name="gender"]').forEach(r => r.addEventListener('change', updatePreview));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) { showToast('Periksa kesalahan pada formulir.'); return; }
      // Create message object with timestamp
      const msgText = messageEl.value.trim();
      const msgObj = { text: msgText, time: new Date().toISOString(), me: true };
      messages.push(msgObj);
      renderMessages();
      showToast('Terima kasih — pesan Anda telah dikirim (demo).');
      // clear message but keep name
      messageEl.value = '';
      updatePreview();
      // focus submit for accessibility feedback
      document.getElementById('contact-submit')?.focus();
    });

    resetBtn?.addEventListener('click', () => {
      form.reset();
      // clear error visuals
      form.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
      [nameEl, dobEl, messageEl].forEach(el => el && el.removeAttribute('aria-invalid'));
      updatePreview();
    });
  })();
});
