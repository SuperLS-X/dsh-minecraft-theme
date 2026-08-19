/**
 * dsh-minecraft-theme — host half.
 *
 * Minecraft 主题插件的主机端：为客户端提供本地资源读取能力——
 * 纹理导入、中/英像素字体（Zpix / Silkscreen）、MC 点击音效、
 * 自定义纹理持久化、内置音乐（mc-textures/music）与本地音乐文件读取。
 */
export const name = '@superls-x/dsh-minecraft-theme';
const B64C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesToBase64(u8) {
  let out = '';
  const n = u8.length;
  for (let i = 0; i < n; i += 3) {
    const b0 = u8[i];
    const b1 = i + 1 < n ? u8[i + 1] : 0;
    const b2 = i + 2 < n ? u8[i + 2] : 0;
    out += B64C[b0 >> 2];
    out += B64C[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < n ? B64C[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < n ? B64C[b2 & 63] : '=';
  }
  return out;
}
export default {
  apply(ctx) {
    const H = (typeof harness !== 'undefined') ? harness : ((ctx && ctx.harness) ? ctx.harness : null);
    const fs = ctx.get('fs');
    const web = ctx.get('web');
    const sp = ctx.get('sandboxPolicy');
    if (fs !== undefined) {
      if (!H) return;
      H.handle('import-texture', async (args) => {
        try {
          const p = String((args && args.path) || '').trim();
          if (!p) return { error: '路径为空' };
          const target = await fs.resolve(p);
          const bytes = await fs.readBytes(target, undefined, 8 * 1024 * 1024);
          if (!bytes || !bytes.length) return { error: '文件为空' };
          let mime = 'image/png';
          if (bytes[0] === 0x3c) mime = 'image/svg+xml';
          else if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = 'image/jpeg';
          else if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = 'image/gif';
          else if (bytes[0] === 0x89 && bytes[1] === 0x50) mime = 'image/png';
          return { data: 'data:' + mime + ';base64,' + bytesToBase64(bytes), size: bytes.length };
        } catch (err) {
          return { error: String((err && err.message) || err) };
        }
      });
    }
    let cache = null;
    let cachedErr = null;
    async function loadFont() {
      if (cache !== null || cachedErr) return;
      try {
        let bytes = null;
        let mime = 'data:font/ttf;base64,';
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        const names = ['mc-textures/zpix.ttf', 'mc-textures/dotgothic16.woff2', 'zpix.ttf', 'dotgothic16.woff2'];
        outer:
        for (const root of roots) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const b = await fs.readBytes(target, undefined, 16 * 1024 * 1024);
              if (b && b.length) {
                bytes = b;
                if (name.indexOf('.woff2') >= 0) mime = 'data:font/woff2;base64,';
                break outer;
              }
            } catch (e) { /* try next */ }
          }
        }
        if (!bytes && web !== undefined) {
          try {
            const res = await web.fetch({ url: 'https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@master/dist/zpix.ttf' });
            if (res && typeof res.data === 'string' && res.data.indexOf('data:') === 0) { cache = res.data; return; }
          } catch (e) { /* ignore */ }
        }
        if (!bytes) { cachedErr = '字体文件未找到'; return; }
        cache = mime + bytesToBase64(bytes);
      } catch (err) {
        cachedErr = String((err && err.message) || err);
      }
    }
    if (!H) return;
      H.handle('get-cjk-font', async () => {
      await loadFont();
      if (cache) return { data: cache, format: cache.indexOf('woff2') >= 0 ? 'woff2' : 'truetype' };
      return { error: cachedErr || 'unavailable' };
    });
    if (!H) return;
      H.handle('get-latin-font', async () => {
      try {
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        const names = ['mc-textures/silkscreen-latin-400-normal.woff2', 'mc-textures/silkscreen.woff2', 'silkscreen-latin-400-normal.woff2'];
        for (const root of roots) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const b = await fs.readBytes(target, undefined, 2 * 1024 * 1024);
              if (b && b.length) return { data: 'data:font/woff2;base64,' + bytesToBase64(b) };
            } catch (e) { /* try next */ }
          }
        }
        return { error: '字体文件未找到' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    });
    if (!H) return;
      H.handle('get-click-sound', async () => {
      try {
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        const names = ['mc-textures/click.ogg', 'click.ogg'];
        for (const root of roots) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const b = await fs.readBytes(target, undefined, 2 * 1024 * 1024);
              if (b && b.length) return { data: 'data:audio/ogg;base64,' + bytesToBase64(b) };
            } catch (e) { /* try next */ }
          }
        }
        return { error: '音效文件未找到' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    });
    if (!H) return;
      H.handle('save-custom-textures', async (args) => {
      try {
        const list = args && Array.isArray(args.custom) ? args.custom : [];
        const count = Math.max(0, Number((args && args.customCount) || 0) || 0);
        const safe = list.slice(0, 60).map((x) => ({
          id: String((x && x.id) || ''),
          name: String((x && x.name) || '纹理'),
          data: String((x && x.data) || '').slice(0, 4 * 1024 * 1024),
          color: String((x && x.color) || '#888'),
        }));
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        for (const root of roots) {
          try {
            const dir = await fs.resolve(root + '/mc-textures');
            const file = await fs.resolve(root + '/mc-textures/custom-textures.json');
            const sr = args && args.renames && typeof args.renames === 'object' ? args.renames : {};
        const safeRenames = {};
        Object.keys(sr).forEach((k) => { if (typeof sr[k] === 'string' && sr[k]) safeRenames[k] = sr[k].slice(0, 200); });
        const hidden = Array.isArray(args && args.hidden) ? args.hidden.slice(0, 100).map(String) : [];
        const order = Array.isArray(args && args.order) ? args.order.slice(0, 200).map(String) : [];
        await fs.writeText(file, JSON.stringify({ custom: safe, customCount: count, renames: safeRenames, hidden: hidden, order: order }));
            return { ok: true, count: safe.length };
          } catch (e) { /* try next root */ }
        }
        return { error: '保存失败：目录不可写' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    });
    if (!H) return;
      H.handle('load-custom-textures', async () => {
      try {
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        const names = ['mc-textures/custom-textures.json', 'custom-textures.json'];
        for (const root of roots) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const text = await fs.readText(target);
              const j = JSON.parse(text);
              if (j && Array.isArray(j.custom)) {
                return { custom: j.custom, customCount: Number(j.customCount) || j.custom.length, renames: j.renames && typeof j.renames === 'object' ? j.renames : {}, hidden: Array.isArray(j.hidden) ? j.hidden : [], order: Array.isArray(j.order) ? j.order : [] };
              }
            } catch (e) { /* try next */ }
          }
        }
        return { custom: [], customCount: 0 };
      } catch (err) {
        return { custom: [], customCount: 0 };
      }
    });
    if (!H) return;
      H.handle('get-music-track', async (args) => {
      try {
        const name = String((args && args.name) || '').trim();
        if (!name || /[^a-z0-9_-]/i.test(name)) return { error: '非法曲目名' };
        const roots = [];
        if (sp && sp.workspaceRoot) roots.push(sp.workspaceRoot);
        roots.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
        const names = ['mc-textures/music/' + name + '.ogg', 'mc-textures/music/' + name + '.mp3'];
        for (const root of roots) {
          for (const n of names) {
            try {
              const target = await fs.resolve(root + '/' + n);
              const b = await fs.readBytes(target, undefined, 16 * 1024 * 1024);
              if (b && b.length > 10000) {
                const mime = n.indexOf('.mp3') >= 0 ? 'audio/mpeg' : 'audio/ogg';
                return { data: 'data:' + mime + ';base64,' + bytesToBase64(b) };
              }
            } catch (e) { /* try next */ }
          }
        }
        return { error: '曲目文件未找到' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    });
    if (!H) return;
      H.handle('import-music-folder', async (args) => {
      try {
        const p = String((args && args.path) || '').trim();
        if (!p) return { error: '路径为空', tracks: [] };
        const target = await fs.resolve(p);
        const entries = await fs.listDir(target);
        const exts = /\.(ogg|mp3|wav|flac|m4a|aac|opus)$/i;
        const tracks = [];
        for (const e of entries) {
          if (tracks.length >= 30) break;
          const name = String((e && (e.name || e.path)) || '');
          if (!exts.test(name)) continue;
          try {
            const child = await fs.resolve(p + '/' + name);
            tracks.push({ name: name, file: p + '/' + name });
          } catch (err) { /* skip */ }
        }
        return { tracks: tracks };
      } catch (err) {
        return { error: String((err && err.message) || err), tracks: [] };
      }
    });
    if (!H) return;
      H.handle('get-music-file', async (args) => {
      try {
        const p = String((args && args.path) || '').trim();
        if (!p || !/\.(ogg|mp3|wav|flac|m4a|aac|opus)$/i.test(p)) return { error: '非法音频路径' };
        const target = await fs.resolve(p);
        const b = await fs.readBytes(target, undefined, 24 * 1024 * 1024);
        if (!b || !b.length) return { error: '文件为空' };
        let mime = 'audio/ogg';
        if (/\.mp3$/i.test(p)) mime = 'audio/mpeg';
        else if (/\.wav$/i.test(p)) mime = 'audio/wav';
        else if (/\.flac$/i.test(p)) mime = 'audio/flac';
        else if (/\.m4a$/i.test(p)) mime = 'audio/mp4';
        else if (/\.aac$/i.test(p)) mime = 'audio/aac';
        return { data: 'data:' + mime + ';base64,' + bytesToBase64(b) };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    });
  },
};

