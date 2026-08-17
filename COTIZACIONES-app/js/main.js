import { initTCCompartido } from './tc-compartido.js';
import { initCotizacion, hayItemsEnCotizacion } from './tab-cotizacion.js';
import { initCheques } from './tab-cheques.js';
import { initBna } from './tab-bna.js';
import { initPwa } from './pwa.js';

function initTabs(){
  const tabBtns = document.querySelectorAll('.tab-btn');
  const paneles = {
    cotizacion: document.getElementById('panel-cotizacion'),
    cheques: document.getElementById('panel-cheques'),
    bna: document.getElementById('panel-bna')
  };
  const barraFlotante = document.getElementById('barraFlotante');

  function sincronizarBarraFlotante(tabActiva){
    barraFlotante.style.display = (tabActiva === 'cotizacion' && hayItemsEnCotizacion()) ? 'block' : 'none';
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      Object.values(paneles).forEach(p => p.classList.remove('activo'));
      paneles[btn.dataset.tab].classList.add('activo');
      sincronizarBarraFlotante(btn.dataset.tab);
    });
  });

  // Cualquier cambio en la lista de ítems (agregar/quitar/vaciar) puede afectar la barra
  // flotante incluso si en ese momento estamos parados en otra pestaña.
  document.addEventListener('pomiglio:items-cambiaron', () => {
    const activa = document.querySelector('.tab-btn.activo')?.dataset.tab;
    sincronizarBarraFlotante(activa);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTCCompartido();
  initCotizacion();
  initCheques();
  initBna();
  initPwa();
});
