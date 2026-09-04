(() => {
  const formats = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
  const defaults = { format: 'png', quality: 0.85, jpegQuality: 0.85, webpQuality: 0.85, includeSubtitles: true, includeDanmaku: true, saveAs: false, showButton: true };
  function settings(value = {}) {
    return {
      format: Object.hasOwn(formats, value.format) ? value.format : defaults.format,
      quality: Number.isFinite(value.quality) ? Math.min(1, Math.max(0.5, value.quality)) : defaults.quality,
      jpegQuality: Number.isFinite(value.jpegQuality) ? Math.min(1, Math.max(0.5, value.jpegQuality)) : defaults.jpegQuality,
      webpQuality: Number.isFinite(value.webpQuality) ? Math.min(1, Math.max(0.5, value.webpQuality)) : defaults.webpQuality,
      includeSubtitles: typeof value.includeSubtitles === 'boolean' ? value.includeSubtitles : true,
      includeDanmaku: typeof value.includeDanmaku === 'boolean' ? value.includeDanmaku : true,
      saveAs: typeof value.saveAs === 'boolean' ? value.saveAs : defaults.saveAs,
      showButton: typeof value.showButton === 'boolean' ? value.showButton : defaults.showButton
    };
  }
  function timestamp(seconds) {
    const ms = Math.max(0, Math.round((Number.isFinite(seconds) ? seconds : 0) * 1000));
    return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
      .map(n => String(n).padStart(2, '0')).join('-') + '.' + String(ms % 1000).padStart(3, '0');
  }
  function filename(title, id, time, format) {
    const safe = String(title || 'bilibili').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '_')
      .replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 90) || 'bilibili';
    return `Bilibili Frames/${safe}_${id || 'video'}_${timestamp(time)}.${format === 'jpeg' ? 'jpg' : format}`;
  }
  function encodingQuality(options) {
    return options.format === 'jpeg' ? options.jpegQuality : options.format === 'webp' ? options.webpQuality : undefined;
  }
  globalThis.FrameCore = { formats, defaults, settings, timestamp, filename, encodingQuality };
})();
