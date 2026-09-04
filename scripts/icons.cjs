const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const icons = Object.fromEntries(['camera', 'download', 'settings-2', 'arrow-right', 'pause', 'captions'].map(name => [name, fs.readFileSync(path.join(root, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8')]));
fs.writeFileSync(path.join(root, 'icons.js'), `// Generated from lucide-static (ISC license).\nglobalThis.FrameIcons = ${JSON.stringify(icons)};\n`);
fs.copyFileSync(path.join(root, 'node_modules/lucide-static/LICENSE'), path.join(root, 'LUCIDE-LICENSE'));
