const listeners = [];
const preferences = { format: 'png', quality: 0.95, saveAs: false, showButton: true };
globalThis.chrome = {
  storage: { local: { get: async () => preferences }, onChanged: { addListener() {} } },
  runtime: {
    onMessage: { addListener(listener) { listeners.push(listener); } },
    sendMessage: async message => { globalThis.lastDownload = message; return { ok: true, downloadId: 1 }; }
  }
};
const source = document.createElement('canvas');
source.width = 1280;
source.height = 720;
const paint = source.getContext('2d');
function draw() {
  paint.fillStyle = '#cf4067'; paint.fillRect(0, 0, 640, 720);
  paint.fillStyle = '#208d75'; paint.fillRect(640, 0, 640, 720);
  paint.fillStyle = '#ffffff'; paint.font = '48px system-ui';
  paint.fillText('Bilibili Frame / pixel fixture', 60, 360);
}
draw();
const video = document.querySelector('video');
video.srcObject = source.captureStream(10);
setInterval(draw, 100);
globalThis.requestCapture = () => new Promise(resolve => listeners[0]({ type: 'CAPTURE_FRAME' }, {}, resolve));
globalThis.runChecks = async () => {
  const results = [];
  const assert = (condition, name) => { if (!condition) throw new Error(name); results.push(name); };
  await video.play();
  for (const format of ['png', 'jpeg', 'webp']) {
    preferences.format = format;
    const result = await requestCapture();
    assert(result.ok, `${format}: capture succeeded`);
    assert(result.frame.width === 1280 && result.frame.height === 720, `${format}: original resolution`);
    assert(result.frame.dataUrl.startsWith(`data:image/${format};`), `${format}: correct MIME`);
    const image = new Image(); image.src = result.frame.dataUrl; await image.decode();
    const check = document.createElement('canvas'); check.width = 1280; check.height = 720;
    const ctx = check.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixel = ctx.getImageData(20, 20, 1, 1).data;
    assert(Math.abs(pixel[0] - 207) < 8 && Math.abs(pixel[1] - 64) < 8, `${format}: pixels match video`);
  }
  const paused = video.paused;
  await requestCapture();
  assert(video.paused === paused, 'capture preserves playback state');
  video.style.display = 'none';
  assert(!(await requestCapture()).ok, 'hidden video rejected');
  video.style.display = '';
  Object.defineProperty(video, 'seeking', { configurable: true, value: true });
  assert(!(await requestCapture()).ok, 'seeking video rejected');
  delete video.seeking;
  Object.defineProperty(video, 'mediaKeys', { configurable: true, value: {} });
  assert(!(await requestCapture()).ok, 'protected video rejected');
  delete video.mediaKeys;
  const original = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = () => { throw new DOMException('tainted', 'SecurityError'); };
  assert((await requestCapture()).error.includes('跨域'), 'cross-origin error explained');
  HTMLCanvasElement.prototype.toDataURL = original;
  document.querySelector('#results').textContent = results.join('\n');
  return results;
};
