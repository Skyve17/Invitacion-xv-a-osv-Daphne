/**
 * ============================================================================
 * SERVIDOR NODE.JS / EXPRESS - MIS XV AÑOS DAPHNE (BOSQUE ENCANTADO)
 * - Pases personalizados por invitado (ej. ?i=lizbeth -> Pase para 4 personas)
 * - Confirmación automática guardada en el servidor
 * - Exportación directa a Excel (.xlsx) con formato y totales
 * - Sincronización opcional en tiempo real con Google Sheets
 * ============================================================================
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'invitados.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Asegurar que exista el archivo de base de datos JSON
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      config: {
        googleSheetsWebhookUrl: '',
        adminPin: ''
      },
      invitados: [
        {
          codigo: 'lizbeth',
          nombre: 'Lizbeth',
          pasesAsignados: 4,
          mesa: 'Mesa 1',
          telefono: '',
          estado: 'Pendiente',
          pasesConfirmados: 0,
          nombresAsistentes: '',
          mensaje: '',
          fechaConfirmacion: ''
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo invitados.json:', err);
    return { config: { googleSheetsWebhookUrl: '' }, invitados: [] };
  }
}

function writeDb(data) {
  ensureDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getLocalWiFiIp() {
  const interfaces = os.networkInterfaces();
  let fallbackIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (/wi-?fi|wlan|wireless/i.test(name)) {
          return iface.address;
        }
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          fallbackIp = iface.address;
        }
      }
    }
  }
  return fallbackIp;
}

function formatFechaHora() {
  const now = new Date();
  return now.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Enviar copia automática a Google Sheets si hay Webhook configurado
async function syncWithGoogleSheets(guestData, webhookUrl) {
  if (!webhookUrl || !webhookUrl.startsWith('https://')) return false;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'XV Años Daphne',
        ...guestData
      })
    });
    return true;
  } catch (err) {
    console.warn('No se pudo sincronizar con Google Sheets:', err.message);
    return false;
  }
}

/* ============================================================================
   RUTAS PÚBLICAS PARA LA INVITACIÓN
   ============================================================================ */

// 1. Información de red local para el Código QR del celular
app.get('/api/network-info', (req, res) => {
  const ip = getLocalWiFiIp();
  res.json({
    ip,
    port: PORT,
    localUrl: `http://${ip}:${PORT}`
  });
});

// 2. Obtener los datos personalizados de un invitado por código (?i=lizbeth)
app.get('/api/invitado/:codigo', (req, res) => {
  const codigo = slugify(req.params.codigo);
  const db = readDb();
  const invitado = db.invitados.find((inv) => slugify(inv.codigo) === codigo);

  if (!invitado) {
    return res.status(404).json({
      found: false,
      message: 'Invitado no encontrado en la lista.'
    });
  }

  res.json({
    found: true,
    invitado
  });
});

// 3. Guardar confirmación de asistencia automáticamente desde la invitación
app.post('/api/confirmar', async (req, res) => {
  const {
    codigo,
    nombre,
    asistira,
    pasesConfirmados,
    pasesAsignados,
    nombresAsistentes,
    telefono,
    mensaje
  } = req.body;

  if (!nombre || ! String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'Por favor ingresa tu nombre.' });
  }

  const db = readDb();
  const cleanCodigo = slugify(codigo || nombre);
  let invitado = db.invitados.find((inv) => slugify(inv.codigo) === cleanCodigo);

  const vaAsistir = asistira === 'si' || asistira === true || String(asistira).toLowerCase().includes('sí');
  const maxPases = invitado ? Number(invitado.pasesAsignados) || 1 : Number(pasesAsignados) || 5;
  const confirmadosNum = vaAsistir
    ? Math.max(1, Math.min(maxPases, Number(pasesConfirmados) || 1))
    : 0;

  const fechaConfirmacion = formatFechaHora();

  if (invitado) {
    // Actualizar invitado existente
    invitado.nombre = String(nombre).trim();
    invitado.estado = vaAsistir ? 'Confirmado' : 'No asistirá';
    invitado.pasesConfirmados = confirmadosNum;
    invitado.nombresAsistentes = String(nombresAsistentes || '').trim();
    invitado.telefono = String(telefono || invitado.telefono || '').trim();
    invitado.mensaje = String(mensaje || '').trim();
    invitado.fechaConfirmacion = fechaConfirmacion;
  } else {
    // Si confirmó desde un link general o token rápido, lo agregamos también al Excel
    invitado = {
      codigo: cleanCodigo,
      nombre: String(nombre).trim(),
      pasesAsignados: Number(pasesAsignados) || confirmadosNum || 1,
      mesa: 'Por asignar',
      telefono: String(telefono || '').trim(),
      estado: vaAsistir ? 'Confirmado' : 'No asistirá',
      pasesConfirmados: confirmadosNum,
      nombresAsistentes: String(nombresAsistentes || '').trim(),
      mensaje: String(mensaje || '').trim(),
      fechaConfirmacion
    };
    db.invitados.push(invitado);
  }

  writeDb(db);

  // Enviar copia a Google Sheets en segundo plano si está configurado
  const webhookUrl = db.config?.googleSheetsWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const syncedSheets = await syncWithGoogleSheets(invitado, webhookUrl);

  res.json({
    ok: true,
    invitado,
    syncedSheets
  });
});

