import { CATALOGO } from '../data/catalogo.js';
import { parseMonto, formatoInputMonto, numeroAFormatoInput, conectarInputMonto, activarPill, toast, fechaHoyLarga } from './utils.js';

const STORAGE_KEY = 'pomiglio_cotizacion_draft';

let estado = cargarEstado() || {
  tipoDoc: 'COTIZACION',
  cliente: '',
  atencion: '',
  ciudad: 'Córdoba',
  tiempoEntrega: 'A coordinar',
  lugarEntrega: 'A coordinar',
  items: [],
  incluirBna: false,
  incluirCheques: false
};
// Por si el borrador guardado es de una versión anterior sin estos campos.
if (estado.incluirBna === undefined) estado.incluirBna = false;
if (estado.incluirCheques === undefined) estado.incluirCheques = false;

let filtroCategoria = null;
let filtroSerie = null;
let contadorItem = 0;

function cargarEstado(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function guardarEstado(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function fmtUSD(n){
  const num = typeof n === 'number' ? n : parseFloat(n) || 0;
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function tituloCortoAuto(catalogoItem){
  const partes = [catalogoItem.marca];
  if (catalogoItem.serie) partes.push(catalogoItem.serie.replace('Serie ', 'Serie '));
  else partes.push(catalogoItem.categoriaFicha);
  if (catalogoItem.capacidadKg) partes.push((catalogoItem.capacidadKg / 1000).toLocaleString('es-AR') + ' T');
  if (catalogoItem.alturaMm && catalogoItem.categoriaFicha === 'Autoelevador eléctrico' || catalogoItem.alturaMm && catalogoItem.categoriaFicha === 'Autoelevador a combustión') {
    partes.push('torre ' + (catalogoItem.alturaMm / 1000).toLocaleString('es-AR') + ' mts');
  }
  return `${catalogoItem.modelo} — ${partes.join(' - ')}`;
}

export function initCotizacion(){
  document.getElementById('docFecha').value = fechaHoyLarga();
  document.getElementById('clienteNombre').value = estado.cliente || '';
  document.getElementById('clienteAtencion').value = estado.atencion || '';
  document.getElementById('docCiudad').value = estado.ciudad || 'Córdoba';
  document.getElementById('docTiempoEntrega').value = estado.tiempoEntrega || 'A coordinar';
  document.getElementById('docLugarEntrega').value = estado.lugarEntrega || 'A coordinar';

  document.getElementById('clienteNombre').addEventListener('input', (e) => { estado.cliente = e.target.value; guardarEstado(); });
  document.getElementById('clienteAtencion').addEventListener('input', (e) => { estado.atencion = e.target.value; guardarEstado(); });
  document.getElementById('docCiudad').addEventListener('input', (e) => { estado.ciudad = e.target.value; guardarEstado(); });
  document.getElementById('docTiempoEntrega').addEventListener('input', (e) => { estado.tiempoEntrega = e.target.value; guardarEstado(); });
  document.getElementById('docLugarEntrega').addEventListener('input', (e) => { estado.lugarEntrega = e.target.value; guardarEstado(); });

  const tipoDocToggle = document.getElementById('tipoDocToggle');
  tipoDocToggle.querySelectorAll('button').forEach(btn => {
    if (btn.dataset.valor === estado.tipoDoc) activarPill(tipoDocToggle, btn);
    btn.addEventListener('click', () => {
      activarPill(tipoDocToggle, btn);
      estado.tipoDoc = btn.dataset.valor;
      guardarEstado();
    });
  });

  document.getElementById('btnAgregarEquipo').addEventListener('click', abrirModalEquipo);
  document.getElementById('cerrarModalEquipo').addEventListener('click', cerrarModalEquipo);
  document.getElementById('modalEquipo').addEventListener('click', (e) => {
    if (e.target.id === 'modalEquipo') cerrarModalEquipo();
  });

  document.getElementById('btnVaciar').addEventListener('click', () => {
    if (!estado.items.length) return;
    if (confirm('¿Vaciar todos los equipos agregados?')) {
      estado.items = [];
      guardarEstado();
      render();
    }
  });

  document.getElementById('btnGenerarDoc').addEventListener('click', generarDocumento);
  document.getElementById('btnImprimir').addEventListener('click', () => window.print());

  const chkBna = document.getElementById('cotIncluirBna');
  const chkCheques = document.getElementById('cotIncluirCheques');
  chkBna.checked = !!estado.incluirBna;
  chkCheques.checked = !!estado.incluirCheques;
  chkBna.addEventListener('change', (e) => { estado.incluirBna = e.target.checked; guardarEstado(); });
  chkCheques.addEventListener('change', (e) => { estado.incluirCheques = e.target.checked; guardarEstado(); });

  renderChipsCategoria();
  render();
}

/* ---------------- Modal: selector de equipo ---------------- */

function abrirModalEquipo(){
  filtroCategoria = null;
  filtroSerie = null;
  document.getElementById('modalEquipo').classList.add('activo');
  renderChipsCategoria();
  renderChipsSerie();
  renderListaModelos();
}

function cerrarModalEquipo(){
  document.getElementById('modalEquipo').classList.remove('activo');
}

function categoriasDisponibles(){
  return [...new Set(CATALOGO.map(e => e.categoriaFicha))];
}

function seriesDisponibles(categoria){
  return [...new Set(CATALOGO.filter(e => e.categoriaFicha === categoria && e.serie).map(e => e.serie))];
}

function renderChipsCategoria(){
  const wrap = document.getElementById('chipsCategoria');
  wrap.innerHTML = '';
  categoriasDisponibles().forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (filtroCategoria === cat ? ' activo' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      filtroCategoria = (filtroCategoria === cat) ? null : cat;
      filtroSerie = null;
      renderChipsCategoria();
      renderChipsSerie();
      renderListaModelos();
    });
    wrap.appendChild(chip);
  });
}

