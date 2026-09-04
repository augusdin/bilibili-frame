const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../subtitles.js');
test('long subtitle lines wrap to the output width', () => {
  const context = { measureText: text => ({ width: [...text].length * 10 }) };
  assert.deepEqual(FrameSubtitles.wrap(context, 'abcdef', 30), ['abc', 'def']);
  assert.deepEqual(FrameSubtitles.wrap(context, '', 30), []);
});
test('only showing native text tracks contribute active cues', () => {
  const video = {
    closest: () => ({ querySelectorAll: () => [] }),
    textTracks: [
      { mode: 'hidden', activeCues: [{ text: 'hidden' }] },
      { mode: 'showing', activeCues: [{ text: 'first\nsecond' }] },
      { mode: 'disabled', activeCues: [{ text: 'disabled' }] }
    ]
  };
  assert.deepEqual(FrameSubtitles.collect(video), ['first', 'second']);
});
