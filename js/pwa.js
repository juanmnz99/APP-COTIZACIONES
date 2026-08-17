// Registro del service worker + botón de "Instalar" cuando el navegador lo permite
// (Android/Chrome/Edge/Windows). En iOS/Safari no existe ese prompt: ahí se instala
// con "Compartir → Agregar a pantalla de inicio", así que mostramos un aviso la
// primera vez en vez de un botón que no funcionaría.

export function initPwa(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  let promptDiferido = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptDiferido = e;
    mostrarBotonInstalar();
  });

  function mostrarBotonInstalar(){
    if (document.getElementById('btnInstalarPWA')) return;
    const btn = document.createElement('button');
    btn.id = 'btnInstalarPWA';
    btn.className = 'btn btn-outline btn-chico';
    btn.type = 'button';
    btn.style.marginLeft = '8px';
    btn.style.flexShrink = '0';
    btn.textContent = 'Instalar app';
    btn.style.color = '#fff';
    btn.style.borderColor = 'rgba(255,255,255,.5)';
    btn.addEventListener('click', async () => {
      if (!promptDiferido) return;
      promptDiferido.prompt();
      await promptDiferido.userChoice;
      promptDiferido = null;
      btn.remove();
    });
    document.querySelector('.topbar').appendChild(btn);
  }

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('btnInstalarPWA');
    if (btn) btn.remove();
  });

  // Aviso simple para iOS Safari (no dispara beforeinstallprompt).
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (esIOS && !yaInstalada && !localStorage.getItem('pomiglio_aviso_ios_visto')) {
    localStorage.setItem('pomiglio_aviso_ios_visto', '1');
    setTimeout(() => {
      import('./utils.js').then(({ toast }) => {
        toast('Para instalarla: tocá Compartir → Agregar a pantalla de inicio');
      });
    }, 1500);
  }
}