function renderChipsSerie(){
  const wrap = document.getElementById('chipsSerie');
  const contenedor = document.getElementById('chipsSerieWrap');
  wrap.innerHTML = '';
  if (!filtroCategoria) { contenedor.style.display = 'none'; return; }
  const series = seriesDisponibles(filtroCategoria);
  if (!series.length) { contenedor.style.display = 'none'; return; }
  contenedor.style.display = 'block';
  series.forEach(serie => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (filtroSerie === serie ? ' activo' : '');
    chip.textContent = serie;
    chip.addEventListener('click', () => {
      filtroSerie = (filtroSerie === serie) ? null : serie;
      renderChipsSerie();
      renderListaModelos();
    });
    wrap.appendChild(chip);
  });
}

function renderListaModelos(){
  const wrap = document.getElementById('listaModelos');
  wrap.innerHTML = '';
  let lista = CATALOGO;
  if (filtroCategoria) lista = lista.filter(e => e.categoriaFicha === filtroCategoria);
  if (filtroSerie) lista = lista.filter(e => e.serie === filtroSerie);
  if (!filtroCategoria) {
    wrap.innerHTML = '<div class="vacio" style="padding:20px;"><p>Elegí una categoría para ver los modelos.</p></div>';
    return;
  }
  if (!lista.length) {
    wrap.innerHTML = '<div class="vacio" style="padding:20px;"><p>No hay equipos en esta combinación.</p></div>';
    return;
  }
  lista.forEach(item => {
    const el = document.createElement('div');
    el.className = 'modelo-opcion';
    const cap = item.capacidadKg ? `${item.capacidadKg.toLocaleString('es-AR')} kg` : '';
    const alt = item.alturaMm ? `${item.alturaMm.toLocaleString('es-AR')} mm` : '';
    const detalle = [cap, alt].filter(Boolean).join(' · ');
    const promo = item.comentarios && /promo/i.test(item.comentarios) ? `<span class="mo-promo">${item.comentarios}</span>` : '';
    el.innerHTML = `
      <div class="mo-info">
        <span class="mo-modelo">${item.modelo}</span>
        <span class="mo-detalle">${detalle || item.categoriaFicha}</span>
        ${promo}
      </div>
      <svg class="mo-flecha" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
    `;
    el.addEventListener('click', () => agregarItem(item));
    wrap.appendChild(el);
  });
}

export function hayItemsEnCotizacion(){
  return estado.items.length > 0;
}

/* ---------------- Agregar / renderizar ítems ---------------- */

function agregarItem(catalogoItem){
  contadorItem += 1;
  const item = {
    id: 'it' + Date.now() + '_' + contadorItem,
    modelo: catalogoItem.modelo,
    marca: catalogoItem.marca,
    categoria: catalogoItem.categoriaFicha,
    serie: catalogoItem.serie,
    fichaPdf: catalogoItem.fichaPdf,
    tituloOferta: `${/^(Autoelevador|Transpaleta|Apilador)/.test(catalogoItem.categoriaFicha) ? catalogoItem.categoriaFicha.split(' ')[0] : 'Equipo'} modelo ${catalogoItem.modelo}`,
    descripcion: catalogoItem.descripcionAuto,
    tipoCorto: tituloCortoAuto(catalogoItem),
    precioTipo: 'contado',
    precio: catalogoItem.contado,
    precioContado: catalogoItem.contado,
    precioDistribuidor: catalogoItem.distribuidor
  };
  estado.items.push(item);
  guardarEstado();
  cerrarModalEquipo();
  render();
  toast('Equipo agregado');
}

