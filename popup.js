const $ = selector => document.querySelector(selector);
let options;
let pending = Promise.resolve();
document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = FrameIcons[node.dataset.icon]; });
function status(text, error = false) { $('#status').textContent = text; $('#status').dataset.error = String(error); }
function render() {
  $(`input[value="${options.format}"]`).checked = true;
  $('#quality-row').hidden = options.format === 'png';
  $('#png-note').hidden = options.format !== 'png';
  const quality = FrameCore.encodingQuality(options) ?? 0.85;
  $('#quality').value = Math.round(quality * 100);
  $('#quality-value').textContent = `${Math.round(quality * 100)}%`;
  $('#subtitles').checked = options.includeSubtitles;
  $('#danmaku').checked = options.includeDanmaku;
  $('#show-button').checked = options.showButton;
}
function persist() {
  const snapshot = { ...options };
  status('正在保存…');
  pending = pending.catch(() => {}).then(() => chrome.storage.local.set(snapshot));
  pending.then(() => status('已自动保存'), () => status('设置保存失败，请重试。', true));
}
async function init() {
  options = FrameCore.settings(await chrome.storage.local.get(FrameCore.defaults));
  render();
  $('#settings').disabled = false;
  $('#save-now').disabled = false;
  status('设置已就绪');
  document.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    if (input.name === 'format') options.format = input.value;
    if (input.id === 'quality') options[options.format === 'jpeg' ? 'jpegQuality' : 'webpQuality'] = Number(input.value) / 100;
    if (input.id === 'subtitles') options.includeSubtitles = input.checked;
    if (input.id === 'danmaku') options.includeDanmaku = input.checked;
    if (input.id === 'show-button') options.showButton = input.checked;
    render();
    persist();
  }));
}
$('#save-now').addEventListener('click', async () => {
  $('#save-now').disabled = true;
  status('正在截图…');
  try {
    await pending;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('请打开 B 站视频页。');
    let result;
    try { result = await chrome.tabs.sendMessage(tab.id, { type: 'SAVE_FRAME' }); }
    catch { throw new Error('请打开 B 站视频页；若已打开，请刷新后重试。'); }
    if (!result?.ok) throw new Error(result?.error || '截图失败。');
    status('已开始下载');
  } catch (error) { status(error.message, true); }
  finally { $('#save-now').disabled = false; }
});
init().catch(() => status('无法读取扩展设置。', true));
