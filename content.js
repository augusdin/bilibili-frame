(() => {
  if (globalThis.__bilibiliFrameLoaded) return;
  globalThis.__bilibiliFrameLoaded = true;
  let options = FrameCore.defaults;
  let busy = false;
  let toastTimer;
  const host = document.createElement('bilibili-frame-tools');
  const shadow = host.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `<style>
    :host { all:initial; position:relative; display:inline-flex; flex:0 0 36px; width:36px; height:var(--frame-control-height,22px); align-self:auto; font:13px/1.5 system-ui,sans-serif; letter-spacing:0; }
    :host([data-overlay]) { position:fixed; z-index:100; height:36px; }
    :host(:not([data-overlay])) { margin-right:8px; }
    button { box-sizing:border-box; display:grid; place-items:center; width:36px; height:100%; padding:0; border:0; border-radius:4px; color:#fff; background:transparent; cursor:pointer; }
    :host([data-overlay]) button { background:#25272acc; height:36px; padding:7px; }
    button svg { width:var(--frame-icon-size,22px); height:var(--frame-icon-size,22px); display:block; }
    button:hover { background:#ffffff25; } button:focus-visible { outline:2px solid #fff; outline-offset:2px; }
    button:disabled { opacity:.6; cursor:wait; } [hidden] { display:none!important; }
    p { position:fixed; right:20px; top:20px; z-index:2147483646; box-sizing:border-box; max-width:min(340px,calc(100vw - 40px)); margin:0; padding:10px 14px; border-radius:6px; color:#fff; background:#292b2f; overflow-wrap:anywhere; }
  </style><p role="status" aria-live="polite" hidden></p><button type="button" aria-label="截图并下载" title="截图并下载（按当前设置）">${FrameIcons.camera}</button>`;
  const button = shadow.querySelector('button');
  const toast = shadow.querySelector('p');
  let observedIcon;
  const iconResize = new ResizeObserver(() => update());

  function findVideo() {
    return [...document.querySelectorAll('video')].filter(video => {
      const rect = video.getBoundingClientRect();
      const style = getComputedStyle(video);
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth && style.visibility !== 'hidden' && style.display !== 'none';
    }).sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return br.width * br.height - ar.width * ar.height;
    })[0];
  }
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
  }
  function capture() {
    const video = findVideo();
    if (!video) throw new Error('没有找到可见的视频，请打开视频播放页。');
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight || video.seeking) throw new Error('视频帧尚未就绪，请播放或等待缓冲后重试。');
    if (video.mediaKeys) throw new Error('此视频受内容保护，无法导出原始帧。');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const time = video.currentTime;
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法创建图片画布。');
      context.drawImage(video, 0, 0);
      const danmakuCount = options.includeDanmaku ? FrameDanmaku.draw(context, video) : 0;
      const subtitleLines = options.includeSubtitles ? FrameSubtitles.draw(context, video, canvas.width, canvas.height) : 0;
      const dataUrl = canvas.toDataURL(FrameCore.formats[options.format], FrameCore.encodingQuality(options));
      if (dataUrl === 'data:,') throw new Error('视频分辨率超出浏览器支持范围。');
      return {
        dataUrl, time, subtitleLines, danmakuCount, width: canvas.width, height: canvas.height,
        title: document.querySelector('h1')?.textContent?.trim() || document.title.replace(/[_-]哔哩哔哩.*$/, ''),
        id: location.pathname.match(/(?:BV[a-zA-Z0-9]+|av\d+|ep\d+|ss\d+)/)?.[0] || 'video'
      };
    } catch (error) {
      if (error.name === 'SecurityError') throw new Error('该视频的跨域限制阻止原始帧导出，未修改或重载播放器。');
      throw error;
    } finally { canvas.width = canvas.height = 0; }
  }
  async function save() {
    if (busy) return { ok: false, error: '正在保存，请稍候。' };
    busy = true;
    button.disabled = true;
    try {
      options = FrameCore.settings(await chrome.storage.local.get(FrameCore.defaults));
      const frame = capture();
      const result = await chrome.runtime.sendMessage({ type: 'DOWNLOAD_FRAME', frame });
      if (!result?.ok) throw new Error(result?.error || '下载未成功启动。');
      notify(`已开始下载 · ${frame.width} × ${frame.height}`);
      return result;
    } catch (error) {
      notify(error.message);
      return { ok: false, error: error.message };
    } finally { busy = false; button.disabled = false; }
  }
  button.addEventListener('click', event => { event.stopPropagation(); save(); });
  button.addEventListener('dblclick', event => event.stopPropagation());
  function update() {
    const video = findVideo();
    if (!video || !options.showButton) { host.remove(); return; }
    const player = video.closest('.bpx-player-container, .bilibili-player');
    const controls = player?.querySelector('.bpx-player-control-bottom-right, .bilibili-player-video-control-bottom-right');
    const fullscreen = document.fullscreenElement;
    const target = controls && (!fullscreen || fullscreen.contains(controls)) ? controls : (fullscreen || document.body);
    if (host.parentNode !== target) target.prepend(host);
    host.toggleAttribute('data-overlay', target !== controls);
    const nativeIcon = target === controls ? controls.querySelector('.bpx-player-ctrl-btn-icon, .bilibili-player-iconfont') : null;
    if (nativeIcon !== observedIcon) {
      iconResize.disconnect();
      observedIcon = nativeIcon;
      if (nativeIcon) iconResize.observe(nativeIcon);
    }
    // Follow the native icon box, not the taller toolbar or button hit area.
    host.style.setProperty('--frame-control-height', nativeIcon ? getComputedStyle(nativeIcon).height : '36px');
    host.style.setProperty('--frame-icon-size', nativeIcon?.querySelector('svg') ? getComputedStyle(nativeIcon.querySelector('svg')).height : '22px');
    if (target !== controls) {
      const rect = video.getBoundingClientRect();
      host.style.left = `${Math.max(0, Math.min(innerWidth - 44, rect.right - 48))}px`;
      host.style.top = `${Math.max(0, rect.top + 12)}px`;
    } else { host.style.removeProperty('left'); host.style.removeProperty('top'); }
  }
  chrome.storage.local.get(FrameCore.defaults).then(value => { options = FrameCore.settings(value); update(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
      if (Object.hasOwn(FrameCore.defaults, key)) options = FrameCore.settings({ ...options, [key]: change.newValue });
    }
    update();
  });
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type === 'SAVE_FRAME') { save().then(respond); return true; }
    if (message.type === 'CAPTURE_FRAME') {
      chrome.storage.local.get(FrameCore.defaults).then(value => {
        options = FrameCore.settings(value);
        respond({ ok: true, frame: capture() });
      }).catch(error => respond({ ok: false, error: error.message }));
      return true;
    }
  });
  document.addEventListener('fullscreenchange', update);
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('scroll', update, { passive: true });
  setInterval(update, 1200);
  update();
})();
