importScripts('core.js');

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== 'DOWNLOAD_FRAME') return;
  (async () => {
    if (sender.id !== chrome.runtime.id) throw new Error('无效的扩展请求。');
    const frame = message.frame;
    if (!frame || typeof frame.dataUrl !== 'string' || frame.dataUrl.length > 48 * 1024 * 1024 ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(frame.dataUrl)) {
      throw new Error('图片无效或过大，请降低视频清晰度后重试。');
    }
    const format = frame.dataUrl.startsWith('data:image/jpeg') ? 'jpeg' : frame.dataUrl.startsWith('data:image/webp') ? 'webp' : 'png';
    const id = typeof frame.id === 'string' && /^(BV[a-zA-Z0-9]+|av\d+|ep\d+|ss\d+)$/.test(frame.id) ? frame.id : 'video';
    const downloadId = await chrome.downloads.download({
      url: frame.dataUrl,
      filename: FrameCore.filename(frame.title, id, frame.time, format),
      saveAs: false,
      conflictAction: 'uniquify'
    });
    return { ok: true, downloadId };
  })().then(respond, error => respond({ ok: false, error: error.message }));
  return true;
});

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'save-frame') return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.sendMessage(tab.id, { type: 'SAVE_FRAME' });
  } catch {
    // No content script on non-Bilibili tabs.
  }
});
