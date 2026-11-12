/**
 * ============================================================================
 * MIS XV AÑOS - DAPHNE | BOSQUE ENCANTADO
 * Configuración general, animación de Estrellas, Mariposas Doradas y Flores Rositas
 * ============================================================================
 */

const CONFIG = {
  quinceanera: 'Daphne',
  padres: 'Laura y Jonas',
  // Fecha del evento: 20 de Marzo de 2027 a las 19:00 hrs
  fechaEventoISO: '2027-03-20T19:00:00',
  lugarNombre: 'Salón Toscana Jardín de Eventos',
  // Link de Google Maps (puedes pegar aquí el link exacto de Google Maps de tu salón)
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Salon+Toscana+Jardin+de+Eventos',
  // Número de WhatsApp para recibir confirmaciones (con código de país, ej. 5215512345678 para México).
  // Si se deja vacío (''), abrirá WhatsApp permitiendo elegir el contacto o mostrará confirmación en pantalla.
  telefonoWhatsApp: '',
  // IP local detectada en tu red Wi-Fi para previsualizar en el celular
  ipLocalWiFi: 'http://192.168.1.71:8080'
};

document.addEventListener('DOMContentLoaded', () => {
  initEnvelopeAndMusic();
  initCountdown();
  initCalendarAndMaps();
  initScrollReveal();
  initRsvpForm();
  initQrPreviewModal();
  initEnchantedForestCanvas();
});

/* ============================================================================
   1. APERTURA DEL SOBRE Y MELODÍA DE VALS ENCANTADO (WEB AUDIO / MP3)
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
      // Disparamos una lluvia mágica de mariposas doradas y pétalos rositas al abrir
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

    // Notas de una cajita musical / arpa de vals de hadas (compás 3/4 suave)
    const notes = [
      523.25, 659.25, 783.99, // Do5, Mi5, Sol5
      987.77, 783.99, 659.25, // Si5, Sol5, Mi5
      587.33, 698.46, 880.00, // Re5, Fa5, La5
      1046.50, 880.00, 698.46,// Do6, La5, Fa5
      493.88, 587.33, 783.99, // Si4, Re5, Sol5
      987.77, 783.99, 587.33, // Si5, Sol5, Re5
      523.25, 659.25, 783.99, // Do5, Mi5, Sol5
      1046.50, 783.99, 659.25 // Do6, Sol5, Mi5
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

      // Envolvente suave tipo cajita de música / celesta
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
    console.warn('Audio bloqueado por el navegador hasta interacción:', e);
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
    // 20 de Marzo de 2027 de 19:00 a 23:59
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
    { threshold: 0.14 }
  );

  reveals.forEach((el) => observer.observe(el));
}

/* ============================================================================
   5. CONFIRMACIÓN DE ASISTENCIA (WHATSAPP)
   ============================================================================ */
function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  const feedback = document.getElementById('rsvp-feedback');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('guest-name').value.trim();
    const count = document.getElementById('guest-count').value;
    const status = document.getElementById('guest-status').value;
    const msg = document.getElementById('guest-message').value.trim();

    if (!name) return;

    const textLines = [
      `🦋 *CONFIRMACIÓN MIS XV AÑOS - DAPHNE* 🌸`,
      `----------------------------------`,
      `👤 *Invitado/Familia:* ${name}`,
      `🎟️ *Pases confirmados:* ${count}`,
      `✨ *Respuesta:* ${status}`,
      `📅 *Fecha:* 20 de Marzo de 2027`,
      `📍 *Lugar:* ${CONFIG.lugarNombre}`
    ];

    if (msg) {
      textLines.push(`💌 *Mensaje para Daphne:* "${msg}"`);
    }

    const encodedMsg = encodeURIComponent(textLines.join('\n'));
    const phone = CONFIG.telefonoWhatsApp.replace(/\D/g, '');
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    if (feedback) {
      feedback.style.display = 'block';
      feedback.innerHTML = `✨ <strong>¡Gracias, ${name}!</strong> Abriendo WhatsApp con tu confirmación lista para enviar a Laura y Jonas...`;
    }

    if (window.triggerMagicBurst) {
      window.triggerMagicBurst();
    }

    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener');
    }, 450);
  });
}

/* ============================================================================
   6. MODAL DE VISTA EN CELULAR (CÓDIGO QR AUTOMÁTICO)
   ============================================================================ */
function initQrPreviewModal() {
  const openBtn = document.getElementById('qr-open-btn');
  const closeBtn = document.getElementById('qr-close-btn');
  const modal = document.getElementById('qr-modal');
  const qrImg = document.getElementById('qr-image');
  const urlDisplay = document.getElementById('local-url-display');

  if (!modal) return;

  // Si estamos en localhost, mostramos la IP Wi-Fi local para que el celular pueda entrar
  const currentHost = window.location.hostname;
  const targetUrl =
    currentHost === 'localhost' || currentHost === '127.0.0.1'
      ? CONFIG.ipLocalWiFi
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

  // 1) Estrellas doradas en el bosque
  const stars = Array.from({ length: 38 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1.2 + Math.random() * 2.6,
    alpha: Math.random(),
    speed: 0.012 + Math.random() * 0.025,
    isFourPoint: Math.random() > 0.45
  }));

  // 2) Pétalos de flores rositas cayendo suavemente
  const petals = Array.from({ length: 16 }, () => createPetal(width, height, true));

  // 3) Mariposas doradas mágicas volando
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

  // Función pública para disparar una ráfaga de magia al abrir el sobre o confirmar
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

    // Ala izquierda
    ctx.beginPath();
    ctx.ellipse(-b.size * 0.65 * wingSpread, -1, b.size * wingSpread, b.size * 0.65, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Ala derecha
    ctx.beginPath();
    ctx.ellipse(b.size * 0.65 * wingSpread, -1, b.size * wingSpread, b.size * 0.65, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo dorado brillante
    ctx.fillStyle = '#fff8dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.2, b.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // 1. Dibujar estrellas titilantes
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

    // 2. Actualizar y dibujar pétalos rositas
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

    // 3. Actualizar y dibujar mariposas doradas
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
