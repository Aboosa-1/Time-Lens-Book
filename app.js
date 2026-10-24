(() => {
  'use strict';

  const screens = ['home', 'eras', 'kings', 'success'];
  let currentScreen = 'home';
  let toastTimer = null;
  let deferredInstall = null;

  const elements = Object.fromEntries(screens.map((screen) => [screen, document.getElementById(`screen-${screen}`)]));
  const toast = document.getElementById('toast');
  const installDialog = document.getElementById('installDialog');

  function showScreen(next, updateHistory = true) {
    if (!screens.includes(next)) return;
    currentScreen = next;
    Object.entries(elements).forEach(([key, section]) => {
      section.hidden = key !== next;
      section.classList.toggle('is-active', key === next);
      if (key === next) section.scrollTop = 0;
    });
    document.body.dataset.screen = next;
    if (updateHistory && window.history.state?.screen !== next) {
      window.history.pushState({ screen: next }, '', `#${next}`);
    }
    const heading = document.querySelector(`#screen-${next} h1, #screen-${next} h2`);
    if (heading) document.title = `${heading.textContent.trim()} | Time Lens`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
      toast.hidden = true;
    }, 2600);
  }

  document.addEventListener('click', (event) => {
    const lockedCard = event.target.closest('[data-locked]');
    if (lockedCard) {
      showToast(`${lockedCard.dataset.locked} هتكون متاحة قريبًا ✨`);
      return;
    }
    const nav = event.target.closest('[data-nav]');
    if (nav) showScreen(nav.dataset.nav);
  });

  window.addEventListener('popstate', (event) => {
    const next = event.state?.screen;
    showScreen(screens.includes(next) ? next : 'home', false);
  });

  // A real PWA installation prompt is only available on supported browsers via HTTPS or localhost.
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstall = event;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    showToast('تم تثبيت تطبيق Time Lens بنجاح');
  });

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }
  function closeInstallDialog() {
    if (installDialog.open) installDialog.close();
  }
  document.getElementById('installButton').addEventListener('click', async () => {
    if (isInstalled()) {
      showToast('أنت فاتح التطبيق بالفعل');
      return;
    }
    if (deferredInstall) {
      const prompt = deferredInstall;
      deferredInstall = null;
      await prompt.prompt();
      return;
    }
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    document.getElementById('installHelp').textContent = isIos
      ? 'على Safari اضغط على زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وبعدها «إضافة».'
      : 'من قائمة المتصفح اختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». لازم تفتح الرابط عبر HTTPS أو localhost.';
    installDialog.showModal();
  });
  document.getElementById('closeDialog').addEventListener('click', closeInstallDialog);
  document.getElementById('gotIt').addEventListener('click', closeInstallDialog);
  installDialog.addEventListener('click', (e) => {
    if (e.target === installDialog) closeInstallDialog();
  });

  // When the device's back button is used, screen navigation follows browser history.
  window.history.replaceState({ screen: 'home' }, '', '#home');
  showScreen('home', false);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker was not registered:', error);
      });
    });
  }
})();
