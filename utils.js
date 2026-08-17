/* ---------- Utilidades numéricas compartidas (formato es-AR) ---------- */

// Acepta formato es-AR: puntos como separador de miles, coma como decimal (ej: 13.590,50)
export function limpiarEntradaDecimal(str){
  let s = String(str).replace(/[^0-9,]/g, '');
  const primeraComa = s.indexOf(',');
  if (primeraComa !== -1) {
    s = s.slice(0, primeraComa + 1) + s.slice(primeraComa + 1).replace(/,/g, '');
  }
  return s;
}

export function parseMonto(str){
  let s = limpiarEntradaDecimal(str);
  if (s === '' || s === ',') return 0;
  s = s.replace(',', '.');
  return parseFloat(s) || 0;
}

export function formatoMoneda(num, prefijo = '$'){
  return prefijo + Math.round(num).toLocaleString('es-AR');
}

export function formatoInputMonto(valor){
  let s = limpiarEntradaDecimal(valor);
  if (s === '') return '';
  let [intPart, decPart] = s.split(',');
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  const intFormateado = parseInt(intPart, 10).toLocaleString('es-AR');
  return decPart !== undefined ? intFormateado + ',' + decPart : intFormateado;
}

// Convierte un número JS "de fábrica" (punto decimal, ej: 7780.3) al formato de texto
// es-AR (coma decimal) que espera parseMonto/limpiarEntradaDecimal.
export function numeroAFormatoInput(num){
  if (num === null || num === undefined || num === '') return '';
  const n = typeof num === 'number' ? num : parseFloat(String(num).replace(',', '.'));
  if (isNaN(n)) return String(num);
  let s = n.toFixed(2);
  if (s.endsWith('.00')) s = s.slice(0, -3);
  else if (s.endsWith('0')) s = s.slice(0, -1);
  const [intPart, decPart] = s.split('.');
  const intFormateado = parseInt(intPart, 10).toLocaleString('es-AR');
  return decPart ? intFormateado + ',' + decPart : intFormateado;
}

// Hace que un <input> de texto se comporte como campo de monto: reformatea a medida
// que se escribe, preservando la posición del cursor cuando está al final.
export function conectarInputMonto(input, onChange){
  input.addEventListener('input', (e) => {
    const cursorAlFinal = e.target.selectionStart === e.target.value.length;
    e.target.value = formatoInputMonto(e.target.value);
    if (cursorAlFinal) e.target.setSelectionRange(e.target.value.length, e.target.value.length);
    if (onChange) onChange();
  });
}

// Activa un botón dentro de un .pill-toggle (Cotización/Proforma, Contado/Distribuidor,
// ARS/USD, etc.), deja el resto inactivos y actualiza la variable --pt-i que anima el
// fondo deslizante en CSS.
export function activarPill(contenedor, btnActivo){
  const botones = Array.from(contenedor.children).filter(el => el.tagName === 'BUTTON');
  botones.forEach(b => b.classList.toggle('activo', b === btnActivo));
  const indice = botones.indexOf(btnActivo);
  if (indice !== -1) contenedor.style.setProperty('--pt-i', indice);
}

export function toast(mensaje){
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = mensaje;
  el.classList.add('activo');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('activo'), 2200);
}

export function fechaHoyLarga(){
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = new Date();
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
