const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../core.js');
require('../danmaku.js');
test('danmaku defaults on independently of subtitles, with persisted opt-out', () => {
  assert.equal(FrameCore.settings({ includeSubtitles: false }).includeDanmaku, true);
  assert.equal(FrameCore.settings({ includeDanmaku: false }).includeSubtitles, true);
  assert.equal(FrameCore.settings({ includeDanmaku: false }).includeDanmaku, false);
});
test('letterboxing maps overlay coordinates to the actual video pixels', () => {
  assert.deepEqual(FrameDanmaku.contentRect({ left: 10, top: 20, width: 800, height: 600 }, 1920, 1080), { x: 10, y: 95, width: 800, height: 450 });
});
test('offscreen comments are excluded, partially visible comments retained', () => {
  const rect = { x: 0, y: 0, width: 640, height: 360 };
  assert.equal(FrameDanmaku.intersects({ left: -50, right: 20, top: 0, bottom: 20 }, rect), true);
  assert.equal(FrameDanmaku.intersects({ left: -50, right: -1, top: 0, bottom: 20 }, rect), false);
});
