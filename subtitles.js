(() => {
  function visible(element) {
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  function collect(video) {
    const root = video.closest('.bpx-player-container, .bilibili-player') || video.parentElement;
    const nodes = [...root.querySelectorAll('.bpx-player-subtitle-panel-text, .bilibili-player-video-subtitle-panel-text')];
    // Some player versions put subtitle lines directly in the wrapper.
    if (!nodes.length) nodes.push(...root.querySelectorAll('.bpx-player-subtitle-wrap, .bilibili-player-video-subtitle'));
    const lines = nodes.filter(visible).flatMap(node => (node.innerText || '').split('\n').map(text => text.trim()).filter(Boolean));
    if (lines.length) return lines;
    return [...video.textTracks].filter(track => track.mode === 'showing').flatMap(track => [...(track.activeCues || [])]
      .flatMap(cue => (cue.getCueAsHTML?.().textContent || cue.text || '').split('\n').filter(Boolean)));
  }
  function wrap(context, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const character of text) {
      if (line && context.measureText(line + character).width > maxWidth) { lines.push(line); line = ''; }
      line += character;
    }
    if (line) lines.push(line);
    return lines;
  }
  function draw(context, video, width, height) {
    const text = collect(video);
    if (!text.length) return 0;
    context.save();
    const size = Math.max(12, Math.round(height * 0.042));
    context.font = `600 ${size}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineJoin = 'round';
    const lines = text.flatMap(line => wrap(context, line, width * 0.9)).slice(0, 8);
    const step = size * 1.4;
    const bottom = height - Math.max(size, height * 0.055);
    lines.forEach((line, index) => {
      const y = bottom - (lines.length - 1 - index) * step;
      const textWidth = context.measureText(line).width;
      context.fillStyle = 'rgba(15,15,15,0.55)';
      context.fillRect((width - textWidth) / 2 - size * 0.3, y - step / 2, textWidth + size * 0.6, step);
      context.strokeStyle = '#181818';
      context.lineWidth = Math.max(2, size * 0.1);
      context.strokeText(line, width / 2, y);
      context.fillStyle = '#ffffff';
      context.fillText(line, width / 2, y);
    });
    context.restore();
    return lines.length;
  }
  globalThis.FrameSubtitles = { collect, wrap, draw };
})();
