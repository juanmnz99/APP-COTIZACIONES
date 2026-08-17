/* ---------- Tipo de cambio USD→ARS compartido entre Cotización / Cheques / BNA ----------
   Un solo valor, editable desde la barra superior, que se guarda en localStorage y se
   propaga a los demás campos de tipo de cambio de la app (Cheques tiene su propio campo
   por si una cotización puntual necesita otro valor, pero arranca sincronizado con este). */
import { parseMonto, numeroAFormatoInput, conectarInputMonto } from './utils.js';

const STORAGE_KEY = 'pomiglio_tc_compartido';
const listeners = [];

let valor = parseMonto(localStorage.getItem(STORAGE_KEY) || '1000');

export function getTC(){
  return valor;
}

export function setTC(nuevoValor){
  valor = nuevoValor;
  localStorage.setItem(STORAGE_KEY, String(nuevoValor));
  listeners.forEach(fn => fn(valor));
}

export function onTCChange(fn){
  listeners.push(fn);
}

export function initTCCompartido(){
  const input = document.getElementById('tcGlobal');
  if (!input) return;
  input.value = numeroAFormatoInput(valor);
  conectarInputMonto(input, () => setTC(parseMonto(input.value)));
}
