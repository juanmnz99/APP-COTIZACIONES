import { parseMonto, formatoMoneda, conectarInputMonto, formatoInputMonto, activarPill } from './utils.js';
import { getTC, onTCChange } from './tc-compartido.js';

export function initBna(){
  const montoInput = document.getElementById('monto');
  const tnaInput = document.getElementById('tna');
  const plazoSlider = document.getElementById('plazoSlider');
  const plazoLabel = document.getElementById('plazoLabel');
  const plazoAtajos = document.querySelectorAll('.plazo-atajo');
  const monedaToggle = document.getElementById('bnaMonedaToggle');
  let plazoMeses = 24;
  let moneda = 'ARS';

  function montoEnARS(){
    const m = parseMonto(montoInput.value);
    return moneda === 'USD' ? m * getTC() : m;
  }

  function calcular(){
    const monto = montoEnARS();
    const tna = parseFloat(tnaInput.value) || 0;
    const iMensual = (tna / 100) / 12;
    let cuota;
    if (iMensual === 0) {
      cuota = monto / plazoMeses;
    } else {
      cuota = monto * iMensual / (1 - Math.pow(1 + iMensual, -plazoMeses));
    }
    const total = cuota * plazoMeses;
    const interes = total - monto;

    document.getElementById('cuotaMensual').textContent = formatoMoneda(cuota);
    document.getElementById('rMonto').textContent = formatoMoneda(monto);
    document.getElementById('rPlazo').textContent = plazoMeses + ' meses';
    document.getElementById('rTotal').textContent = formatoMoneda(total);
    document.getElementById('rInteres').textContent = formatoMoneda(interes);

    const texto = `Simulación de financiación BNA Conecta:%0AMonto: ${formatoMoneda(monto)}%0APlazo: ${plazoMeses} meses%0ATNA: ${tna}%25%0ACuota estimada: ${formatoMoneda(cuota)}%0ATotal a pagar: ${formatoMoneda(total)}`;
    document.getElementById('waBtn').href = `https://wa.me/?text=${texto}`;
  }

  function sincronizarAtajos(){
    plazoAtajos.forEach(a => a.classList.toggle('activo', parseInt(a.dataset.meses) === plazoMeses));
  }

  conectarInputMonto(montoInput, calcular);
  tnaInput.addEventListener('input', calcular);

  plazoSlider.addEventListener('input', () => {
    plazoMeses = parseInt(plazoSlider.value);
    plazoLabel.textContent = plazoMeses;
    sincronizarAtajos();
    calcular();
  });

  plazoAtajos.forEach(btn => {
    btn.addEventListener('click', () => {
      plazoMeses = parseInt(btn.dataset.meses);
      plazoSlider.value = plazoMeses;
      plazoLabel.textContent = plazoMeses;
      sincronizarAtajos();
      calcular();
    });
  });

  monedaToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activarPill(monedaToggle, btn);
      moneda = btn.dataset.valor;
      calcular();
    });
  });

  onTCChange(calcular);

  montoInput.value = formatoInputMonto(montoInput.value);
  calcular();
}