/* ============================================================================
   RUTAS DE ADMINISTRACIÓN Y GENERADOR DE INVITACIONES (admin.html)
   ============================================================================ */

// Obtener todos los invitados y resumen estadístico
app.get('/api/admin/invitados', (req, res) => {
  const db = readDb();
  const lista = db.invitados || [];

  const resumen = {
    totalInvitaciones: lista.length,
    totalPasesAsignados: lista.reduce((acc, i) => acc + (Number(i.pasesAsignados) || 0), 0),
    totalPersonasConfirmadas: lista
      .filter((i) => i.estado === 'Confirmado')
      .reduce((acc, i) => acc + (Number(i.pasesConfirmados) || 0), 0),
    invitacionesConfirmadas: lista.filter((i) => i.estado === 'Confirmado').length,
    invitacionesPendientes: lista.filter((i) => !i.estado || i.estado === 'Pendiente').length,
    invitacionesCanceladas: lista.filter((i) => i.estado === 'No asistirá').length
  };

  res.json({
    ok: true,
    invitados: lista,
    resumen,
    config: db.config || {},
    localUrl: `http://${getLocalWiFiIp()}:${PORT}`
  });
});

// Agregar o editar un invitado
app.post('/api/admin/invitados', (req, res) => {
  const { codigoOriginal, codigo, nombre, pasesAsignados, mesa, telefono, estado, pasesConfirmados } = req.body;

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ ok: false, error: 'El nombre del invitado es obligatorio.' });
  }

  const db = readDb();
  const cleanCode = slugify(codigo || nombre);
  const searchCode = codigoOriginal ? slugify(codigoOriginal) : cleanCode;

  let existingIndex = db.invitados.findIndex((i) => slugify(i.codigo) === searchCode);
  const pasesNum = Math.max(1, Number(pasesAsignados) || 1);

  if (existingIndex >= 0) {
    const current = db.invitados[existingIndex];
    db.invitados[existingIndex] = {
      ...current,
      codigo: cleanCode,
      nombre: String(nombre).trim(),
      pasesAsignados: pasesNum,
      mesa: String(mesa ?? current.mesa ?? '').trim(),
      telefono: String(telefono ?? current.telefono ?? '').trim(),
      estado: estado || current.estado || 'Pendiente',
      pasesConfirmados:
        pasesConfirmados !== undefined ? Number(pasesConfirmados) : Number(current.pasesConfirmados) || 0
    };
  } else {
    db.invitados.push({
      codigo: cleanCode,
      nombre: String(nombre).trim(),
      pasesAsignados: pasesNum,
      mesa: String(mesa || '').trim(),
      telefono: String(telefono || '').trim(),
      estado: estado || 'Pendiente',
      pasesConfirmados: Number(pasesConfirmados) || 0,
      nombresAsistentes: '',
      mensaje: '',
      fechaConfirmacion: ''
    });
  }

  writeDb(db);
  res.json({ ok: true, codigo: cleanCode });
});

// Importar varios invitados en lote (pegando desde Excel o lista)
app.post('/api/admin/invitados/lote', (req, res) => {
  const { lineas } = req.body;
  if (!Array.isArray(lineas)) {
    return res.status(400).json({ ok: false, error: 'Formato inválido.' });
  }

  const db = readDb();
  let agregados = 0;

  for (const item of lineas) {
    const nombre = String(item.nombre || '').trim();
    if (!nombre) continue;
    const codigo = slugify(item.codigo || nombre);
    const pasesAsignados = Math.max(1, Number(item.pasesAsignados) || 2);
    const mesa = String(item.mesa || '').trim();
    const telefono = String(item.telefono || '').trim();

    const idx = db.invitados.findIndex((i) => slugify(i.codigo) === codigo);
    if (idx >= 0) {
      db.invitados[idx].nombre = nombre;
      db.invitados[idx].pasesAsignados = pasesAsignados;
      if (mesa) db.invitados[idx].mesa = mesa;
      if (telefono) db.invitados[idx].telefono = telefono;
    } else {
      db.invitados.push({
        codigo,
        nombre,
        pasesAsignados,
        mesa,
        telefono,
        estado: 'Pendiente',
        pasesConfirmados: 0,
        nombresAsistentes: '',
        mensaje: '',
        fechaConfirmacion: ''
      });
    }
    agregados++;
  }

  writeDb(db);
  res.json({ ok: true, agregados });
});

// Eliminar un invitado
app.delete('/api/admin/invitados/:codigo', (req, res) => {
  const codigo = slugify(req.params.codigo);
  const db = readDb();
  db.invitados = db.invitados.filter((i) => slugify(i.codigo) !== codigo);
  writeDb(db);
  res.json({ ok: true });
});

