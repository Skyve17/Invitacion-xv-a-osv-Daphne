/**
 * ============================================================================
 * MIS XV AÑOS - DAPHNE | BOSQUE ENCANTADO
 * - Pases personalizados (?i=lizbeth o ?p=token)
 * - Confirmación automática guardada en el servidor + Excel (.xlsx) + Google Sheets
 * - Melodía de vals, cuenta regresiva y motor de partículas del bosque encantado
 * ============================================================================
 */

const CONFIG = {
  quinceanera: 'Daphne',
  padres: 'Laura y Jonas',
  // Fecha del evento: 20 de Marzo de 2027 a las 19:00 hrs
  fechaEventoISO: '2027-03-20T19:00:00',
  lugarNombre: 'Salón Toscana Jardín de Eventos',
  // Link de Google Maps
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Salon+Toscana+Jardin+de+Eventos',
  // Teléfono opcional para saludo extra por WhatsApp
  telefonoWhatsApp: '',
  // IP local por defecto (se actualiza automáticamente desde /api/network-info)
  ipLocalWiFi: 'http://192.168.1.71:8080'
};

let currentGuest = null;

document.addEventListener('DOMContentLoaded', () => {
  initPersonalizedPass();
  initEnvelopeAndMusic();
  initCountdown();
  initCalendarAndMaps();
  initScrollReveal();
  initRsvpForm();
  initQrPreviewModal();
  initEnchantedForestCanvas();
});

/* ============================================================================
   0. CARGA DE PASE PERSONALIZADO (EJ. ?i=lizbeth -> PASE PARA 4 PERSONAS)
   ============================================================================ */