function quitarItem(id){
  estado.items = estado.items.filter(i => i.id !== id);
  guardarEstado();
  render();
}

function render(){
  const wrap = document.getElementById('listaItems');
  const vacio = document.getElementById('itemsVacio');
  const cardDoc = document.getElementById('cardDocumento');
  wrap.innerHTML = '';

  document.dispatchEvent(new CustomEvent('pomiglio:items-cambiaron'));

  if (!estado.items.length) {
    vacio.style.display = 'block';
    cardDoc.style.display = 'none';
    return;
  }
  vacio.style.display = 'none';

  estado.items.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'item-cotizacion';
    el.innerHTML = `
      <div class="item-cabecera">
        <div>
          <div class="item-titulo">${idx + 1}. ${item.modelo}</div>
          <div class="item-sub">${item.marca} · ${item.serie || item.categoria}</div>
        </div>
        <button class="btn btn-peligro btn-chico" data-accion="quitar" type="button">Quitar</button>
      </div>

      <div class="field" style="margin-bottom:8px;">
        <label>Título (encabezado de la oferta técnica)</label>
        <input type="text" data-campo="tituloOferta" value="${escapeAttr(item.tituloOferta)}">
      </div>

      <div class="field" style="margin-bottom:8px;">
        <label>Descripción técnica (se muestra completa bajo "Oferta técnica")</label>
        <textarea data-campo="descripcion" rows="6">${escapeHtml(item.descripcion)}</textarea>
      </div>

      <div class="field" style="margin-bottom:4px;">
        <label>Línea corta (va en la tabla de precio final)</label>
        <input type="text" data-campo="tipoCorto" value="${escapeAttr(item.tipoCorto)}">
      </div>

      <div class="item-precio-row">
        <span class="badge-interno" title="Este dato es solo interno, nunca se muestra en el documento del cliente">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/></svg>
          Uso interno
        </span>
        <div class="pill-toggle" data-precio-toggle style="--pt-i:${item.precioTipo === 'distribuidor' ? 1 : 0}">
          <button type="button" data-tipo="contado" class="${item.precioTipo === 'contado' ? 'activo' : ''}">Contado</button>
          <button type="button" data-tipo="distribuidor" class="${item.precioTipo === 'distribuidor' ? 'activo' : ''}">Distribuidor</button>
        </div>
        <div class="campo-precio">
          <span>USD</span>
          <input type="text" data-campo="precio" inputmode="decimal" value="${numeroAFormatoInput(item.precio)}">
        </div>
      </div>

      ${item.fichaPdf
        ? `<a class="ficha-link" href="fichas/${encodeURIComponent(item.fichaPdf)}" target="_blank" rel="noopener">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v13m0 0l-4-4m4 4l4-4"/><path d="M4 19h16"/></svg>
             Adjuntar / descargar ficha técnica (${item.fichaPdf})
           </a>`
        : `<div class="sin-ficha">Sin ficha técnica en PDF cargada todavía para este modelo.</div>`
      }
    `;

    el.querySelector('[data-accion="quitar"]').addEventListener('click', () => {
      el.classList.add('saliendo');
      el.addEventListener('animationend', () => quitarItem(item.id), { once: true });
    });
    el.querySelector('[data-campo="tituloOferta"]').addEventListener('input', (e) => { item.tituloOferta = e.target.value; guardarEstado(); });
    el.querySelector('[data-campo="descripcion"]').addEventListener('input', (e) => { item.descripcion = e.target.value; guardarEstado(); });
    el.querySelector('[data-campo="tipoCorto"]').addEventListener('input', (e) => { item.tipoCorto = e.target.value; guardarEstado(); });

    const precioInput = el.querySelector('[data-campo="precio"]');
    conectarInputMonto(precioInput, () => { item.precio = parseMonto(precioInput.value); guardarEstado(); });

    const precioToggle = el.querySelector('[data-precio-toggle]');
    precioToggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        activarPill(precioToggle, btn);
        item.precioTipo = btn.dataset.tipo;
        item.precio = item.precioTipo === 'contado' ? item.precioContado : item.precioDistribuidor;
        precioInput.value = numeroAFormatoInput(item.precio);
        guardarEstado();
      });
    });

    wrap.appendChild(el);
  });
}