// Guardar configuración (como URL de Google Sheets)
app.post('/api/admin/config', (req, res) => {
  const { googleSheetsWebhookUrl } = req.body;
  const db = readDb();
  db.config = db.config || {};
  db.config.googleSheetsWebhookUrl = String(googleSheetsWebhookUrl || '').trim();
  writeDb(db);
  res.json({ ok: true, config: db.config });
});

/* ============================================================================
   EXPORTACIÓN DIRECTA A ARCHIVO EXCEL (.XLSX) CON FORMATO
   ============================================================================ */
app.get('/api/admin/exportar-excel', async (req, res) => {
  try {
    const db = readDb();
    const lista = db.invitados || [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mis XV Años Daphne - Bosque Encantado';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Confirmaciones XV Daphne', {
      views: [{ state: 'frozen', ySplit: 3 }]
    });

    // Título principal en Excel
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = '✨ MIS XV AÑOS DAPHNE • LISTA DE INVITADOS Y CONFIRMACIONES (20 DE MARZO 2027) ✨';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFF3C4' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B261A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Subtítulo con fecha de corte
    sheet.mergeCells('A2:K2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Salón Toscana Jardín de Eventos | Padres: Laura y Jonas | Reporte generado: ${formatFechaHora()}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFF7C2D2' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF143D2A' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Encabezados de tabla (Fila 3)
    const headers = [
      'Código',
      'Nombre del Invitado / Familia',
      'Pases Asignados',
      'Estado de Confirmación',
      'Personas que Asisten',
      'Mesa / Grupo',
      'Nombres de Asistentes',
      'Teléfono',
      'Mensaje para Daphne',
      'Fecha de Confirmación',
      'Link Personalizado de Invitación'
    ];

    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF061810' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8AF49' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF9E7519' } },
        bottom: { style: 'medium', color: { argb: 'FF9E7519' } },
        left: { style: 'thin', color: { argb: 'FF9E7519' } },
        right: { style: 'thin', color: { argb: 'FF9E7519' } }
      };
    });

    // Anchos de columna
    const widths = [16, 30, 16, 22, 20, 16, 28, 16, 38, 22, 42];
    widths.forEach((w, idx) => {
      sheet.getColumn(idx + 1).width = w;
    });

    // Filas de invitados
    let totalAsignados = 0;
    let totalConfirmados = 0;

    lista.forEach((inv) => {
      const pasesAsig = Number(inv.pasesAsignados) || 0;
      const pasesConf = inv.estado === 'Confirmado' ? Number(inv.pasesConfirmados) || 0 : 0;
      totalAsignados += pasesAsig;
      totalConfirmados += pasesConf;

      const link = `${baseUrl}/?i=${encodeURIComponent(inv.codigo)}`;

      const row = sheet.addRow([
        inv.codigo,
        inv.nombre,
        pasesAsig,
        inv.estado || 'Pendiente',
        pasesConf,
        inv.mesa || '',
        inv.nombresAsistentes || '',
        inv.telefono || '',
        inv.mensaje || '',
        inv.fechaConfirmacion || '-',
        link
      ]);

      row.height = 21;

      // Color según estado
      let bgArgb = 'FFFFFFFF';
      if (inv.estado === 'Confirmado') bgArgb = 'FFE6F4EA'; // Verde claro
      if (inv.estado === 'No asistirá') bgArgb = 'FFFCE8E6'; // Rosa/Rojo suave
      if (!inv.estado || inv.estado === 'Pendiente') bgArgb = 'FFFFFBEB'; // Crema suave

      row.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDADCE0' } },
          bottom: { style: 'thin', color: { argb: 'FFDADCE0' } },
          left: { style: 'thin', color: { argb: 'FFDADCE0' } },
          right: { style: 'thin', color: { argb: 'FFDADCE0' } }
        };
        if ([1, 3, 4, 5, 6, 10].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // Fila de Totales al final
    const totalRow = sheet.addRow([
      '',
      'TOTAL GENERAL',
      totalAsignados,
      `${lista.filter((i) => i.estado === 'Confirmado').length} confirmados`,
      totalConfirmados,
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
    totalRow.height = 25;
    totalRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFF3C4' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B261A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Confirmaciones_XV_Daphne.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generando Excel:', err);
    res.status(500).json({ ok: false, error: 'No se pudo generar el archivo Excel.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalWiFiIp();
  console.log('====================================================================');
  console.log(' ✨ SERVIDOR MIS XV AÑOS DAPHNE (BOSQUE ENCANTADO) ACTIVO ✨');
  console.log(` 📍 Invitación en PC:        http://localhost:${PORT}`);
  console.log(` 📱 Invitación en Celular:   http://${ip}:${PORT}`);
  console.log(` 🎟️ Ejemplo Pase Lizbeth:    http://${ip}:${PORT}/?i=lizbeth`);
  console.log(` 📋 Panel Administracion:    http://localhost:${PORT}/admin.html`);
  console.log(` 📥 Descargar Excel directo: http://localhost:${PORT}/api/admin/exportar-excel`);
  console.log('====================================================================');
});