async function initPersonalizedPass() {
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get('i') || params.get('id') || params.get('codigo');
  const encodedParam = params.get('p');
  const directName = params.get('invitado') || params.get('nombre');
  const directPasses = params.get('pases');

  // 1) Si viene un código de invitado (?i=lizbeth), consultamos al servidor
  if (codeParam) {
    try {
      const res = await fetch(`/api/invitado/${encodeURIComponent(codeParam)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.invitado) {
          applyGuestData(data.invitado);
          return;
        }
      }
    } catch (err) {
      console.warn('Modo sin conexión al consultar invitado:', err);
    }
  }

  // 2) Si viene un token codificado en Base64 (?p=...)
  if (encodedParam) {
    try {
      const decoded = decodeURIComponent(escape(atob(encodedParam)));
      const [nombre, pases, mesa, codigo] = decoded.split('|');
      if (nombre) {
        applyGuestData({
          codigo: codigo || nombre,
          nombre: nombre.trim(),
          pasesAsignados: Math.max(1, Number(pases) || 2),
          mesa: (mesa || '').trim(),
          estado: 'Pendiente'
        });
        return;
      }
    } catch (e) {
      console.warn('Token ?p inválido:', e);
    }
  }

  // 3) Si vienen parámetros directos (?invitado=Lizbeth&pases=4)
  if (directName) {
    applyGuestData({
      codigo: codeParam || directName,
      nombre: directName.trim(),
      pasesAsignados: Math.max(1, Number(directPasses) || 2),
      mesa: params.get('mesa') || '',
      estado: 'Pendiente'
    });
  }
}

function applyGuestData(guest) {
  currentGuest = guest;
  const maxPasses = Math.max(1, Number(guest.pasesAsignados) || 1);
  const passText = maxPasses === 1 ? '1 persona' : `${maxPasses} personas`;
  const passBadgeText = maxPasses === 1 ? '1 Persona' : `${maxPasses} Personas`;

  // 1) Mostrar en el Sobre Mágico de entrada
  const envBox = document.getElementById('envelope-guest-box');
  const envName = document.getElementById('envelope-guest-name');
  const envPasses = document.getElementById('envelope-guest-passes');
  if (envBox && envName && envPasses) {
    envName.textContent = guest.nombre;
    envPasses.textContent = `🎟️ Pase reservado para ${passText}`;
    envBox.style.display = 'block';
  }

  // 2) Mostrar la sección de Boleto Dorado dentro de la invitación
  const ticketSection = document.getElementById('guest-ticket-section');
  const ticketName = document.getElementById('ticket-guest-name');
  const ticketPasses = document.getElementById('ticket-passes-num');
  const ticketMesaBox = document.getElementById('ticket-mesa-box');
  const ticketMesaNum = document.getElementById('ticket-mesa-num');
  const ticketStatus = document.getElementById('ticket-status-text');

  if (ticketSection) {
    ticketSection.style.display = 'flex';
    if (ticketName) ticketName.textContent = guest.nombre;
    if (ticketPasses) ticketPasses.textContent = passBadgeText;

    if (ticketMesaBox && ticketMesaNum && guest.mesa) {
      ticketMesaNum.textContent = guest.mesa;
      ticketMesaBox.style.display = 'block';
    }

    if (ticketStatus) {
      if (guest.estado === 'Confirmado') {
        const confTxt =
          guest.pasesConfirmados === 1 ? '1 persona confirmada' : `${guest.pasesConfirmados} personas confirmadas`;
        ticketStatus.innerHTML = `✅ <strong>¡Asistencia ya confirmada!</strong> (${confTxt}). Puedes actualizar tus datos abajo si lo necesitas.`;
      } else if (guest.estado === 'No asistirá') {
        ticketStatus.innerHTML = `💖 Registraste que no podrás asistir. Si tus planes cambiaron, puedes actualizar tu confirmación abajo.`;
      }
    }
  }

  // 3) Configurar y bloquear límites en el formulario de Confirmación (RSVP)
  const banner = document.getElementById('rsvp-pass-banner');
  const bannerName = document.getElementById('banner-guest-name');
  const bannerMax = document.getElementById('banner-guest-max');
  const inputCode = document.getElementById('guest-code');
  const inputMax = document.getElementById('guest-max-passes');
  const inputName = document.getElementById('guest-name');
  const selectCount = document.getElementById('guest-count');
  const selectStatus = document.getElementById('guest-status');
  const inputCompanions = document.getElementById('guest-companions');
  const inputMsg = document.getElementById('guest-message');

  if (banner && bannerName && bannerMax) {
    bannerName.textContent = guest.nombre;
    bannerMax.textContent = maxPasses;
    banner.style.display = 'block';
  }

  if (inputCode) inputCode.value = guest.codigo || guest.nombre;
  if (inputMax) inputMax.value = String(maxPasses);

  if (inputName) {
    inputName.value = guest.nombre;
    inputName.readOnly = true;
    inputName.style.opacity = '0.92';
  }

  // Llenar el selector solo de 1 hasta maxPasses (para que no puedan ponerse más pases)
  if (selectCount) {
    selectCount.innerHTML = '';
    const defaultSelected =
      guest.estado === 'Confirmado' && guest.pasesConfirmados > 0 ? Number(guest.pasesConfirmados) : maxPasses;

    for (let i = 1; i <= maxPasses; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      const label = i === 1 ? '1 persona' : `${i} personas`;
      opt.textContent = i === maxPasses && maxPasses > 1 ? `${label} (Pase completo)` : label;
      if (i === defaultSelected) opt.selected = true;
      selectCount.appendChild(opt);
    }
  }

  if (selectStatus && guest.estado === 'No asistirá') {
    selectStatus.value = 'no';
    selectStatus.dispatchEvent(new Event('change'));
  }
  if (inputCompanions && guest.nombresAsistentes) {
    inputCompanions.value = guest.nombresAsistentes;
  }
  if (inputMsg && guest.mensaje) {
    inputMsg.value = guest.mensaje;
  }
}

/* ============================================================================
   1. APERTURA DEL SOBRE Y MELODÍA DE VALS ENCANTADO (WEB AUDIO)
   ============================================================================ */
let isMusicPlaying = false;
let audioCtx = null;
let melodyTimer = null;

function initEnvelopeAndMusic() {
  const envelope = document.getElementById('envelope-screen');
  const openBtn = document.getElementById('open-invitation-btn');
  const musicBtn = document.getElementById('music-toggle-btn');

  if (openBtn && envelope) {
    openBtn.addEventListener('click', () => {
      envelope.classList.add('opened');
      if (window.triggerMagicBurst) {
        window.triggerMagicBurst();
      }
      startEnchantedMusic();
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (isMusicPlaying) {
        stopEnchantedMusic();
      } else {
        startEnchantedMusic();
      }
    });
  }
}

function startEnchantedMusic() {
  const musicBtn = document.getElementById('music-toggle-btn');
  if (isMusicPlaying) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isMusicPlaying = true;
    if (musicBtn) musicBtn.classList.add('playing');

    const notes = [
      523.25, 659.25, 783.99,
      987.77, 783.99, 659.25,
      587.33, 698.46, 880.00,
      1046.50, 880.00, 698.46,
      493.88, 587.33, 783.99,
      987.77, 783.99, 587.33,
      523.25, 659.25, 783.99,
      1046.50, 783.99, 659.25
    ];

    let step = 0;
    const playChime = () => {
      if (!isMusicPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
      const freq = notes[step % notes.length];

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.032, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.45);

      step++;
    };

    playChime();
    melodyTimer = setInterval(playChime, 520);
  } catch (e) {
    console.warn('Audio bloqueado hasta interacción:', e);
  }
}

function stopEnchantedMusic() {
  const musicBtn = document.getElementById('music-toggle-btn');
  isMusicPlaying = false;
  if (musicBtn) musicBtn.classList.remove('playing');
  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }
}

/* ============================================================================
   2. CUENTA REGRESIVA AL 20 DE MARZO DE 2027
   ============================================================================ */
function initCountdown() {
  const targetDate = new Date(CONFIG.fechaEventoISO).getTime();
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  function updateClock() {
    const now = new Date().getTime();
    const diff = Math.max(0, targetDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (elDays) elDays.textContent = String(days).padStart(2, '0');
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMins) elMins.textContent = String(mins).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(secs).padStart(2, '0');
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ============================================================================
   3. GOOGLE CALENDAR Y GOOGLE MAPS
   ============================================================================ */
function initCalendarAndMaps() {
  const calBtn = document.getElementById('add-calendar-btn');
  const mapsBtn = document.getElementById('maps-btn');

  if (mapsBtn && CONFIG.googleMapsUrl) {
    mapsBtn.href = CONFIG.googleMapsUrl;
  }

  if (calBtn) {
    const title = encodeURIComponent(`Mis XV Años - ${CONFIG.quinceanera} (Bosque Encantado)`);
    const details = encodeURIComponent(
      `Laura y Jonas te invitan a celebrar los XV años de ${CONFIG.quinceanera} en ${CONFIG.lugarNombre}. ¡Te esperamos!`
    );
    const location = encodeURIComponent(CONFIG.lugarNombre);
    const dates = '20270320T190000/20270321T020000';
    calBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }
}

/* ============================================================================
   4. ANIMACIÓN DE SECCIONES AL HACER SCROLL
   ============================================================================ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08 }
  );

  reveals.forEach((el) => observer.observe(el));
}

/* ============================================================================
   5. CONFIRMACIÓN DE ASISTENCIA AUTOMÁTICA (SE GUARDA EN SERVIDOR Y EXCEL)
   ============================================================================ */
function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  const feedback = document.getElementById('rsvp-feedback');
  const statusSelect = document.getElementById('guest-status');
  const countGroup = document.getElementById('guest-count-group');
  const companionsGroup = document.getElementById('guest-companions-group');
  const submitBtn = document.getElementById('rsvp-submit-btn');

  if (!form) return;

  // Ocultar selector de cantidad si elige que NO podrá asistir
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      const asistira = statusSelect.value === 'si';
      if (countGroup) countGroup.style.display = asistira ? 'block' : 'none';
      if (companionsGroup) companionsGroup.style.display = asistira ? 'block' : 'none';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const codigo = document.getElementById('guest-code')?.value || '';
    const pasesAsignados = Number(document.getElementById('guest-max-passes')?.value) || 5;
    const nombre = document.getElementById('guest-name').value.trim();
    const asistira = document.getElementById('guest-status').value;
    const pasesConfirmados = asistira === 'si' ? Number(document.getElementById('guest-count').value) : 0;
    const nombresAsistentes = document.getElementById('guest-companions')?.value.trim() || '';
    const mensaje = document.getElementById('guest-message').value.trim();

    if (!nombre) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span><span>Guardando tu confirmación...</span>';
    }

    try {
      const response = await fetch('/api/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          nombre,
          asistira,
          pasesConfirmados,
          pasesAsignados,
          nombresAsistentes,
          mensaje
        })
      });

      const result = await response.json();

      if (window.triggerMagicBurst) {
        window.triggerMagicBurst();
      }

      if (result.ok) {
        const personaTxt =
          pasesConfirmados === 1 ? '1 persona confirmada' : `${pasesConfirmados} personas confirmadas`;

        // Actualizar texto del boleto si está visible
        const ticketStatus = document.getElementById('ticket-status-text');
        if (ticketStatus) {
          ticketStatus.innerHTML =
            asistira === 'si'
              ? `✅ <strong>¡Asistencia confirmada!</strong> (${personaTxt})`
              : `💖 Gracias por avisarnos. Te enviamos un gran abrazo.`;
        }

        // Preparar link opcional de WhatsApp por si además desea mandar mensaje
        const waLines = [
          `🦋 *CONFIRMACIÓN MIS XV AÑOS - DAPHNE* 🌸`,
          `👤 *Invitado:* ${nombre}`,
          asistira === 'si'
            ? `✅ *Asistencia:* ¡Sí asistiré! (${personaTxt})`
            : `💖 *Asistencia:* No podré asistir, envío muchas felicitaciones`,
          mensaje ? `💌 *Mensaje:* "${mensaje}"` : ''
        ].filter(Boolean);

        const phone = CONFIG.telefonoWhatsApp.replace(/\D/g, '');
        const waUrl = phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(waLines.join('\n'))}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(waLines.join('\n'))}`;

        if (feedback) {
          feedback.style.display = 'block';
          feedback.innerHTML =
            asistira === 'si'
              ? `
                <div style="font-size:1.8rem; margin-bottom:6px;">🦋✨🌸</div>
                <h4 style="font-family:var(--font-display); color:var(--gold-light); font-size:1.05rem; margin-bottom:6px;">
                  ¡Confirmación Guardada con Éxito!
                </h4>
                <p style="color:var(--text-soft); line-height:1.5; margin-bottom:12px;">
                  Muchas gracias, <strong>${nombre}</strong>. Hemos registrado tus <strong>${personaTxt}</strong> en nuestra lista de invitados para el 20 de Marzo de 2027.
                </p>
                <a href="${waUrl}" target="_blank" rel="noopener" class="btn-outline-pink" style="font-size:0.74rem; padding:10px 16px;">
                  <span>💬</span>
                  <span>Enviar también saludo por WhatsApp (Opcional)</span>
                </a>
              `
              : `
                <div style="font-size:1.6rem; margin-bottom:6px;">💖🌸</div>
                <h4 style="font-family:var(--font-display); color:var(--gold-light); font-size:1rem; margin-bottom:6px;">
                  Respuesta Registrada
                </h4>
                <p style="color:var(--text-soft); line-height:1.5;">
                  Muchas gracias por avisarnos, <strong>${nombre}</strong>. Guardamos tu respuesta y tu mensaje con mucho cariño para Daphne.
                </p>
              `;
        }
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error guardando confirmación:', err);
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = `⚠️ Hubo un detalle de conexión. Por favor intenta de nuevo en unos segundos.`;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✨</span><span>Actualizar mi Confirmación</span>';
      }
    }
  });
}

