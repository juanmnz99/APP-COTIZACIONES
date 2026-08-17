import { parseMonto, formatoMoneda, conectarInputMonto, formatoInputMonto, numeroAFormatoInput } from './utils.js';
import { getTC, onTCChange } from './tc-compartido.js';

export function initCheques(){
  const chPrecioInput = document.getElementById('chPrecio');
  const chTCInput = document.getElementById('chTC');
  const chEntregaPctInput = document.getElementById('chEntregaPct');
  const chAdelantoInput = document.getElementById('chAdelanto');
  const chCantChequesInput = document.getElementById('chCantCheques');
  const chTasaInput = document.getElementById('chTasa');
  const chIvaInput = document.getElementById('chIva');
  const chTablaBody = document.getElementById('chTablaBody');

  let tcTocadoAMano = false;

  function calcular(){
    const precio = parseMonto(chPrecioInput.value);
    const tc = parseFloat(chTCInput.value.replace(',', '.')) || 0;
    const entregaPct = (parseFloat(chEntregaPctInput.value) || 0) / 100;
    const adelanto = parseMonto(chAdelantoInput.value);
    const n = Math.max(1, parseInt(chCantChequesInput.value) || 1);
    const tasa = (parseFloat(chTasaInput.value) || 0) / 100;
    const ivaPct = (parseFloat(chIvaInput.value) || 0) / 100;

    const entregaBruta = precio * entregaPct - adelanto;
    const saldo = precio * (1 - entregaPct);
    const cuotaPura = saldo / n;

    let sumaCuotas = 0;
    for (let i = 1; i <= n; i++) {
      sumaCuotas += cuotaPura * (1 + i * tasa);
    }

    const totalPuro = entregaBruta + sumaCuotas;
    const iva = totalPuro * ivaPct;
    const entregaConIva = entregaBruta + iva;
    const promedioCheque = sumaCuotas / n;
    const totalGeneral = entregaConIva + sumaCuotas;
    const costoFinanciero = totalPuro - precio + adelanto;

    const entregaConIvaARS = entregaConIva * tc;
    const promedioChequeARS = promedioCheque * tc;
    const totalGeneralARS = totalGeneral * tc;
    const costoFinancieroARS = costoFinanciero * tc;

    document.getElementById('chChequeARS').textContent = formatoMoneda(promedioChequeARS);
    document.getElementById('chChequeUSD').textContent = formatoMoneda(promedioCheque, 'U$D ');
    document.getElementById('chEntregaARS').textContent = formatoMoneda(entregaConIvaARS);
    document.getElementById('chEntregaUSD').textContent = formatoMoneda(entregaConIva, 'U$D ');
    document.getElementById('chTotalARS').textContent = formatoMoneda(totalGeneralARS);
    document.getElementById('chTotalUSD').textContent = formatoMoneda(totalGeneral, 'U$D ');
    document.getElementById('chCostoARS').textContent = formatoMoneda(costoFinancieroARS);
    document.getElementById('chCostoUSD').textContent = formatoMoneda(costoFinanciero, 'U$D ');

    chTablaBody.innerHTML = '';
    const filaEntrega = document.createElement('tr');
    filaEntrega.innerHTML = `<td>Entrega</td><td>Día 0</td><td class="num"><span class="ars">${formatoMoneda(entregaConIvaARS)}</span><span class="usd">${formatoMoneda(entregaConIva, 'U$D ')}</span></td>`;
    chTablaBody.appendChild(filaEntrega);
    for (let i = 1; i <= n; i++) {
      const fila = document.createElement('tr');
      fila.innerHTML = `<td>Cheque ${i}</td><td>${i * 30} días</td><td class="num"><span class="ars">${formatoMoneda(promedioChequeARS)}</span><span class="usd">${formatoMoneda(promedioCheque, 'U$D ')}</span></td>`;
      chTablaBody.appendChild(fila);
    }

    const texto = `Cotización financiación propia:%0APrecio: U$D ${formatoMoneda(precio, '')}%0ATC: $${tc}%0AEntrega: ${formatoMoneda(entregaConIvaARS)} (U$D ${formatoMoneda(entregaConIva, '')})%0A${n} cheques de ${formatoMoneda(promedioChequeARS)} c/u (U$D ${formatoMoneda(promedioCheque, '')})%0ATotal financiado: ${formatoMoneda(totalGeneralARS)}`;
    document.getElementById('chWaBtn').href = `https://wa.me/?text=${texto}`;
  }

  [chEntregaPctInput, chCantChequesInput, chTasaInput, chIvaInput].forEach(el => {
    el.addEventListener('input', calcular);
  });
  [chPrecioInput, chAdelantoInput].forEach(el => conectarInputMonto(el, calcular));
  conectarInputMonto(chTCInput, () => { tcTocadoAMano = true; calcular(); });

  // El campo de TC de esta pestaña arranca sincronizado con el tipo de cambio compartido
  // de la barra superior; si el usuario lo edita a mano acá, dejamos de seguir el global
  // (por si esta cotización puntual necesita otro valor).
  onTCChange((tc) => {
    if (!tcTocadoAMano) {
      chTCInput.value = numeroAFormatoInput(tc);
      calcular();
    }
  });

  chPrecioInput.value = formatoInputMonto(chPrecioInput.value);
  chAdelantoInput.value = formatoInputMonto(chAdelantoInput.value);
  chTCInput.value = numeroAFormatoInput(getTC());
  calcular();
}
