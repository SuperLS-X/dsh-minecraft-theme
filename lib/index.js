/**
 * dsh-minecraft-theme — host half.
 *
 * Minecraft 主题插件的主机端：为客户端提供本地资源读取能力——
 * 纹理导入、中/英像素字体（Zpix / Silkscreen）、MC 点击音效、
 * 自定义纹理持久化、内置音乐（mc-textures/music）与本地音乐文件读取。
 *
 * DSH rc.7 静态插件模型：通过 `ctx.webServer` 注册一个 `/mc/rpc` HTTP
 * 路由，浏览器端用 fetch 调用（替代旧版 dynamic-package 的 harness.handle
 * / host.call 桥）。返回结构与原实现完全一致。
 *
 * 资源优先级：工作区 `<workspace>/mc-textures`（用户自定义）→ 包内
 * `mc-textures`（随插件分发的小体积默认资源：click.ogg / Silkscreen /
 * DotGothic16）→ CDN 兜底（中文字体 Zpix、全部 16 首原声音乐）。因此
 * 没有本地资源的用户也能获得完整功能（在线时）。
 */
import { fileURLToPath } from 'node:url';
export const name = '@superls-x/dsh-minecraft-theme';
const B64C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Minecraft 官方资源的 CDN 镜像（InventivetalentDev/minecraft-assets, MIT）。 */
const MC_ASSETS_CDN = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.16.5/assets/minecraft/sounds/';
/** 随包分发的默认资源目录（lib/index.js 的上一级 mc-textures）。 */
const PACKAGE_ASSETS = fileURLToPath(new URL('../mc-textures/', import.meta.url));
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
function mimeFromUrl(url) {
  if (/\.woff2/.test(url)) return 'font/woff2';
  if (/\.ttf/.test(url)) return 'font/ttf';
  if (/\.mp3/.test(url)) return 'audio/mpeg';
  if (/\.ogg/.test(url)) return 'audio/ogg';
  if (/\.wav/.test(url)) return 'audio/wav';
  return 'application/octet-stream';
}
/** Fetch a remote asset into a data URI. Throws on any failure. */
async function fetchDataUri(url, timeoutMs) {
  if (typeof globalThis === 'undefined' || typeof globalThis.fetch !== 'function') throw new Error('fetch unavailable');
  const res = await globalThis.fetch(url, { signal: AbortSignal.timeout(timeoutMs || 30000) });
  if (!res || !res.ok) throw new Error('http ' + (res && res.status));
  const ab = await res.arrayBuffer();
  if (!ab || !ab.byteLength) throw new Error('empty response');
  return 'data:' + mimeFromUrl(url) + ';base64,' + bytesToBase64(new Uint8Array(ab));
}
/** Try a list of candidate absolute paths; return the first readable data URI. */
async function firstFileDataUri(fs, candidates, maxBytes, mime) {
  for (const target of candidates) {
    try {
      const b = await fs.readBytes(await fs.resolve(target), undefined, maxBytes);
      if (b && b.length) return { data: 'data:' + (mime || 'application/octet-stream') + ';base64,' + bytesToBase64(b), size: b.length };
    } catch (e) { /* try next */ }
  }
  return null;
}
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}
export default {
  apply(ctx) {
    // Services come from the row's `inject` list (cordis rc.7 gating).
    const fs = ctx.fs;
    const sp = ctx.sandboxPolicy;
    const webServer = ctx.webServer;
    const handlers = {};
    // CDN-fetched music cache (LRU, bounded) so repeated requests don't refetch.
    const musicCache = new Map();
    // Read roots: user workspace first, then the package's bundled defaults,
    // then this machine's legacy asset dir (kept for backward compatibility).
    const readRoots = () => {
      const list = [];
      if (sp && sp.workspaceRoot) list.push(sp.workspaceRoot);
      list.push(PACKAGE_ASSETS);
      list.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
      return list;
    };
    // Write roots: never the package install dir (read-only / would pollute it).
    const writeRoots = () => {
      const list = [];
      if (sp && sp.workspaceRoot) list.push(sp.workspaceRoot);
      list.push('D:\\Documents\\dsh', 'D:/Documents/dsh', 'D:');
      return list;
    };
    const readRoot = (rel) => readRoots().map((root) => root + '/' + rel);
    if (fs !== undefined) {
      handlers['import-texture'] = async (args) => {
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
      };
      handlers['save-custom-textures'] = async (args) => {
        try {
          const list = args && Array.isArray(args.custom) ? args.custom : [];
          const count = Math.max(0, Number((args && args.customCount) || 0) || 0);
          const safe = list.slice(0, 60).map((x) => ({
            id: String((x && x.id) || ''),
            name: String((x && x.name) || '纹理'),
            data: String((x && x.data) || '').slice(0, 4 * 1024 * 1024),
            color: String((x && x.color) || '#888'),
          }));
          for (const root of writeRoots()) {
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
      };
      handlers['load-custom-textures'] = async () => {
        try {
          const names = ['mc-textures/custom-textures.json', 'custom-textures.json'];
          for (const root of writeRoots()) {
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
      };
        handlers['save-settings'] = async (args) => {
          try {
            const safe = {
              texture: String((args && args.texture) || 'grass'),
              bubble: String((args && args.bubble) || 'none'),
              input: String((args && args.input) || 'none'),
              size: Math.max(8, Math.min(1024, Number((args && args.size) || 128) || 128)),
              bubbleSize: Math.max(4, Math.min(256, Number((args && args.bubbleSize) || 32) || 32)),
              inputSize: Math.max(4, Math.min(256, Number((args && args.inputSize) || 32) || 32)),
              bubbleTextColor: String((args && args.bubbleTextColor) || '#ffffff'),
              inputTextColor: String((args && args.inputTextColor) || '#ffffff'),
              particles: !!(args && args.particles),
            };
            for (const root of writeRoots()) {
              try {
                const file = await fs.resolve(root + '/mc-textures/theme-settings.json');
                await fs.writeText(file, JSON.stringify(safe));
                return { ok: true };
              } catch (e) { /* try next root */ }
            }
            return { error: '保存失败：目录不可写' };
          } catch (err) {
            return { error: String((err && err.message) || err) };
          }
        };
        handlers['load-settings'] = async () => {
          try {
            const names = ['mc-textures/theme-settings.json', 'theme-settings.json'];
            for (const root of writeRoots()) {
              for (const name of names) {
                try {
                  const target = await fs.resolve(root + '/' + name);
                  const text = await fs.readText(target);
                  const j = JSON.parse(text);
                  if (j && typeof j === 'object') return j;
                } catch (e) { /* try next */ }
              }
            }
            return {};
          } catch (err) {
            return {};
          }
        };
      handlers['get-music-track'] = async (args) => {
        try {
          const name = String((args && args.name) || '').trim();
          if (!name || /[^a-z0-9_-]/i.test(name)) return { error: '非法曲目名' };
          for (const root of readRoots()) {
            for (const ext of ['ogg', 'mp3']) {
              try {
                const target = await fs.resolve(root + '/mc-textures/music/' + name + '.' + ext);
                const b = await fs.readBytes(target, undefined, 16 * 1024 * 1024);
                if (b && b.length > 10000) {
                  const mime = ext === 'mp3' ? 'audio/mpeg' : 'audio/ogg';
                  return { data: 'data:' + mime + ';base64,' + bytesToBase64(b) };
                }
              } catch (e) { /* try next */ }
            }
          }
          // CDN fallback so users without local music still get all 16 tracks.
          if (musicCache.has(name)) return { data: musicCache.get(name) };
          const sub = /^menu/i.test(name) ? 'menu' : 'game';
          try {
            const data = await fetchDataUri(MC_ASSETS_CDN + 'music/' + sub + '/' + name + '.ogg', 30000);
            if (musicCache.size >= 8) musicCache.delete(musicCache.keys().next().value);
            musicCache.set(name, data);
            return { data: data };
          } catch (e) { /* fall through */ }
          return { error: '曲目文件未找到' };
        } catch (err) {
          return { error: String((err && err.message) || err) };
        }
      };
      handlers['import-music-folder'] = async (args) => {
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
      };
      handlers['get-music-file'] = async (args) => {
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
      };
    }
    let cache = null;
    let cachedErr = null;
    async function loadFont() {
      if (cache !== null || cachedErr) return;
      try {
        let bytes = null;
        let mime = 'data:font/ttf;base64,';
        const names = ['mc-textures/zpix.ttf', 'mc-textures/dotgothic16.woff2', 'zpix.ttf', 'dotgothic16.woff2'];
        outer:
        for (const root of readRoots()) {
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
        if (!bytes) {
          // CDN fallback: Zpix (or the lighter DotGothic16) for offline-less users.
          for (const url of [
            'https://cdn.jsdelivr.net/gh/SolidZORO/zpix-pixel-font@master/dist/zpix.ttf',
            'https://cdn.jsdelivr.net/fontsource/fonts/dotgothic16@latest/japanese-400-normal.woff2',
          ]) {
            try { cache = await fetchDataUri(url, 20000); return; } catch (e) { /* try next */ }
          }
        }
        if (!bytes) { cachedErr = '字体文件未找到'; return; }
        cache = mime + bytesToBase64(bytes);
      } catch (err) {
        cachedErr = String((err && err.message) || err);
      }
    }
    handlers['get-cjk-font'] = async () => {
      await loadFont();
      if (cache) return { data: cache, format: cache.indexOf('woff2') >= 0 ? 'woff2' : 'truetype' };
      return { error: cachedErr || 'unavailable' };
    };
    handlers['get-latin-font'] = async () => {
      try {
        const names = ['mc-textures/silkscreen-latin-400-normal.woff2', 'mc-textures/silkscreen.woff2', 'silkscreen-latin-400-normal.woff2'];
        for (const root of readRoots()) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const b = await fs.readBytes(target, undefined, 2 * 1024 * 1024);
              if (b && b.length) return { data: 'data:font/woff2;base64,' + bytesToBase64(b) };
            } catch (e) { /* try next */ }
          }
        }
        // CDN fallback (Silkscreen, OFL) for users without the local font.
        try {
          return { data: await fetchDataUri('https://cdn.jsdelivr.net/fontsource/fonts/silkscreen@latest/latin-400-normal.woff2', 15000) };
        } catch (e) { /* ignore */ }
        return { error: '字体文件未找到' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    };
    handlers['get-click-sound'] = async () => {
      try {
        const names = ['mc-textures/click.ogg', 'click.ogg'];
        for (const root of readRoots()) {
          for (const name of names) {
            try {
              const target = await fs.resolve(root + '/' + name);
              const b = await fs.readBytes(target, undefined, 2 * 1024 * 1024);
              if (b && b.length) return { data: 'data:audio/ogg;base64,' + bytesToBase64(b) };
            } catch (e) { /* try next */ }
          }
        }
        // CDN fallback (mc-assets, MIT) for users without the bundled click.ogg.
        try {
          return { data: await fetchDataUri(MC_ASSETS_CDN + 'random/click.ogg', 15000) };
        } catch (e) { /* ignore */ }
        return { error: '音效文件未找到' };
      } catch (err) {
        return { error: String((err && err.message) || err) };
      }
    };
    if (webServer === undefined) return;
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/mc/rpc',
      handler: async (req, res) => {
        try {
          if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
          const raw = await readBody(req);
          let parsed = null;
          try {
            parsed = JSON.parse(raw || '{}');
          } catch (e) {
            return sendJson(res, 400, { error: 'bad json' });
          }
          const method = String((parsed && parsed.method) || '');
          const fn = handlers[method];
          if (!fn) return sendJson(res, 404, { error: 'unknown method: ' + method });
          const result = await fn(parsed && parsed.args);
          return sendJson(res, 200, result === undefined ? {} : result);
        } catch (err) {
          return sendJson(res, 500, { error: String((err && err.message) || err) });
        }
      },
    }), 'mc-theme: /mc/rpc route');
  },
};
