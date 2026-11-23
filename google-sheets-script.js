/**
 * ============================================================================
 * SCRIPT OPCIONAL PARA COPIA EN TIEMPO REAL EN GOOGLE SHEETS
 * ============================================================================
 * Si además de descargar el Excel (.xlsx) desde tu servidor quieres que una
 * hoja de Google Sheets en tu Google Drive se llene sola en vivo:
 *
 * 1. Abre una hoja nueva en Google Sheets (https://sheets.new).
 * 2. En el menú superior ve a: Extensiones > Apps Script.
 * 3. Borra lo que aparezca y pega todo este código.
 * 4. Haz clic en el botón azul "Implementar" > "Nueva implementación".
 * 5. En "Selecciona el tipo" elige "Aplicación web".
 * 6. En "Quién tiene acceso" selecciona "Cualquier persona" (Anyone).
 * 7. Haz clic en "Implementar", copia la URL que te da y pégala en tu
 *    panel http://localhost:8080/admin.html en la casilla de Google Sheets.
 * ============================================================================
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Si la hoja está vacía, creamos los encabezados en la primera fila
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Código',
      'Invitado / Familia',
      'Pases Asignados',
      'Estado',
      'Personas Confirmadas',
      'Mesa',
      'Nombres de Asistentes',
      'Mensaje para Daphne',
      'Fecha de Confirmación'
    ]);
  }

  var data = JSON.parse(e.postData.contents);
  var codigo = data.codigo || '';
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === String(codigo).toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  var rowValues = [
    data.codigo || '',
    data.nombre || '',
    data.pasesAsignados || 0,
    data.estado || '',
    data.pasesConfirmados || 0,
    data.mesa || '',
    data.nombresAsistentes || '',
    data.mensaje || '',
    data.fechaConfirmacion || new Date().toLocaleString()
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