/* ============================================================================
   6. MODAL DE VISTA EN CELULAR (CÓDIGO QR AUTOMÁTICO)
   ============================================================================ */
async function initQrPreviewModal() {
  const openBtn = document.getElementById('qr-open-btn');
  const closeBtn = document.getElementById('qr-close-btn');
  const modal = document.getElementById('qr-modal');
  const qrImg = document.getElementById('qr-image');
  const urlDisplay = document.getElementById('local-url-display');

  if (!modal) return;

  let baseHostUrl = CONFIG.ipLocalWiFi;
  try {
    const netRes = await fetch('/api/network-info');
    if (netRes.ok) {
      const netData = await netRes.json();
      if (netData.localUrl) baseHostUrl = netData.localUrl;
    }
  } catch (e) {
    // Usar IP configurada por defecto
  }

  const currentHost = window.location.hostname;
  const searchPart = window.location.search || '';
  const targetUrl =
    currentHost === 'localhost' || currentHost === '127.0.0.1'
      ? `${baseHostUrl}/${searchPart}`
      : window.location.href;

  if (urlDisplay) {
    urlDisplay.textContent = targetUrl;
  }
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(
      targetUrl
    )}`;
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ============================================================================
   7. MOTOR DE PARTÍCULAS DEL BOSQUE ENCANTADO:
      - Estrellas doradas titilantes
      - Mariposas doradas en vuelo
      - Pétalos de flores rositas flotando
   ============================================================================ */
function initEnchantedForestCanvas() {
  const canvas = document.getElementById('magic-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;

  function resize() {
    width = Math.min(window.innerWidth, 480);
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 38 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1.2 + Math.random() * 2.6,
    alpha: Math.random(),
    speed: 0.012 + Math.random() * 0.025,
    isFourPoint: Math.random() > 0.45
  }));

  const petals = Array.from({ length: 16 }, () => createPetal(width, height, true));
  const butterflies = Array.from({ length: 6 }, () => createButterfly(width, height, true));

  function createPetal(w, h, randomY = false) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -20,
      size: 4 + Math.random() * 5.5,
      speedY: 0.35 + Math.random() * 0.55,
      speedX: -0.25 + Math.random() * 0.5,
      angle: Math.random() * Math.PI * 2,
      spin: -0.015 + Math.random() * 0.03,
      hue: Math.random() > 0.5 ? '#f7c2d2' : '#ee95b1',
      alpha: 0.55 + Math.random() * 0.35
    };
  }

  function createButterfly(w, h, randomY = false) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 20,
      size: 6 + Math.random() * 5,
      speedY: -(0.35 + Math.random() * 0.55),
      swayAmp: 0.4 + Math.random() * 0.7,
      swayFreq: 0.015 + Math.random() * 0.02,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.14 + Math.random() * 0.08,
      tick: Math.random() * 100
    };
  }

  window.triggerMagicBurst = () => {
    for (let i = 0; i < 10; i++) {
      const b = createButterfly(width, height, false);
      b.x = width * 0.25 + Math.random() * (width * 0.5);
      b.y = height * 0.55 + Math.random() * 80;
      b.speedY = -(1.1 + Math.random() * 1.4);
      butterflies.push(b);
    }
    for (let i = 0; i < 14; i++) {
      const p = createPetal(width, height, false);
      p.y = Math.random() * (height * 0.4);
      p.speedY = 0.8 + Math.random() * 1.1;
      petals.push(p);
    }
  };

  function drawFourPointStar(x, y, radius, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = `rgba(255, 243, 196, ${alpha})`;
    ctx.shadowColor = 'rgba(245, 223, 152, 0.85)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(Math.cos((i * Math.PI) / 2) * radius * 2.1, Math.sin((i * Math.PI) / 2) * radius * 2.1);
      ctx.lineTo(
        Math.cos(((i + 0.5) * Math.PI) / 2) * (radius * 0.5),
        Math.sin(((i + 0.5) * Math.PI) / 2) * (radius * 0.5)
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.hue;
    ctx.shadowColor = 'rgba(247, 194, 210, 0.4)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size, -p.size * 0.5, p.size, p.size * 0.8, 0, p.size);
    ctx.bezierCurveTo(-p.size, p.size * 0.8, -p.size, -p.size * 0.5, 0, -p.size);
    ctx.fill();
    ctx.restore();
  }

  function drawButterfly(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    const wingSpread = Math.abs(Math.cos(b.wingPhase));
    ctx.fillStyle = 'rgba(245, 223, 152, 0.88)';
    ctx.shadowColor = 'rgba(216, 175, 73, 0.9)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.ellipse(-b.size * 0.65 * wingSpread, -1, b.size * wingSpread, b.size * 0.65, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(b.size * 0.65 * wingSpread, -1, b.size * wingSpread, b.size * 0.65, 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.2, b.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (const s of stars) {
      s.alpha += s.speed;
      if (s.alpha >= 1 || s.alpha <= 0.15) {
        s.speed = -s.speed;
      }
      const clampedAlpha = Math.max(0.15, Math.min(1, s.alpha));
      if (s.isFourPoint) {
        drawFourPointStar(s.x, s.y, s.size, clampedAlpha);
      } else {
        ctx.fillStyle = `rgba(255, 239, 178, ${clampedAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.02) * 0.25;
      p.angle += p.spin;
      drawPetal(p);

      if (p.y > height + 25) {
        if (petals.length > 16) {
          petals.splice(i, 1);
        } else {
          Object.assign(p, createPetal(width, height, false));
        }
      }
    }

    for (let i = butterflies.length - 1; i >= 0; i--) {
      const b = butterflies[i];
      b.tick += 1;
      b.wingPhase += b.wingSpeed;
      b.y += b.speedY;
      b.x += Math.sin(b.tick * b.swayFreq) * b.swayAmp;
      drawButterfly(b);

      if (b.y < -30) {
        if (butterflies.length > 6) {
          butterflies.splice(i, 1);
        } else {
          Object.assign(b, createButterfly(width, height, false));
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}
