/* Shared interactions. Static page content remains readable without JavaScript. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const one = (selector, scope = document) => scope.querySelector(selector);
  const all = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  // Responsive navigation with explicit keyboard and expanded-state support.
  const toggle = one('.nav-toggle');
  const nav = one('#main-nav');
  function closeMenu(returnFocus = false) {
    if (!toggle || !nav) return;
    nav.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.dataset.open = String(open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.navigation')) closeMenu();
    });
    window.matchMedia('(min-width: 681px)').addEventListener('change', () => closeMenu());
  }

  // Fixed portfolio images are in the HTML and never depend on local storage.
  const filters = all('[data-filter]');
  const works = all('.work-entry[data-category]');
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      filters.forEach(item => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      works.forEach(item => { item.hidden = category !== 'all' && item.dataset.category !== category; });
      const count = works.filter(item => !item.hidden).length;
      const counter = one('#portfolio-count');
      if (counter) counter.textContent = `顯示 ${count} 件作品`;
    });
  });
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.matches('.work-entry') && target.hidden) {
      one('[data-filter="all"]')?.click();
      target.scrollIntoView();
    }
  });

  // Artwork viewer: native dialog handles focus trapping and Escape.
  const dialog = one('#artwork-dialog');
  const artLinks = all('.art-open');
  const gallery = Array.from(new Map(artLinks.map(link => [link.getAttribute('href'), {
    src: link.getAttribute('href'),
    title: link.dataset.artTitle,
    description: link.dataset.artDescription,
    alt: one('img', link)?.alt || link.dataset.artDescription
  }])).values());
  let selectedArt = 0;
  let opener = null;
  function displayArt(index) {
    if (!gallery.length) return;
    selectedArt = (index + gallery.length) % gallery.length;
    const artwork = gallery[selectedArt];
    one('#dialog-image').src = artwork.src;
    one('#dialog-image').alt = artwork.alt;
    one('#dialog-title').textContent = artwork.title;
    one('#dialog-description').textContent = artwork.description;
    one('#dialog-count').textContent = `ILLUSTRATION / ${String(selectedArt + 1).padStart(2, '0')} OF ${String(gallery.length).padStart(2, '0')}`;
  }
  if (dialog && typeof dialog.showModal === 'function') {
    artLinks.forEach(link => link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      displayArt(gallery.findIndex(item => item.src === link.getAttribute('href')));
      dialog.showModal();
      document.body.classList.add('modal-open');
      one('.dialog-close', dialog).focus();
    }));
    one('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    one('#previous-art').addEventListener('click', () => displayArt(selectedArt - 1));
    one('#next-art').addEventListener('click', () => displayArt(selectedArt + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); displayArt(selectedArt - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); displayArt(selectedArt + 1); }
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      opener?.focus({preventScroll: true});
    });
  }

  // Demonstration form: preview only; no network or persistent storage.
  const contactForm = one('#contact-form');
  if (contactForm) {
    const message = one('#message');
    const visitor = one('#visitor');
    const preview = one('#message-preview');
    one('#preview-message').disabled = false;
    message.addEventListener('input', () => {
      one('#message-count').textContent = `${message.value.length} / 500`;
      message.setCustomValidity('');
    });
    visitor.addEventListener('input', () => visitor.setCustomValidity(''));
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      visitor.setCustomValidity(visitor.value.trim() ? '' : '請填入你的稱呼。');
      message.setCustomValidity(message.value.trim() ? '' : '請填入想說的話。');
      if (!contactForm.reportValidity()) return;
      one('#preview-author').textContent = `${visitor.value.trim()} 說：`;
      one('#preview-content').textContent = message.value.trim();
      preview.hidden = false;
    });
    contactForm.addEventListener('reset', () => {
      preview.hidden = true;
      one('#preview-author').textContent = '';
      one('#preview-content').textContent = '';
      one('#message-count').textContent = '0 / 500';
      visitor.setCustomValidity('');
      message.setCustomValidity('');
    });
  }

  // Optional local personalization, retained from the original website.
  const portraitKey = 'xiuchanyu-portrait';
  const portraitStatus = one('#portrait-status');
  const portraits = all('[data-portrait]');
  const captions = all('[data-portrait-caption]');
  captions.forEach(item => { item.dataset.defaultCaption = item.textContent; });
  function applyPortrait(data) {
    portraits.forEach(img => {
      img.src = data || img.dataset.defaultSrc;
      img.alt = data ? '使用者在這台裝置選擇的個人照片。' : img.dataset.defaultAlt;
    });
    captions.forEach(item => { item.textContent = data ? '我的個人照片・僅在這台裝置顯示' : item.dataset.defaultCaption; });
    const homeArt = one('.hero-art');
    if (homeArt) {
      const destination = data ? 'about.html' : 'works.html#work-2';
      one('.hero-art-link', homeArt).href = destination;
      const cornerLink = one('.art-frame figcaption > a', homeArt);
      cornerLink.href = destination;
      cornerLink.setAttribute('aria-label', data ? '認識霞冬，前往關於我' : '查看 Welcome 角色群像作品');
      const labels = all('.frame-label > span', homeArt);
      labels[0].textContent = data ? 'MY PERSONAL PORTRAIT' : 'FROM MY SKETCHBOOK';
      labels[1].textContent = data ? 'ABOUT ME' : 'NO. 02';
      one('figcaption .eyebrow', homeArt).textContent = data ? 'THE PERSON BEHIND THE ART' : 'A WARM LITTLE WELCOME';
    }
  }
  try {
    const saved = localStorage.getItem(portraitKey);
    if (saved && /^data:image\/(jpeg|png|webp);base64,/.test(saved)) applyPortrait(saved);
  } catch { /* Optional storage may be disabled. The default artwork stays visible. */ }

  const validImage = file => file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('圖片讀取失敗，請再選擇一次。'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(reader.result);
        img.onerror = () => reject(new Error('無法顯示這張圖片，請選擇有效的 JPG、PNG 或 WebP。'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  one('#portrait-input')?.addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!validImage(file) || file.size > 3 * 1024 * 1024) {
      portraitStatus.textContent = '請選擇 3 MB 以內的 JPG、PNG 或 WebP 圖片。';
      return;
    }
    try {
      const image = await readImage(file);
      applyPortrait(image);
      try {
        localStorage.setItem(portraitKey, image);
        portraitStatus.textContent = location.protocol === 'file:' ? '照片已在目前瀏覽器保存；直接開啟本機檔案時，其他頁面可能不會同步。' : '照片已在這台裝置保存，首頁也會顯示。';
      } catch {
        portraitStatus.textContent = '已預覽照片，但瀏覽器儲存空間不足或未開放，這次變更無法保留。';
      }
    } catch (error) { portraitStatus.textContent = error.message; }
  });
  one('#reset-portrait')?.addEventListener('click', () => {
    applyPortrait(null);
    try { localStorage.removeItem(portraitKey); } catch { /* In-memory reset still works. */ }
    one('#portrait-input').value = '';
    portraitStatus.textContent = '已還原成預設插畫。';
  });

  // A visitor may play their own local audio, without uploading it.
  let audioUrl = null;
  const player = one('#audio-player');
  one('#music-input')?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file || !player) return;
    player.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(file);
    player.src = audioUrl;
    player.load();
    one('#music-name').textContent = `${file.name}・按播放鍵開始，音樂不會上傳。`;
  });
  player?.addEventListener('error', () => {
    if (audioUrl) one('#music-name').textContent = '瀏覽器無法播放這個音樂格式，請改選 MP3、WAV 或其他支援的音檔。';
  });
  window.addEventListener('pagehide', () => { if (audioUrl) URL.revokeObjectURL(audioUrl); });

  // Separate local-only practice cards; built-in artworks cannot be removed.
  const localForm = one('#local-work-form');
  if (localForm) {
    const key = 'xiadong-local-works-v1';
    let drafts = [];
    const status = one('#local-work-status');
    const submit = one('[type="submit"]', localForm);
    submit.disabled = false;
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(stored)) drafts = stored.filter(item => item && typeof item.title === 'string' && typeof item.image === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(item.image)).slice(0, 12);
    } catch { /* Empty initial list when local storage is unavailable or invalid. */ }
    function renderDrafts() {
      const list = one('#local-work-list');
      list.replaceChildren();
      drafts.forEach((draft, index) => {
        const article = document.createElement('article');
        article.className = 'local-work-card';
        const img = document.createElement('img');
        img.src = draft.image;
        img.alt = `本機練習作品：${draft.title}`;
        const copy = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = draft.title;
        const description = document.createElement('p');
        description.textContent = draft.description || '尚未填寫介紹。';
        const remove = document.createElement('button');
        remove.className = 'btn small';
        remove.type = 'button';
        remove.textContent = '移除這件本機練習';
        remove.addEventListener('click', () => {
          const next = drafts.filter((_, number) => number !== index);
          try {
            localStorage.setItem(key, JSON.stringify(next));
            drafts = next;
            renderDrafts();
            status.textContent = '已移除這件本機練習，三件正式作品不受影響。';
          } catch { status.textContent = '瀏覽器未開放儲存，目前無法更新本機練習。'; }
        });
        copy.append(title, description, remove);
        article.append(img, copy);
        list.append(article);
      });
    }
    renderDrafts();
    localForm.addEventListener('submit', async event => {
      event.preventDefault();
      const title = one('#local-title').value.trim();
      const file = one('#local-image').files[0];
      if (!title) { status.textContent = '請填入作品名稱。'; one('#local-title').focus(); return; }
      if (!validImage(file) || file.size > 2 * 1024 * 1024) { status.textContent = '請選擇 2 MB 以內的 JPG、PNG 或 WebP 圖片。'; return; }
      if (drafts.length >= 12) { status.textContent = '本機練習最多保留 12 件，請先移除不需要的練習。'; return; }
      submit.disabled = true;
      try {
        const image = await readImage(file);
        const next = [...drafts, {title, description: one('#local-description').value.trim(), image}];
        localStorage.setItem(key, JSON.stringify(next));
        drafts = next;
        renderDrafts();
        localForm.reset();
        status.textContent = '作品已加入本機練習，沒有上傳到網站。';
      } catch (error) {
        status.textContent = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? '瀏覽器儲存空間不足或未開放，請改用較小的圖片，或先移除舊的本機練習。' : error.message;
      } finally { submit.disabled = false; }
    });
  }
})();
