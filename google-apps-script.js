/**
 * Acuity Waitlist — Google Apps Script
 *
 * 1. Create a new Google Sheet at sheets.google.com
 * 2. Add a header row in row 1:  Email  |  Date
 * 3. Go to Extensions → Apps Script
 * 4. Replace the default code with this, then Save (Ctrl+S)
 * 5. Click Deploy → New deployment
 * 6. Select type: Web app
 * 7. Description: "Acuity Waitlist" (or any)
 * 8. Execute as: Me
 * 9. Who has access: Anyone
 * 10. Click Deploy, then copy the Web app URL (ends with /exec)
 * 11. Paste that URL into index.html, replacing YOUR_GOOGLE_SCRIPT_URL_HERE
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = e.parameter.email;

  if (email) {
    sheet.appendRow([email, new Date()]);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
