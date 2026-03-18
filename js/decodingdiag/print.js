(function initDecodingDiagPrint(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CSDecodingDiagPrint = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function factory() {
  'use strict';

  function openPrintView(opts) {
    var o = opts || {};
    var title = String(o.title || 'Decoding Diagnostic');
    var formId = String(o.formId || '--');
    var target = String(o.targetLabel || o.targetId || '--');
    var mode = String(o.mode || 'timed');
    var items = Array.isArray(o.items) ? o.items.slice(0, 15) : [];
    var dateText = new Date().toISOString().slice(0, 10);
    var listHtml = items.map(function (item, idx) {
      return '<div class="word"><span class="n">' + (idx + 1) + '.</span> ' + String(item && item.text || '') + '</div>';
    }).join('');

    var scriptTimed = "Say: 'We are going to read some words. Start here. Read the best you can. If you get stuck, I will tell you the word. Keep going until I say stop.' Start timer on the first word. Stop at 60 seconds.";
    var scriptUntimed = "Say: 'Read each word. Take your time and sound it out. If you do not know a word, I will tell it to you and we will move on.'";

    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<style>body{font-family:ui-sans-serif,system-ui;padding:18px;color:#111}h1{margin:0 0 6px}'+
      '.meta{margin:0 0 10px;font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 12px}'+
      '.word{padding:4px 0;border-bottom:1px dotted #bbb}.n{display:inline-block;width:20px}'+
      '.mark{margin-top:14px;border-collapse:collapse;width:100%}.mark td,.mark th{border:1px solid #999;padding:6px;font-size:12px}'+
      '.small{font-size:12px}.box{margin-top:10px;border:1px solid #999;padding:8px}@media print{button{display:none}}</style></head><body>' +
      '<h1>' + title + '</h1><p class="meta">Date: ' + dateText + ' | Target: ' + target + ' | Form: ' + formId + ' | Mode: ' + mode + '</p>' +
      '<div class="box small"><strong>Teacher Script:</strong> ' + (mode === 'timed' ? scriptTimed : scriptUntimed) + '</div>' +
      '<div class="grid">' + listHtml + '</div>' +
      '<table class="mark"><thead><tr><th>#</th><th>Correct</th><th>Incorrect</th><th>SC</th><th>Told</th></tr></thead><tbody>' +
      Array.from({ length: 15 }).map(function (_, i) { return '<tr><td>' + (i + 1) + '</td><td></td><td></td><td></td><td></td></tr>'; }).join('') +
      '</tbody></table>' +
      '<div class="box small"><strong>Summary:</strong> Attempted ___ | Correct ___ | SC ___ | Time ___ | Notes ______________________</div>' +
      '<button onclick="window.print()">Print</button></body></html>';

    var win = window.open('', '_blank', 'noopener,noreferrer,width=980,height=760');
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    return true;
  }

  return {
    openPrintView: openPrintView
  };
}));
