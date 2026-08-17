  // Captura cualquier error de JavaScript (incluso dentro de los botones de PDF/WhatsApp) y lo
  // muestra en una franja roja arriba de la pantalla, en vez de que "no pase nada" en silencio.
  // Sacale una captura de pantalla a ese texto si algo falla y mandámela.
  function mostrarErrorBanner(msg){
    var b = document.getElementById('errorBanner');
    if(!b) return;
    // El estilo de la franja y del botón vive en css/styles.css (clase .error-banner);
    // acá solo tocamos contenido y visibilidad.
    b.textContent = msg + ' ';
    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.textContent = 'Cerrar';
    cerrar.onclick = function(){ b.style.display = 'none'; };
    b.appendChild(cerrar);
    b.style.display = 'block';
  }
  window.addEventListener('error', function(e){
    var extra = e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : '';
    mostrarErrorBanner('Error de JavaScript: ' + (e.message || 'desconocido') + extra);
  });
  window.addEventListener('unhandledrejection', function(e){
    var msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason);
    mostrarErrorBanner('Error: ' + msg);
  });
