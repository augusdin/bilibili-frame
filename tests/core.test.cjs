const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../core.js');
const core = globalThis.FrameCore;
test('timestamps include hours and milliseconds', () => {
  assert.equal(core.timestamp(3661.234), '01-01-01.234');
  assert.equal(core.timestamp(59.9999), '00-01-00.000');
  assert.equal(core.timestamp(NaN), '00-00-00.000');
});
test('filenames cannot introduce path components', () => {
  assert.equal(core.filename('../a/b:*?', 'BV123', 1, 'jpeg'), 'Bilibili Frames/_a_b____BV123_00-00-01.000.jpg');
  assert.equal(core.filename('...', '', 0, 'png'), 'Bilibili Frames/bilibili_video_00-00-00.000.png');
});
test('invalid preferences are normalized', () => {
  assert.deepEqual(core.settings({ format: 'toString', quality: Infinity, saveAs: 'yes' }), core.defaults);
  assert.equal(core.settings({ quality: 3 }).quality, 1);
  assert.equal(core.settings({ quality: -3 }).quality, 0.5);
});
test('quality is per-format and PNG has no lossy quality parameter', () => {
  assert.equal(core.encodingQuality(core.defaults), undefined);
  assert.equal(core.encodingQuality(core.settings({ format: 'jpeg' })), 0.85);
  assert.equal(core.encodingQuality(core.settings({ format: 'webp' })), 0.85);
  const value = core.settings({ format: 'webp', jpegQuality: 0.5, webpQuality: 0.92 });
  assert.equal(core.encodingQuality(value), 0.92);
  assert.equal(core.settings({ jpegQuality: 4 }).jpegQuality, 1);
  assert.equal(core.settings({ webpQuality: NaN }).webpQuality, 0.85);
});
test('subtitles are on by default and the opt-out persists', () => {
  assert.equal(core.settings().includeSubtitles, true);
  assert.equal(core.settings({ includeSubtitles: false }).includeSubtitles, false);
});