function escapeHtml(s){
  return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(s){
  return escapeHtml(s).replace(/"/g, '&quot;');
}

/* ---------------- Opciones de financiación (BNA Conecta / Cheques) ---------------- */

function textoOpcionesFinanciacion(){
  const extras = [];

  if (document.getElementById('cotIncluirBna').checked) {
    const cuota = document.getElementById('cuotaMensual').textContent.trim();
    const plazo = document.getElementById('plazoLabel').textContent.trim();
    const tna = document.getElementById('tna').value;
    extras.push(
      `Opción BNA Conecta: ${escapeHtml(plazo)} cuotas de ${escapeHtml(cuota)} (TNA ${escapeHtml(tna)}%). ` +
      `Si el cliente todavía no tiene cuenta en el Banco Nación, puede verificar si califica para abrir una en: ` +
      `<a href="https://bna.com.ar/Califica/Empresa" target="_blank" rel="noopener">bna.com.ar/Califica/Empresa</a>.`
    );
  }

  if (document.getElementById('cotIncluirCheques').checked) {
    const chequeArs = document.getElementById('chChequeARS').textContent.trim();
    const chequeUsd = document.getElementById('chChequeUSD').textContent.trim();
    const entregaArs = document.getElementById('chEntregaARS').textContent.trim();
    const n = document.getElementById('chCantCheques').value;
    extras.push(
      `Opción financiación propia: entrega de ${escapeHtml(entregaArs)} + ${escapeHtml(n)} cheques de ${escapeHtml(chequeArs)} (${escapeHtml(chequeUsd)}) c/u.`
    );
  }

  return extras.length ? '<br>' + extras.join('<br>') : '';
}

/* ---------------- Generar documento (Cotización / Proforma) ---------------- */

function generarDocumento(){
  if (!estado.items.length) { toast('Agregá al menos un equipo'); return; }

  const ciudad = document.getElementById('docCiudad').value || 'Córdoba';
  const fecha = document.getElementById('docFecha').value || fechaHoyLarga();
  const refTexto = estado.tipoDoc === 'PROFORMA' ? 'PROFORMA' : 'COTIZACION';
  const cliente = document.getElementById('clienteNombre').value;
  const atencion = document.getElementById('clienteAtencion').value;

  let html = `
    <div class="doc-header">
      <img src="assets/logo-pomiglio.png" alt="Grupo Pomiglio">
      <div class="doc-ref">
        <div><strong>GRUPO POMIGLIO SRL</strong></div>
        <div>CUIT 30-71066861-9</div>
        <div>${escapeHtml(ciudad.toUpperCase())}, ${escapeHtml(fecha)}</div>
        <div style="margin-top:6px; font-weight:700;">Ref.: ${refTexto}</div>
      </div>
    </div>
    ${cliente ? `<p><strong>Sr./Sres.:</strong> ${escapeHtml(cliente)}${atencion ? ` — At.: ${escapeHtml(atencion)}` : ''}</p>` : ''}
    <p>De nuestra mayor consideración:</p>
    <p>En nuestro carácter de concesionario de la Línea de equipos para manipuleo de materiales producidos por HANGCHA forklift truck, nos dirigimos a Uds., a los efectos de cotizarles los siguientes equipos.</p>
  `;

  estado.items.forEach((item) => {
    html += `<h3>OFERTA TÉCNICA — ${escapeHtml(item.tituloOferta)}</h3>`;
    html += `<div class="doc-item-desc">${escapeHtml(item.descripcion)}</div>`;
  });

  html += `
    <table>
      <thead><tr><th>Ítem</th><th>Tipo</th><th style="text-align:right">Precio USD</th></tr></thead>
      <tbody>
        ${estado.items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(item.tipoCorto)}</td>
            <td class="num">USD ${fmtUSD(item.precio)} + IVA 10,5%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h3>Oferta económica</h3>
    <p>Dólar oficial BNA al día de la facturación.</p>

    <h3>Oferta comercial</h3>
    <p>
      Validez: 7 días de fecha de presentación.<br>
      Tiempo de entrega: ${escapeHtml(document.getElementById('docTiempoEntrega').value || 'A coordinar')}.<br>
      Lugar de entrega: ${escapeHtml(document.getElementById('docLugarEntrega').value || 'A coordinar')}.<br>
      Forma de pago: transferencia, efectivo, contado entregando el 30% financiás el restante en 30, 60, 90 días sin interés y hasta 360 días con interés, a través de Banco Nación hasta 36 meses (consultar tasas).${textoOpcionesFinanciacion()}
    </p>

    <p>Nos gustaría agradecerles por la confianza y el interés depositado en Grupo Pomiglio para la ejecución de este servicio.</p>
    <p>Estamos a su entera disposición para esclarecer eventuales dudas, y reiteramos nuestro compromiso para la mejora continua de la calidad del servicio.</p>
    <p>Poniendo nuestra experiencia y compromiso a disposición de sus requerimientos, les saludamos cordialmente.</p>
  `;

  document.getElementById('docPreview').innerHTML = html;
  document.getElementById('cardDocumento').style.display = 'block';
  document.getElementById('cardDocumento').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
