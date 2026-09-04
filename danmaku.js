(() => {
  function opacity(element) {
    let alpha = 1;
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return 0;
      alpha *= Number(style.opacity);
    }
    return alpha;
  }
  function contentRect(rect, width, height, fit = 'contain') {
    if (fit === 'fill') return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    const scale = (fit === 'cover' ? Math.max : Math.min)(rect.width / width, rect.height / height);
    const w = width * scale, h = height * scale;
    return { x: rect.left + (rect.width - w) / 2, y: rect.top + (rect.height - h) / 2, width: w, height: h };
  }
  function intersects(a, b) {
    return a.right > b.x && a.bottom > b.y && a.left < b.x + b.width && a.top < b.y + b.height;
  }
  function draw(context, video) {
    const root = video.closest('.bpx-player-container, .bilibili-player') || video.parentElement;
    const layer = root.querySelector('.bpx-player-row-dm-wrap, .bilibili-player-video-danmaku');
    if (!layer || !opacity(layer)) return 0;
    const videoRect = contentRect(video.getBoundingClientRect(), video.videoWidth, video.videoHeight, getComputedStyle(video).objectFit);
    if (!videoRect.width || !videoRect.height) return 0;
    const sx = video.videoWidth / videoRect.width, sy = video.videoHeight / videoRect.height;
    const clip = layer.getBoundingClientRect();
    let count = 0;
    context.save();
    context.beginPath();
    context.rect(0, 0, video.videoWidth, video.videoHeight);
    context.clip();
    context.beginPath();
    context.rect((clip.left - videoRect.x) * sx, (clip.top - videoRect.y) * sy, clip.width * sx, clip.height * sy);
    context.clip();
    // Copy only the danmaku layer, never the controls or other page overlays.
    for (const canvas of layer.querySelectorAll('canvas')) {
      const alpha = opacity(canvas), rect = canvas.getBoundingClientRect();
      if (!alpha || !canvas.width || !canvas.height || !intersects(rect, videoRect)) continue;
      context.globalAlpha = alpha;
      context.drawImage(canvas, (rect.left - videoRect.x) * sx, (rect.top - videoRect.y) * sy, rect.width * sx, rect.height * sy);
      count++;
    }
    for (const element of layer.querySelectorAll('.bili-danmaku-x-dm, .b-danmaku')) {
      const alpha = opacity(element), bounds = element.getBoundingClientRect();
      if (!alpha || !intersects(bounds, videoRect)) continue;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let text;
      let rendered = false;
      while ((text = walker.nextNode())) {
        if (!text.textContent.trim()) continue;
        const parent = text.parentElement, style = getComputedStyle(parent);
        const range = document.createRange();
        range.selectNodeContents(text);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height || !intersects(rect, videoRect)) continue;
        const fontSize = parseFloat(style.fontSize);
        if (!fontSize) continue;
        context.save();
        context.translate((rect.left - videoRect.x) * sx, (rect.top - videoRect.y + rect.height / 2) * sy);
        context.scale(sx, sy);
        context.globalAlpha = opacity(parent);
        context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillStyle = style.color;
        context.lineJoin = 'round';
        if (style.textShadow !== 'none') {
          context.strokeStyle = '#171717';
          context.lineWidth = Math.max(1.5, fontSize * 0.07);
          context.strokeText(text.textContent, 0, 0);
        }
        context.fillText(text.textContent, 0, 0);
        context.restore();
        rendered = true;
      }
      if (rendered) count++;
    }
    context.restore();
    return count;
  }
  globalThis.FrameDanmaku = { draw, contentRect, intersects };
})();
