#!/usr/bin/env node
// SSML helper for Ava TTS generation
function escape(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSsml(text, voiceName, options = {}) {
  const voice = voiceName || 'en-US-AvaMultilingualNeural';
  const rate = options.rate || '0%';
  const pitch = options.pitch || '0%';
  const style = options.style || '';
  const body = escape(text);
  const styleOpen = style ? `<mstts:express-as style="${style}">` : '';
  const styleClose = style ? '</mstts:express-as>' : '';
  return [
    '<speak version="1.0" xml:lang="en-US" xmlns:mstts="http://www.w3.org/2001/mstts">',
    `<voice name="${voice}">`,
    styleOpen,
    `<prosody rate="${rate}" pitch="${pitch}">${body}</prosody>`,
    styleClose,
    '</voice>',
    '</speak>'
  ].join('');
}

module.exports = {
  buildSsml,
  escape
};
