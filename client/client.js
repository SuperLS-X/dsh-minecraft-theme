/**
 * dsh-minecraft-theme — client half.
 *
 * Minecraft 主题插件的浏览器端：方块纹理背景铺满页面、像素字体、
 * MC 灰色按钮与点击音效、纹理选择/导入/管理面板、音乐播放器
 * （默认 16 首 Minecraft 原声 + 本地音乐文件夹）。
 */
window.__ModuleLoader__.load({
  id: '@superls-x/dsh-minecraft-theme',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    let React = require('react');
// DSH rc.7 static-plugin RPC: the host half serves /mc/rpc via ctx.webServer.
function mcRpc(method, args) {
  return fetch('/mc/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: method, args: args })
  }).then(function (r) { return r.json(); });
}
// Static plugins run as plain CJS modules: the factory scope only gets
// `require`, so the `styles` closure symbol of the dynamic cordis model is NOT
// available here. Provide the same API (`insert(css) -> disposer`,
// `count`, `dispose()`) backed by real <style> tags owned by this package.
const styles = (function () {
  const tags = new Set();
  const insert = function (css) {
    if (typeof css !== 'string') throw new Error('styles.insert(css) needs a CSS string');
    const tag = document.createElement('style');
    tag.setAttribute('data-plugin', '@superls-x/dsh-minecraft-theme');
    tag.textContent = css;
    document.head.appendChild(tag);
    tags.add(tag);
    return function () {
      tags.delete(tag);
      if (tag.parentNode) tag.parentNode.removeChild(tag);
    };
  };
  const dispose = function () {
    tags.forEach(function (tag) { if (tag.parentNode) tag.parentNode.removeChild(tag); });
    tags.clear();
  };
  return {
    insert: insert,
    dispose: dispose,
    get count() { return tags.size; }
  };
})();
const PN = 'data:image/png;base64,';


const TEX = {
  grass: { name: '草方块 Grass', color: '#5f9e3e', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIFSURBVDhPRZPXTkJREEXP3xgpIgIiRcUIYm+ACgKCoGDBEnvXB0t8MPGLx6xNbnyAW87MbjPXFU+idvqbtWIvYoutkH5rhyM2Ww/Yajdslau4lU6jtrw/bEvtkK47j0nLFAZs9SBsrnQSVeH2zZhtnMVs8zxmcztBXecbQQE1nlJWf0iKBDLqAVvphM3V7hJCytcCtrA71GfaC9n60Yh+KKxcxwWy+5pWY3bLJ5LOZ8bc9OagLbb6jShYP4qIHcDCcUQK5ptDIuEcezBjgxpXvU2oAHRdX9LWehuXCu4Pv6cMEhhpar6kbbYW0LkygG3jPGbZsk8+5xpBhUY2Wxejksw9DRBQx/3aQd+eA618OWr1+6Q8I5tCLCGfXADpfExKERZR4tlx/FFQvozLGyD5qt9q9wk1U+iFhzrqmZg3HQcaUkm0+ZwSC4U0oWz/fULvGSnqCJxxsh+odzBw2P3KKBRmTCY0ERzMyKYZRrwDihKIHOygAUQOgKFGIfUi1vuZtlzFJ99kI8t7of8M8IlcVpil4oB3MHq7wT3KZrb9Ysc/O8C5Y84UIYcXjBXJeM1V/HrHM1ea2EqUooo+RyPeWBaYKNL30Ahq76s3Y7JCDXaZABZ4ZuH0LVCEV08i28aS0EjSLJKWqd1v9EaOCodUNg9UZDJ/puABECbg7AbN5MOuUE/4f5Xl86CdBLEIAAAAAElFTkSuQmCC' },
  dirt: { name: '泥土 Dirt', color: '#966c4a', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAFVBMVEW5hVyHh4eWbEpsbGx0WER5VTpZPSnqDkA3AAAAbklEQVR42hXLwQnDQAwEwOVA7uDyNgq6AtJD/mLD6m0Muv5LCJ7/YES6OhNsvjLGhpXJtA1vW+nMQJy31o+Ncu4uJUwzDSQE13I5giyGGuxqCQTTxnX4RPDkJ+5ChZskgPp6HemIqwp8+ojp8voDZ2EdYwBe7AYAAAAASUVORK5CYII=' },
  stone: { name: '石头 Stone', color: '#7d7d7d', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAZElEQVR42jWNsQ0AMQjEGJcB3HsEr/xSkncBOgkfUyXIguoo4mEXGdkFFvBdlGmpwKCAWIWOeYFladCK4n2BXZZn6vR3dsXRfLnKWfFoXmtUrX81AiboaZ9u4I1G8KdqPICl6AdyLn2NfcJFIAAAAABJRU5ErkJggg==' },
  cobble: { name: '圆石 Cobblestone', color: '#797979', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEW1tbWmpqaIh4hubW1hYWFSUlLm8qFQAAAAcUlEQVR42gVAARGDMAz8MAMjh4CSLwIWIgDSIGAD/1p2iPk5pTfFOW3QLR3nGrrGQxSLTL1wp2TJ3PF6W/yaOjSV9eEB2y3a4omQPSerG4f6biMXkP0a8X2DMdpytQkuIWuY49CuziJmclhoIcsjUvgH41gVHD61kt4AAAAASUVORK5CYII=' },
  sand: { name: '沙子 Sand', color: '#dbd3a0', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEXt68vn5Lvj27Daz6PVxJbRuopf1Q47AAAAZklEQVR42gVAwQ3CMBCzQPyRukEcBqjP/dNzWAC6/ywIm0y2GrH72h47eJ1VdqDpOdqF3FuqCK7BzApOv7N+Nlyx126E+nQYbKl1uCYOWcVLWMWMlSDdfnIJ5EtSBdKN5LdADrnIP0wTGY7btIheAAAAAElFTkSuQmCC' },
  planks: { name: '橡木木板 Oak Planks', color: '#b08d57', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAFVBMVEXCnWK4lF+vj1WfhE2WdEF+YjdnUCyo+21oAAAAcElEQVR42g3CARXDIAwFwM/DAAk1kGQCVoKDDQeAA+JfQnvvwAV4XyD9CSk5hMS8yYUxR6wTG+WLjKQ3hFtvQgwX/RCbI9aIWHOjJMWrgonMzTqSuqt6RcwRZ+xALqkiJ0DJ7WZWWONO5o6zz3+ciAdixhUFVj2uwQAAAABJRU5ErkJggg==' },
  netherrack: { name: '地狱岩 Netherrack', color: '#6a3232', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAFVBMVEWFQkJyMjJlKChXISFQGxtRFRVBFhZSHStNAAAAe0lEQVR42g3JsRGDMBAEwIMK9A8UcNKrABgPud6IHIzJ7VH/NdibLl6XSfwyYUm7j3esUF2vVI3oaDOH0xHUQy8l4UgHxKLiHD/Uyg7D7fpWB4xWo2TCgzZyujBTW5C9wYrdJbcHTi15O5j/FaZtCRNc+udORmwcubrEH0CdFhUpwFc0AAAAAElFTkSuQmCC' },
  obsidian: { name: '黑曜石 Obsidian', color: '#14101e', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEU7J1QnHj0QDBwGAwsAAAFbDTSxAAAAaUlEQVR42gVAARGAMAj8mUA3AzhYAOUJoED/TB68Ut/xNLiFb9wVhfPpaybePs3KHJ+sqmRCVpCNBbG9+ekJvySq3hPVZI7qgl56aBihTmPph+Cyu4ng3kJ2vRSHMoQ+8FGHLU9o5FwkfyEoFb7iY82bAAAAAElFTkSuQmCC' },
  diamond: { name: '钻石块 Diamond Block', color: '#4aedd9', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEX////V//ae/utw+/Bl9eNL7eY94OUVwsYOur1j/GYQAAAAeklEQVR42hXLsRHCMBAEwPsf5dw5JxB0QAfMQAnUSStEhIALsF8iBj3D5msXKIz5Lp/rLmza3kueFuzrAkfOhnjRp6C4GhzNlE8dS4DxdcFhYK9oLloaMhxgYw642+jATcX42G/Gvw+X5hpuvTLE5nlQNq29TOycFOcf/6MxqUgMRiYAAAAASUVORK5CYII=' },
  gold: { name: '金块 Gold Block', color: '#f6d13c', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAG1BMVEX+/73//ZD/7E/+4Ej/2D71zCf5vSPTljLMjidMMDrkAAAAeklEQVR42hXLsRHCMBAEwPsf5dw5JxB0QAfMQAnUSStEhIALsF8iBj3D5msXKIz5Lp/rLmza3kueFuzrAkfOhnjRp6C4GhzNlE8dS4DxdcFhYK9oLloaMhxgYw642+jATcX42G/Gvw+X5hpuvTLE5nlQNq29TOycFOcf/6MxqUgMRiYAAAAASUVORK5CYII=' },
  tnt: { name: 'TNT', color: '#d0342c', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAHlBMVEX////d2dnOzs6+srPqQxjbLxqRLRGxFSc3NlYbGjwg8AI1AAAATUlEQVR42mNwCYdAhtAyCMTHYBJUEhRSFBRgYOyY2KQp0anAIKyp1KGh2CjIwCQh2NihNMmQgVFTsUlTaaICgzEUMJSnQSA+k8vLIBAAaGUqJHBby+wAAAAASUVORK5CYII=' },
  iron: { name: '铁块 Iron Block', color: '#d8d8d8', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAIVBMVEXy8vLs7Ozq6urm5ubg4ODc3NzW1tbRz8/BwcG5ubmxsLCiWbjLAAAAUklEQVR42mOoaC8vL6/oaGdoYGAQFDI2tmBoNgYDS4aloaGhLm5pWSApRkGgCIqUi0saSIpRUNAYXSo0xAWmSxhNKgRiIFgGWaqjo6NzxsyZMwEQ+CRmFxowEQAAAABJRU5ErkJggg==' },
  coal: { name: '煤炭块 Coal Block', color: '#2a2a2a', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAD1BMVEUpKCgfHh4VFRUNDQ0FBQVHylqaAAAAYUlEQVR42h3MARECMRADwIACegpoUgX5U9CLf03MsAIWiz5XMSjltheUYUKi51s8bMSLioJDKhliSj0mcdneLzbuM7vYQexSVyBRuTKqZcUbuc+nvIjMfmf/5+qhAlM0Oz9ZChZ2KYB3/gAAAABJRU5ErkJggg==' },
  emerald: { name: '绿宝石块 Emerald Block', color: '#17dd62', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEWC9q1B84QX3WIXxUQarjUcmCkR/ex7AAAAaklEQVR42iXJyxXCMAxE0SGH7G2OXUCEstcvDQTTAfTfCop5q6sR/F9AgFKWrUPyfHl0qOJG1HK5pmhrQlDvvENFKjU+oCplQlQpIvKVGHzhlIdxO2DnyBIqi3vlHTZmHWZPI99WvL+zzw+IFhXpkE2SQAAAAABJRU5ErkJggg==' },
  lapis: { name: '青金石块 Lapis Block', color: '#1f4fa3', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAJ1BMVEU3Z5IxYYsmWasrVo0gUJwdSpUgSooeQoUeQHwcOJAbNYgZNYQUMnG/fqakAAAAkElEQVR42g3LsRGCQBAAwDOiAStABzrAWB2ewArMmT/wDZl7Dvv48xhjx6cBAyyBomTzhX2anjZlWYI51i0pOci2laUh9JDXNtQsPWQd+nDmBnbWeinaB2QF0SD4hBzFH6J8IBFm5HcDiXYta3SQj8EIjg4qmkQNr4tvcSR8gUHVKN7BFb2y0h0u8/z9TcvyBxxhOAXulRujAAAAAElFTkSuQmCC' },
  redstone: { name: '红石块 Redstone Block', color: '#a80909', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAD1BMVEXmIAi9IAikGAiUFABzDABFTPGwAAAAWklEQVR42l3FsWHDABDEMNx7/40jMYU7syD8NtOMNDrY7rsxs86ke2tss7r0MtsG+Ls6roA+Y24GKO/RG5DlJHkTcfiYe0wys1kTe5qNgfCemieWZMaXIAAA/7Y+Nw+vnOTbAAAAAElFTkSuQmCC' },
  netherite: { name: '下界合金块 Netherite Block', color: '#413735', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAHlBMVEVaV1pNSU1IRUhMQUNDQEM7OTs8MjIxKSovKCkkHh+pMMstAAAAg0lEQVR42g2KMQ6DMBAEjx9koYgoz8JClBY/cGz6IOyayqR1msgfiPyDyL/NTTXaWbqScKVCbxI6GuncGXZVInYFD15kMgb9tsjy4A7bTKezuCm9SHoCk5YPo2frJaFz1umZMoxzIUkaBn2E10h5V/6IVSSGWOv3TlkxGFiotF9pn9b+rZceswrqgj4AAAAASUVORK5CYII=' },
  quartz: { name: '石英块 Quartz Block', color: '#e5ddce', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEXy7+3u6ubu5t7q4tri3tDd2csPbMi3AAAAXklEQVR42i3BQRXCUBRDwftOsyfBATjAv5eeYqApBvhsmBF/mgfhe2yaMesgimnHiBJ/PKrNFRBr50k3rTIFxMQt0uS2A9Y6T7h7BCTwFsTXqjRJC1amZbz0yrog/AC3SiHCsw1aXQAAAABJRU5ErkJggg==' },
  bricks: { name: '砖块 Bricks', color: '#9b5a4e', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAG1BMVEV8RTaplI2ihn3GaFGxYk2LbmebVkOPUD9zPzGgdN/HAAAAbklEQVR42k2OQRLEIAzDRCBO/v/iHaelszkgLrLNOcq99zlH4RepgpKGkqB7dVfRHV1AZqzIzIyHWNf4w4TRCcpHQAlwDg4KPv/5LNzvHRq+O0o+hmDPOr1w7O2/e9Dbvx8GSPrPoQH7l3x+DNYPOiAEBGQstBIAAAAASUVORK5CYII=' },
  endstone: { name: '末地石 End Stone', color: '#dbdb9a', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEX2+r3u9rTe5qTV2pTNxovFvou4FkreAAAAd0lEQVR42g3L4RGDIAwG0E/bAQzRAWI6gAQYgAsuUNL9V6l/392DGtnh2VHEaZglCIcxqSBycxnLDr9Y93n9UGWxvYrD2Dd6JihGXjkYr+b6vYuAPnY4u6F15XI+MgutEiejJO6H64kk79ssb+hbmyapoUpRDYk/AkIVZmdrsdgAAAAASUVORK5CYII=' },
  ice: { name: '冰 Ice', color: '#7fb0f0', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEXI3P+81P+hw/+Suf6Ms/6Grv2h2aRBAAAABnRSTlO+vr6+vr6FYzTvAAAAZElEQVR42gWAARVCIQxF3/kRSKAsgdxRwI0CsvWv4lHfj5HT1Ew87KiAXN4iyIgsebh3JUr8dDBV5E4m6gxiDVcFO9+2FdC/hxZr92KXlp1r+NWkCxI93oEHstOYx0u7GeR3/AFJ3BzlwCBerwAAAABJRU5ErkJggg==' },
  mossy: { name: '苔石 Mossy Cobblestone', color: '#6e7a5a', data: PN + 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAIVBMVEW1tbWmpqaIh4h6j1VzhVJubW1ieUFabUFhYWFSXTlSUlICJfMUAAAAkElEQVR42gVAMQrCMBR9ujlaxNkGfyV7LiCUiGtA2qxWWrMqiBntYjs20sSsQu8pMEsbxHWzwjDnd8lbhVeqZaMjoSO7Iy8jpt69u23eYCHS8rfObkh8QtbRABadzo1qoT/SZ/I5IRzqE3sEA6ptHAu/Bw+hOvZpgiC0uJRMoTpzqSgStkQjK52B64r4bWfZH4v7LTO2BwrJAAAAAElFTkSuQmCC' },
};

const TOKENS = {
  '--dsw-alias-bg-base': { light: 'rgba(10,7,5,0.45)', dark: 'rgba(10,7,5,0.45)' },
  '--dsw-alias-bg-layer-1': { light: 'rgba(30,23,16,0.7)', dark: 'rgba(30,23,16,0.7)' },
  '--dsw-alias-bg-layer-2': { light: 'rgba(22,16,11,0.72)', dark: 'rgba(22,16,11,0.72)' },
  '--dsw-alias-bg-overlay': { light: 'rgba(12,9,6,0.97)', dark: 'rgba(12,9,6,0.97)' },
  '--dsw-alias-border-l1': { light: '#4a3a26', dark: '#4a3a26' },
  '--dsw-alias-border-l2': { light: '#6b5533', dark: '#6b5533' },
  '--dsw-alias-brand-primary': { light: '#5ab85a', dark: '#7ccd7c' },
  '--dsw-alias-label-primary': { light: '#f5f3ee', dark: '#f5f3ee' },
  '--dsw-alias-label-secondary': { light: '#e3dfd4', dark: '#e3dfd4' },
  '--dsw-alias-state-error-primary': { light: '#c0403f', dark: '#e0605f' },
  '--dsw-alias-state-success-primary': { light: '#3fbf3f', dark: '#6fd66f' },
  '--dsw-alias-state-warn-primary': { light: '#e0a83f', dark: '#f0c060' },
  '--dsw-specific-sidebar-fill': { light: 'rgba(16,11,8,0.55)', dark: 'rgba(16,11,8,0.55)' },
};

const CHROME = [
  '* { box-sizing: border-box; }',
    '* { font-family: "McPixel", "McCjk", "Courier New", "Lucida Console", Consolas, monospace !important; -webkit-font-smoothing: none; }',
  'svg, svg *, [class*="icon"], [class*="Icon"] { font-family: inherit !important; }',
  'body { text-shadow: 1px 1px 0 rgba(0,0,0,0.85); }',
  'img, canvas { image-rendering: pixelated; }',
  'svg, svg * { shape-rendering: crispEdges; }',
  'svg { filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.9)); }',
  '::selection { background: #3fbf3f; color: #0d0a07; }',
  '::-webkit-scrollbar { width: 14px; height: 14px; }',
  '::-webkit-scrollbar-track { background: rgba(20,14,9,0.65); border: 2px solid rgba(0,0,0,0.4); }',
  '::-webkit-scrollbar-thumb { background: #6e6e6e; border: 2px solid #262626; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.45); }',
  '::-webkit-scrollbar-thumb:hover { background: #808080; }',
  "button, [role='button'] { border-radius: 2px !important; border: 2px solid #262626 !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.5) !important; background: #6e6e6e !important; color: #f2f2f2 !important; cursor: pointer; }",
  "button:hover, [role='button']:hover { background: #7d7d7d !important; }",
  "button:active, [role='button']:active { background: #555555 !important; box-shadow: inset 2px 2px 0 rgba(0,0,0,0.5), inset -2px -2px 0 rgba(255,255,255,0.2) !important; }",
  'input, textarea, select { border-radius: 2px !important; border: 2px solid #262626 !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.12), inset -2px -2px 0 rgba(0,0,0,0.4) !important; background: rgba(20,15,10,0.85) !important; color: #f2f2f2 !important; caret-color: #7cf07c; }',
  "input[type='checkbox'], input[type='radio'] { box-shadow: none !important; accent-color: #3fbf3f; }",
  ':focus-visible { outline: 2px solid #f2f2f2 !important; outline-offset: 2px; }',
  "[class*='desc'], [class*='secondary'], [class*='muted'], [class*='subtle'], [class*='hint'], [class*='detail'] { color: #e6e2d8 !important; opacity: 1 !important; }",
  '@keyframes mc-float { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(-110vh) rotate(360deg); } }',
  '.mc-btn { background: #6e6e6e !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.5) !important; }',
  '.mc-btn:hover { background: #7d7d7d !important; }',
  ".mc-btn[data-active='1'] { background: #3f6e2f !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.45), 0 0 0 2px #7cf07c !important; }",
  '.mc-panel { background: rgba(14,10,7,0.92); border: 3px solid #262626; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.18), inset -3px -3px 0 rgba(0,0,0,0.5), 0 10px 28px rgba(0,0,0,0.65); border-radius: 2px; }',
  '.mc-close { background: #6e6e6e !important; }',
  '.mc-close:hover { background: #7d7d7d !important; }',
].join('\n');

const store = { open: false, tab: 'bg', texture: 'grass', bubble: 'none', bubbleSize: 32, input: 'none', inputSize: 32, bubbleTextColor: '#ffffff', inputTextColor: '#ffffff', particles: true, size: 128, custom: [], customCount: 0, renames: {}, hidden: [], order: [], manage: false, musicOpen: false, musicTrack: -1, musicPlaying: false, musicVolume: 0.7, customMusic: [], customMusicCount: 0 };
const listeners = [];
function setStore(patch) {
  Object.assign(store, patch);
  listeners.slice().forEach((fn) => fn());
    saveSettings();
}
function useStore() {
  const [snap, setSnap] = React.useState(Object.assign({}, store));
  React.useEffect(() => {
    const update = () => setSnap(Object.assign({}, store));
    listeners.push(update);
    return () => {
      const i = listeners.indexOf(update);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);
  return snap;
}

function getTex(id) {
  if (TEX[id]) return TEX[id];
  const c = (store.custom || []).filter((x) => x.id === id)[0];
  if (c) return c;
  return TEX.grass;
}

let texDisposer = null;
function applyTexture(id) {
  const t = getTex(id);
  if (!t) return;
  if (texDisposer) { texDisposer(); texDisposer = null; }
  const px = (store.size || 128) + 'px';
  texDisposer = styles.insert(
    'html{background-color:' + t.color + ' !important;background-image:url("' + t.data + '") !important;background-repeat:repeat !important;background-size:' + px + ' ' + px + ' !important;image-rendering:pixelated;}' +
    'body{background:transparent !important;}' +
    'body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-repeat:repeat;background-size:' + px + ' ' + px + ';image-rendering:pixelated;background-image:url("' + t.data + '");}' +
    'body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;box-shadow:inset 0 0 220px rgba(0,0,0,0.55);}'
  );
}

let bubbleDisposer = null;
function applyBubbleTexture(id) {
  if (bubbleDisposer) { bubbleDisposer(); bubbleDisposer = null; }
  // 'none' (or empty) means no bubble texture: remove any injected style so
  // the bubble falls back to DSH's default (transparent) background.
  if (!id || id === 'none') {
    const tc = store.bubbleTextColor || '#ffffff';
    bubbleDisposer = styles.insert("[class*='bubble'], [class*='bubble'] * { color: " + tc + " !important; }");
    return;
  }
  const t = getTex(id);
  if (!t) return;
  const px = (store.bubbleSize || 32) + 'px';
    const tc = store.bubbleTextColor || '#ffffff';
  // Texture only the actual bubble element itself (`gdEzaW_bubble` is the
  // user message bubble; class-substring match, no ancestor dependency). The
  // `background` shorthand + !important overrides DSH's
  // `.gdEzaW_bubble{background:var(--dsw-specific-bubble)}`. Never texture
  // the user row/stack containers — that bleeds a big rectangle behind the
  // bubble.
  bubbleDisposer = styles.insert(
    "[class*='bubble'] { background: " + t.color + " url('" + t.data + "') repeat !important; background-size:" + px + ' ' + px + " !important; image-rendering:pixelated !important; border: 2px solid #000 !important; border-radius: 4px !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.5) !important; color: " + tc + " !important; max-width: 100% !important; min-width: 0 !important; overflow-wrap: anywhere !important; word-break: break-word !important; box-sizing: border-box !important; }" +
    "[class*='bubble'] * { color: " + tc + " !important; max-width: 100% !important; min-width: 0 !important; overflow-wrap: anywhere !important; word-break: break-word !important; box-sizing: border-box !important; }" +
    "[class*='bubble'] pre, [class*='bubble'] code { white-space: pre-wrap !important; word-break: break-word !important; overflow-wrap: anywhere !important; overflow-x: hidden !important; }" +
    "[class*='bubble'] *:not(button):not(a) { background: transparent !important; border: none !important; box-shadow: none !important; }"
  );
}

let inputDisposer = null;
function applyInputTexture(id) {
  if (inputDisposer) { inputDisposer(); inputDisposer = null; }
  // 'none' (or empty) means no input texture: remove any injected style so
  // the composer input falls back to DSH's default background.
  if (!id || id === 'none') {
    const tc = store.inputTextColor || '#ffffff';
    inputDisposer = styles.insert("[data-composer-card] [data-input-scroll], [data-composer-card] [data-input-backdrop], [data-composer-card] textarea { color: " + tc + " !important; }");
    return;
  }
  const t = getTex(id);
  if (!t) return;
  const px = (store.inputSize || 32) + 'px';
    const tc = store.inputTextColor || '#ffffff';
  // Target only the actual input scroll area inside the composer seat, NOT the
  // whole composer card or the bottom panel. This keeps the texture limited to
  // the text input box itself.
  inputDisposer = styles.insert(
    "[data-composer-card] { background: " + t.color + " url('" + t.data + "') repeat !important; background-size:" + px + ' ' + px + " !important; image-rendering: pixelated !important; border: 2px solid #000 !important; border-radius: 4px !important; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.35), inset -2px -2px 0 rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.5) !important; }" +
    "[data-composer-card] [data-input-scroll], [data-composer-card] [data-input-backdrop], [data-composer-card] textarea { background: transparent !important; color: " + tc + " !important; caret-color: #7cf07c !important; }" +
    "[data-composer-card] *:not(button):not(a) { background: transparent !important; border: none !important; box-shadow: none !important; }"
  );
}


function swatchData(data, color) {
  return { backgroundImage: 'url("' + data + '")', backgroundSize: '100% 100%', imageRendering: 'pixelated', backgroundColor: color || '#555' };
}

/**
 * The full ordered texture catalog: built-in blocks (respecting hidden/renames)
 * plus imported customs, in saved order. Shared by the background texture list,
 * the bubble texture row, and the manager so every surface sees the same set.
 */
function textureItems() {
  const hidden = store.hidden || [];
  const renames = store.renames || {};
  const order = store.order || [];
  const builtins = Object.keys(TEX)
    .filter((id) => hidden.indexOf(id) < 0)
    .map((id) => ({ id: id, name: renames[id] || TEX[id].name, data: TEX[id].data, color: TEX[id].color, builtin: true }));
  const customs = (store.custom || []).map((c) => Object.assign({}, c, { builtin: false }));
  let items = builtins.concat(customs);
  if (order.length) {
    const byId = {};
    items.forEach((it) => { byId[it.id] = it; });
    items = order.map((id) => byId[id]).filter(Boolean).concat(items.filter((it) => order.indexOf(it.id) < 0));
  }
  return items;
}

function saveCustom() {
  try {
    mcRpc('save-custom-textures', { custom: store.custom, customCount: store.customCount, renames: store.renames || {}, hidden: store.hidden || [], order: store.order || [] }).catch(() => {});
  } catch (e) { /* ignore */ }
}
function saveSettings() {
  try {
    mcRpc('save-settings', {
      texture: store.texture,
      bubble: store.bubble,
      input: store.input,
      size: store.size,
      bubbleSize: store.bubbleSize,
      inputSize: store.inputSize,
      bubbleTextColor: store.bubbleTextColor || '#ffffff',
      inputTextColor: store.inputTextColor || '#ffffff',
      particles: store.particles,
    }).catch(() => {});
  } catch (e) { /* ignore */ }
}
const MCDN = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.16.5/assets/minecraft/sounds/';
const MUSIC = [
  { id: 'menu1', name: '菜单 1 · Minecraft（主菜单主题曲）', url: MCDN + 'music/menu/menu1.ogg' },
  { id: 'menu2', name: '菜单 2 · Clark', url: MCDN + 'music/menu/menu2.ogg' },
  { id: 'menu3', name: '菜单 3 · Sweden', url: MCDN + 'music/menu/menu3.ogg' },
  { id: 'menu4', name: '菜单 4 · Danny', url: MCDN + 'music/menu/menu4.ogg' },
  { id: 'calm1', name: '平静 1 · Minecraft', url: MCDN + 'music/game/calm1.ogg' },
  { id: 'calm2', name: '平静 2 · Clark', url: MCDN + 'music/game/calm2.ogg' },
  { id: 'calm3', name: '平静 3 · Sweden', url: MCDN + 'music/game/calm3.ogg' },
  { id: 'hal1', name: '轻柔 1 · Subwoofer Lullaby', url: MCDN + 'music/game/hal1.ogg' },
  { id: 'hal2', name: '轻柔 2 · Living Mice', url: MCDN + 'music/game/hal2.ogg' },
  { id: 'hal3', name: '轻柔 3 · Haggstrom', url: MCDN + 'music/game/hal3.ogg' },
  { id: 'hal4', name: '轻柔 4 · Danny', url: MCDN + 'music/game/hal4.ogg' },
  { id: 'nuance1', name: '氛围 1 · Key', url: MCDN + 'music/game/nuance1.ogg' },
  { id: 'nuance2', name: '氛围 2 · Oxygène', url: MCDN + 'music/game/nuance2.ogg' },
  { id: 'piano1', name: '钢琴 1 · Dry Hands', url: MCDN + 'music/game/piano1.ogg' },
  { id: 'piano2', name: '钢琴 2 · Wet Hands', url: MCDN + 'music/game/piano2.ogg' },
  { id: 'piano3', name: '钢琴 3 · Mice on Venus', url: MCDN + 'music/game/piano3.ogg' },
];
let musicAudio = null;
let musicIdx = -1;
let musicFallbacking = false;
const musicCache = {};
function cachePut(id, data) {
  musicCache[id] = data;
  const keys = Object.keys(musicCache);
  if (keys.length > 6) delete musicCache[keys[0]];
}
function getTracks() {
  const c = store.customMusic || [];
  const customs = c.map((m) => ({ id: m.id, name: m.name, data: m.data, custom: true }));
  return MUSIC.concat(customs);
}
function getMusicAudio() {
  if (musicAudio || typeof Audio === 'undefined') return musicAudio;
  try {
    musicAudio = new Audio();
    musicAudio.volume = store.musicVolume || 0.7;
    musicAudio.addEventListener('ended', () => {
      const list = getTracks();
      if (musicIdx >= 0 && list.length) playMusicTrack((musicIdx + 1) % list.length);
    });
    musicAudio.addEventListener('error', () => {
      if (musicIdx >= 0) { try { musicAudio.pause(); } catch (e) { /* ignore */ } setStore({ musicPlaying: false }); }
    });
  } catch (e) { musicAudio = null; }
  return musicAudio;
}
function ensureTrackLoaded(t) {
  if (t.data) return Promise.resolve(t.data);
  if (musicCache[t.id]) return Promise.resolve(musicCache[t.id]);
  const p = t.path ? mcRpc('get-music-file', { path: t.path }) : mcRpc('get-music-track', { name: t.id });
  return p.then((res) => {
    if (res && res.data) { cachePut(t.id, res.data); return res.data; }
    throw new Error('曲目不可用');
  });
}
function prefetchTrack(i) {
  try {
    const list = getTracks();
    const t = list[i];
    if (!t || t.data || musicCache[t.id]) return;
    const p = t.path ? mcRpc('get-music-file', { path: t.path }) : mcRpc('get-music-track', { name: t.id });
    p.then((res) => {
      if (res && res.data) cachePut(t.id, res.data);
    }).catch(() => {});
  } catch (e) { /* ignore */ }
}
function playMusicTrack(i) {
  const list = getTracks();
  const t = list[i];
  const a = getMusicAudio();
  if (!t || !a) return;
  musicIdx = i;
  musicFallbacking = false;
  setStore({ musicTrack: i, musicPlaying: true });
  ensureTrackLoaded(t).then((uri) => {
    if (musicIdx !== i) return;
    try {
      if (a.src !== uri) { a.src = uri; }
      a.load();
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* ignore */ }
  }).catch(() => {
    if (musicIdx !== i) return;
    try {
      a.src = t.url;
      a.load();
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* ignore */ }
  });
  if (list.length > 1) prefetchTrack((i + 1) % list.length);
}
function toggleMusic() {
  const a = getMusicAudio();
  if (!a) return;
  if (a.paused) {
    const list = getTracks();
    if (musicIdx < 0 || !a.src) { playMusicTrack(store.musicTrack >= 0 && store.musicTrack < list.length ? store.musicTrack : 0); return; }
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    setStore({ musicPlaying: true });
  } else {
    a.pause();
    setStore({ musicPlaying: false });
  }
}
function musicVolume(v) {
  const a = getMusicAudio();
  setStore({ musicVolume: v });
  if (a) { try { a.volume = v; } catch (e) { /* ignore */ } }
}
function removeCustomMusic(id) {
  const gone = (store.customMusic || []).filter((m) => m.id === id);
  gone.forEach((m) => { try { if (typeof URL !== 'undefined' && URL.revokeObjectURL) URL.revokeObjectURL(m.data); } catch (e) { /* ignore */ } });
  setStore({ customMusic: (store.customMusic || []).filter((m) => m.id !== id) });
  const list = getTracks();
  if (musicIdx >= 0 && list[musicIdx] && list[musicIdx].id === id) {
    musicIdx = -1;
    const a = getMusicAudio();
    if (a) { try { a.pause(); a.src = ''; } catch (e) { /* ignore */ } }
    setStore({ musicPlaying: false, musicTrack: -1 });
  }
}
function TextureButton() {
  const snap = useStore();
  const t = getTex(snap.texture);
  return React.createElement('button', {
    onClick: () => setStore({ open: !snap.open }),
    title: '切换 Minecraft 方块纹理',
    'aria-label': '切换 Minecraft 方块纹理',
    style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', lineHeight: 1 },
  },
    React.createElement('span', {
      style: Object.assign({ display: 'inline-block', width: 18, height: 18, border: '2px solid #262626', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.45)' }, swatchData(t.data, t.color)),
    })
  );
}

function Particles() {
  const snap = useStore();
  const colors = ['#5f9e3e', '#966c4a', '#dbd3a0', '#7d7d7d', '#b08d57', '#14101e', '#4aedd9', '#f6d13c'];
  const [blocks] = React.useState(() => Array.from({ length: 20 }, (_, i) => ({
    left: (i * 53) % 97,
    size: 4 + ((i * 7) % 6),
    delay: (i * 1.3) % 14,
    dur: 13 + ((i * 5) % 11),
    color: colors[i % colors.length],
  })));
  if (!snap.particles) return null;
  return React.createElement('div', { style: { position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' } },
    blocks.map((b, i) => React.createElement('span', {
      key: i,
      style: {
        position: 'absolute', left: b.left + '%', bottom: '-24px', width: b.size, height: b.size,
        background: b.color, border: '1px solid rgba(0,0,0,0.4)', opacity: 0.3,
        animation: 'mc-float ' + b.dur + 's linear ' + b.delay + 's infinite',
      },
    }))
  );
}

function ImportBox({ target }) {
  const [val, setVal] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const isBg = target === 'bg';
  const doImportData = (data) => {
    const n = (store.customCount || 0) + 1;
    const id = 'custom-' + n;
    const item = { id: id, name: '导入纹理 ' + n, data: data, color: '#888' };
    setStore({ customCount: n, custom: store.custom.concat([item]) });
    if (isBg) { setStore({ texture: id }); applyTexture(id); }
    else if (target === 'bubble') { setStore({ bubble: id }); applyBubbleTexture(id); }
    else { setStore({ input: id }); applyInputTexture(id); }
    saveCustom();
    setVal('');
  };
  const doImport = async () => {
    const input = val.trim();
    if (!input) { setMsg('请输入内容'); return; }
    let data = null;
    if (input.indexOf('data:') === 0) {
      data = input;
    } else {
      try {
        const res = await mcRpc('import-texture', { path: input });
        if (res && res.data) data = res.data;
        else { setMsg('导入失败: ' + String((res && res.error) || '未知错误')); return; }
      } catch (e) {
        setMsg('导入失败: ' + String((e && e.message) || e));
        return;
      }
    }
    doImportData(data);
  };
  const onPaste = (e) => {
    try {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type && it.type.indexOf('image/') === 0) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = () => { if (reader.result) doImportData(String(reader.result)); };
            reader.onerror = () => { setMsg('读取剪贴板图片失败'); };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    } catch (err) { /* ignore */ }
  };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) {
        const file = files[0];
        if (file.type && file.type.indexOf('image/') === 0) {
          const reader = new FileReader();
          reader.onload = () => { if (reader.result) doImportData(String(reader.result)); };
          reader.onerror = () => { setMsg('读取图片失败'); };
          reader.readAsDataURL(file);
        } else {
          setMsg('请拖入图片文件');
        }
      }
    } catch (err) { /* ignore */ }
  };
  return React.createElement('div', {
    style: { marginTop: 14, border: '2px dashed ' + (dragOver ? '#7cf07c' : 'rgba(124,240,124,0.3)'), borderRadius: 4, padding: 10, background: dragOver ? 'rgba(63,190,63,0.14)' : 'rgba(0,0,0,0.2)' },
    onPaste: onPaste,
    onDragOver: onDragOver,
    onDragLeave: onDragLeave,
    onDrop: onDrop,
  },
    React.createElement('div', { style: { color: '#f2f2f2', fontSize: 13, marginBottom: 6 } }, '导入纹理:'),
    React.createElement('div', { style: { color: '#9a948a', fontSize: 12, marginBottom: 6 } }, '支持 粘贴图片（Ctrl+V）或 拖入图片文件，也可输入图片路径 / data URI'),
    React.createElement('textarea', {
      value: val,
      onChange: (e) => setVal(e.target.value),
      placeholder: '输入本地图片路径（如 D:/a.png）或 data URI',
      rows: 2,
      style: { width: '100%', padding: 6, fontSize: 12, resize: 'vertical' },
    }),
    React.createElement('button', { className: 'mc-btn', onClick: doImport, style: { marginTop: 6, padding: '4px 12px', fontSize: 12 } }, '导入并应用'),
    msg ? React.createElement('div', { style: { marginTop: 4, fontSize: 12, color: '#7cf07c' } }, msg) : null
  );
}

function CustomList({ target }) {
  const snap = useStore();
  const [editId, setEditId] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');
  const manage = !!snap.manage;
  const isBg = target === 'bg';
  const activeOf = (c) => (isBg ? snap.texture : target === 'bubble' ? snap.bubble : snap.input) === c.id ? '1' : '0';
  const applyTo = (c) => {
    if (isBg) { setStore({ texture: c.id }); applyTexture(c.id); }
    else if (target === 'bubble') { setStore({ bubble: c.id }); applyBubbleTexture(c.id); }
      else { setStore({ input: c.id }); applyInputTexture(c.id); }
  };
  const fallback = () => {
    if (isBg) { setStore({ texture: 'grass' }); applyTexture('grass'); }
    else if (target === 'bubble') { setStore({ bubble: 'none' }); applyBubbleTexture('none'); }
      else { setStore({ input: 'none' }); applyInputTexture('none'); }
  };
  const commitRename = (c) => {
    const name = String(editVal || '').trim();
    if (name) {
      if (c.builtin) {
        const renames = Object.assign({}, store.renames || {});
        renames[c.id] = name;
        setStore({ renames: renames });
      } else {
        setStore({ custom: store.custom.map((x) => x.id === c.id ? Object.assign({}, x, { name: name }) : x) });
      }
    }
    setEditId(null);
    saveCustom();
  };
  const doDelete = (c) => {
    if (c.builtin) {
      const hidden = (store.hidden || []).slice();
      if (hidden.indexOf(c.id) < 0) hidden.push(c.id);
      setStore({ hidden: hidden });
      if (snap.texture === c.id) { setStore({ texture: 'grass' }); applyTexture('grass'); }
      if (snap.bubble === c.id) { setStore({ bubble: 'none' }); applyBubbleTexture('none'); }
      if (snap.input === c.id) { setStore({ input: 'none' }); applyInputTexture('none'); }
    } else {
      setStore({ custom: store.custom.filter((x) => x.id !== c.id) });
      if (snap.texture === c.id) { setStore({ texture: 'grass' }); applyTexture('grass'); }
      if (snap.bubble === c.id) { setStore({ bubble: 'none' }); applyBubbleTexture('none'); }
      if (snap.input === c.id) { setStore({ input: 'none' }); applyInputTexture('none'); }
    }
    saveCustom();
  };
  const items = textureItems();
  const hidden = store.hidden || [];
  const moveItem = (c, dir) => {
    const ids = items.map((x) => x.id);
    const i = ids.indexOf(c.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = ids.slice();
    const t = next[i]; next[i] = next[j]; next[j] = t;
    setStore({ order: next });
    saveCustom();
  };
  const restoreBuiltins = () => {
    setStore({ hidden: [] });
    saveCustom();
  };
  return React.createElement('div', { style: { marginTop: 14 } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } },
      React.createElement('div', { style: { color: '#f2f2f2', fontSize: 13 } }, '我的纹理:'),
      React.createElement('div', { style: { display: 'flex', gap: 6 } },
        hidden.length ? React.createElement('button', { key: 'restore', className: 'mc-btn', onClick: restoreBuiltins, style: { padding: '1px 8px', fontSize: 12 } }, '恢复已删除') : null,
        React.createElement('button', { key: 'manage', className: 'mc-btn', 'data-active': manage ? '1' : '0', onClick: () => setStore({ manage: !manage }), style: { padding: '1px 8px', fontSize: 12 } }, manage ? '完成' : '管理')
      )
    ),
    items.map((c) => React.createElement('div', { key: c.id, style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } },
      React.createElement('span', { style: Object.assign({ width: 24, height: 24, border: '2px solid #262626', flexShrink: 0 }, swatchData(c.data, c.color)) }),
      editId === c.id
        ? React.createElement('input', {
            value: editVal,
            autoFocus: true,
            onChange: (e) => setEditVal(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Enter') commitRename(c); if (e.key === 'Escape') setEditId(null); },
            onBlur: () => commitRename(c),
            style: { flex: 1, minWidth: 0, padding: '2px 6px', fontSize: 12 },
          })
        : React.createElement('span', { style: { color: '#e6e2d8', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, c.name),
      React.createElement('button', { className: 'mc-btn', 'data-active': activeOf(c), onClick: () => applyTo(c), style: { padding: '1px 8px', fontSize: 12 } }, '应用'),
      manage ? React.createElement('button', { className: 'mc-btn', onClick: () => { if (editId === c.id) { commitRename(c); } else { setEditId(c.id); setEditVal(c.name); } }, style: { padding: '1px 8px', fontSize: 12 } }, '改名') : null,
      manage ? React.createElement('button', { className: 'mc-close', onClick: () => doDelete(c), style: { padding: '1px 8px', fontSize: 12 } }, '删除') : null,
      manage ? React.createElement('button', { className: 'mc-btn', onClick: () => moveItem(c, -1), style: { padding: '1px 8px', fontSize: 12 } }, '↑') : null,
      manage ? React.createElement('button', { className: 'mc-btn', onClick: () => moveItem(c, 1), style: { padding: '1px 8px', fontSize: 12 } }, '↓') : null
    ))
  );
}
function MusicButton() {
  const snap = useStore();
  return React.createElement('button', {
    onClick: () => setStore({ musicOpen: !snap.musicOpen }),
    title: 'Minecraft 音乐',
    'aria-label': 'Minecraft 音乐',
    style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', lineHeight: 1 },
  },
    React.createElement('span', {
      style: { display: 'inline-block', width: 18, height: 18, border: '2px solid #262626', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.45)', background: snap.musicPlaying ? '#3f6e2f' : '#6e6e6e', color: '#f2f2f2', fontSize: 11, lineHeight: '14px', textAlign: 'center' },
    }, snap.musicPlaying ? '♪' : '♫')
  );
}

function MusicProgress() {
  const [cur, setCur] = React.useState(0);
  const [dur, setDur] = React.useState(0);
  React.useEffect(() => {
    const a = getMusicAudio();
    if (!a) return;
    const up = () => { try { setCur(a.currentTime || 0); setDur(a.duration || 0); } catch (e) { /* ignore */ } };
    const meta = () => { try { setDur(a.duration || 0); } catch (e) { /* ignore */ } };
    a.addEventListener('timeupdate', up);
    a.addEventListener('loadedmetadata', meta);
    a.addEventListener('durationchange', meta);
    return () => {
      a.removeEventListener('timeupdate', up);
      a.removeEventListener('loadedmetadata', meta);
      a.removeEventListener('durationchange', meta);
    };
  }, []);
  const fmt = (s) => { s = Math.floor(s || 0); const m = Math.floor(s / 60); const r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; };
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
    React.createElement('span', { style: { color: '#9a948a', fontSize: 11, width: 38, textAlign: 'right' } }, fmt(cur)),
    React.createElement('input', {
      type: 'range', min: 0, max: dur || 0, step: 0.1, value: Math.min(cur, dur || 0),
      onChange: (e) => { const a = getMusicAudio(); if (a) { try { a.currentTime = Number(e.target.value); setCur(Number(e.target.value)); } catch (err) { /* ignore */ } } },
      style: { flex: 1, accentColor: '#3fbf3f' },
    }),
    React.createElement('span', { style: { color: '#9a948a', fontSize: 11, width: 38 } }, fmt(dur))
  );
}

function MusicPanel() {
  const snap = useStore();
  const [importMsg, setImportMsg] = React.useState('');
  const fileRef = React.useRef(null);
  const cur = snap.musicTrack;
  const list = getTracks();
  const defaults = MUSIC.map((t, i) => Object.assign({}, t, { i: i }));
  const customs = (snap.customMusic || []).map((m, k) => ({ id: m.id, name: m.name, data: m.data, custom: true, i: MUSIC.length + k }));
  React.useEffect(() => {
    if (snap.musicOpen && list.length) {
      prefetchTrack(cur >= 0 && cur < list.length ? cur : 0);
      prefetchTrack(cur >= 0 && cur < list.length ? (cur + 1) % list.length : 1);
    }
  }, [snap.musicOpen]);
  if (!snap.musicOpen) return null;
  const pickFolder = async () => {
    try {
      const hasApi = typeof window !== 'undefined' && window.showDirectoryPicker;
      if (!hasApi) { if (fileRef.current) fileRef.current.click(); return; }
      let dirHandle = null;
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      } catch (err) {
        if (String((err && err.name) || '') === 'AbortError') return;
        if (fileRef.current) fileRef.current.click();
        return;
      }
      const items = [];
      const base = store.customMusicCount || 0;
      try {
        for await (const entry of dirHandle.values()) {
          if (!entry || entry.kind !== 'file') continue;
          if (!/\.(ogg|mp3|wav|flac|m4a|aac|opus)$/i.test(entry.name || '')) continue;
          try {
            const file = await entry.getFile();
            items.push({ id: 'user-music-' + (base + items.length + 1), name: entry.name, data: URL.createObjectURL(file) });
          } catch (err2) { /* skip */ }
        }
      } catch (err3) {
        if (fileRef.current) fileRef.current.click();
        return;
      }
      if (items.length) {
        setStore({ customMusicCount: base + items.length, customMusic: (store.customMusic || []).concat(items) });
        setImportMsg('已导入 ' + items.length + ' 首本地音乐');
      } else {
        setImportMsg('所选文件夹中没有音频文件');
      }
    } catch (e) { /* ignore */ }
  };
  const onFiles = (e) => {
    const files = Array.prototype.slice.call((e.target && e.target.files) || []);
    if (e.target) e.target.value = '';
    if (!files.length) return;
    const audio = files.filter((f) => /^audio\/|\.(ogg|mp3|wav|flac|m4a|aac|opus)$/i.test((f.type || '') + ' ' + (f.name || '')));
    if (!audio.length) { setImportMsg('所选文件中没有音频'); return; }
    if (typeof URL === 'undefined' || !URL.createObjectURL) { setImportMsg('当前环境不支持本地播放'); return; }
    const items = [];
    audio.forEach((f) => {
      try {
        const base = (store.customMusicCount || 0) + items.length + 1;
        items.push({ id: 'user-music-' + base, name: f.name, data: URL.createObjectURL(f) });
      } catch (err) { /* ignore */ }
    });
    if (items.length) {
      setStore({ customMusicCount: (store.customMusicCount || 0) + items.length, customMusic: (store.customMusic || []).concat(items) });
    }
    setImportMsg('已导入 ' + items.length + ' 首本地音乐');
  };
  const row = (t, i) => React.createElement('div', {
    key: t.id,
    onClick: () => playMusicTrack(i),
    style: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', marginBottom: 4, borderRadius: 2, cursor: 'pointer', background: cur === i ? 'rgba(63,190,63,0.25)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (cur === i ? 'rgba(124,240,124,0.6)' : 'rgba(0,0,0,0.35)') },
  },
    React.createElement('span', { style: { width: 16, textAlign: 'center', color: cur === i ? '#7cf07c' : '#9a948a', fontSize: 12 } }, cur === i ? (snap.musicPlaying ? '▶' : '❚❚') : '♪'),
    React.createElement('span', { style: { color: '#e6e2d8', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (t.custom ? '📁 ' : '') + t.name),
    t.custom ? React.createElement('button', { className: 'mc-close', onClick: (e) => { e.stopPropagation(); removeCustomMusic(t.id); }, style: { padding: '0px 6px', fontSize: 11 } }, '✕') : null
  );
  return React.createElement('div', {
    style: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', pointerEvents: 'auto' },
    onClick: () => setStore({ musicOpen: false }),
  },
    React.createElement('div', {
      className: 'mc-panel',
      onClick: (e) => e.stopPropagation(),
      style: { width: 480, maxWidth: '94vw', maxHeight: '86vh', overflowY: 'auto', padding: 16 },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#f2f2f2', fontSize: 16, fontWeight: 'bold' } },
        React.createElement('span', null, '♪ Minecraft 音乐'),
        React.createElement('button', { className: 'mc-close', onClick: () => setStore({ musicOpen: false }), style: { padding: '2px 10px' } }, '✕')
      ),
      React.createElement(MusicProgress, null),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
        React.createElement('button', { className: 'mc-btn', onClick: () => playMusicTrack(cur < 0 ? 0 : (cur - 1 + list.length) % list.length), style: { padding: '4px 12px' } }, '⏮'),
        React.createElement('button', { className: 'mc-btn', 'data-active': snap.musicPlaying ? '1' : '0', onClick: toggleMusic, style: { padding: '4px 16px', fontSize: 14 } }, snap.musicPlaying ? '⏸ 暂停' : '▶ 播放'),
        React.createElement('button', { className: 'mc-btn', onClick: () => playMusicTrack(cur < 0 ? 0 : (cur + 1) % list.length), style: { padding: '4px 12px' } }, '⏭'),
        React.createElement('input', {
          type: 'range', min: 0, max: 100, value: Math.round((snap.musicVolume || 0.7) * 100),
          onChange: (e) => musicVolume(Number(e.target.value) / 100),
          style: { flex: 1, accentColor: '#3fbf3f' },
        })
      ),
      React.createElement('div', { style: { marginBottom: 8, padding: 8, border: '2px dashed rgba(124,240,124,0.3)', borderRadius: 4 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          React.createElement('button', { className: 'mc-btn', onClick: pickFolder, style: { padding: '4px 10px', fontSize: 12 } }, '选择文件夹'),
          React.createElement('input', { ref: fileRef, type: 'file', webkitdirectory: '', multiple: true, accept: 'audio/*', style: { display: 'none' }, onChange: onFiles })
        )
      ),
      importMsg ? React.createElement('div', { style: { color: '#7cf07c', fontSize: 12, marginBottom: 8 } }, importMsg) : null,
      React.createElement('div', { style: { color: '#f2f2f2', fontSize: 13, marginBottom: 6 } }, '曲目:'),
      React.createElement('div', { style: { color: '#7cf07c', fontSize: 12, marginTop: 8, marginBottom: 4 } }, '◆ 默认音乐'),
      defaults.map((t) => row(t, t.i)),
      customs.length ? React.createElement('div', { style: { color: '#f6d13c', fontSize: 12, marginTop: 10, marginBottom: 4 } }, '◆ 本地音乐') : null,
      customs.map((t) => row(t, t.i))
    )
  );
}
function TexturePicker() {
  const snap = useStore();
  if (!snap.open) return null;
  const sizes = [64, 96, 128, 192, 256];
  const bubbleSizes = [16, 24, 32, 48, 64];
  const inputSizes = [16, 24, 32, 48, 64];
  const isBg = snap.tab === 'bg';
  const isInput = snap.tab === 'input';
  const applyBgSize = (v) => { const n = Math.max(8, Math.min(1024, Math.round(Number(v) || 0))); setStore({ size: n }); applyTexture(store.texture); };
  const applyBubbleSize = (v) => { const n = Math.max(4, Math.min(256, Math.round(Number(v) || 0))); setStore({ bubbleSize: n }); applyBubbleTexture(store.bubble); };
  const applyInputSize = (v) => { const n = Math.max(4, Math.min(256, Math.round(Number(v) || 0))); setStore({ inputSize: n }); applyInputTexture(store.input); };
  return React.createElement('div', {
    style: { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', pointerEvents: 'auto' },
    onClick: () => setStore({ open: false }),
  },
    React.createElement('div', {
      className: 'mc-panel',
      onClick: (e) => e.stopPropagation(),
      style: { width: 520, maxWidth: '94vw', maxHeight: '86vh', overflowY: 'auto', padding: 16 },
    },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#f2f2f2', fontSize: 16, fontWeight: 'bold' } },
        React.createElement('span', null, '⛏ Minecraft 方块纹理'),
        React.createElement('button', { className: 'mc-close', onClick: () => setStore({ open: false }), style: { padding: '2px 10px' } }, '✕')
      ),
      React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: 14 } },
        React.createElement('button', { className: 'mc-btn', 'data-active': isBg ? '1' : '0', onClick: () => setStore({ tab: 'bg' }), style: { padding: '4px 14px', fontSize: 13 } }, '背景纹理'),
        React.createElement('button', { className: 'mc-btn', 'data-active': isBg ? '0' : isInput ? '0' : '1', onClick: () => setStore({ tab: 'bubble' }), style: { padding: '4px 14px', fontSize: 13 } }, '气泡纹理'),
        React.createElement('button', { className: 'mc-btn', 'data-active': isInput ? '1' : '0', onClick: () => setStore({ tab: 'input' }), style: { padding: '4px 14px', fontSize: 13 } }, '输入框纹理')
      ),
      isBg
        ? React.createElement('div', null,
            React.createElement('div', { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f2f2f2', fontSize: 13, flexWrap: 'wrap' } },
              React.createElement('span', { style: { marginRight: 4 } }, '纹理大小:'),
              sizes.map((s) => React.createElement('button', {
                key: s,
                className: 'mc-btn',
                'data-active': snap.size === s ? '1' : '0',
                onClick: () => applyBgSize(s),
                style: { padding: '2px 8px', fontSize: 12 },
              }, String(s) + 'px')),
              React.createElement('input', {
                type: 'number', min: 8, max: 1024, step: 8, value: snap.size,
                onChange: (e) => applyBgSize(e.target.value),
                title: '自定义背景纹理大小（8–1024px）',
                style: { width: 76, padding: '2px 6px', fontSize: 12 },
              }),
              React.createElement('span', { style: { color: '#9a948a', fontSize: 11 } }, 'px')
            ),
            React.createElement(CustomList, { target: 'bg' }),
            React.createElement(ImportBox, { target: 'bg' })
          )
        : snap.tab === 'bubble' ? React.createElement('div', null,
            React.createElement('div', { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f2f2f2', fontSize: 13, flexWrap: 'wrap' } },
              React.createElement('span', { style: { marginRight: 4 } }, '纹理大小:'),
              bubbleSizes.map((s) => React.createElement('button', {
                key: s,
                className: 'mc-btn',
                'data-active': snap.bubbleSize === s ? '1' : '0',
                onClick: () => applyBubbleSize(s),
                style: { padding: '2px 8px', fontSize: 12 },
              }, String(s) + 'px')),
              React.createElement('input', {
                type: 'number', min: 4, max: 256, step: 4, value: snap.bubbleSize,
                onChange: (e) => applyBubbleSize(e.target.value),
                title: '自定义气泡纹理大小（4–256px）',
                style: { width: 76, padding: '2px 6px', fontSize: 12 },
              }),
              React.createElement('span', { style: { color: '#9a948a', fontSize: 11 } }, 'px')
            ),
              React.createElement('div', { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f2f2f2', fontSize: 13 } },
                React.createElement('span', { style: { marginRight: 4 } }, '文字颜色:'),
                React.createElement('input', { type: 'color', value: snap.bubbleTextColor, onChange: (e) => { setStore({ bubbleTextColor: e.target.value }); applyBubbleTexture(store.bubble); }, style: { width: 40, height: 28, padding: 0, border: '2px solid #000' } })
              ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('button', { className: 'mc-btn', 'data-active': snap.bubble === 'none' ? '1' : '0', onClick: () => { setStore({ bubble: 'none' }); applyBubbleTexture('none'); }, style: { padding: '4px 12px', fontSize: 12 } }, '不使用气泡纹理')
            ),
            React.createElement(CustomList, { target: 'bubble' }),
            React.createElement(ImportBox, { target: 'bubble' })
          )
          : React.createElement('div', null,
            React.createElement('div', { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f2f2f2', fontSize: 13, flexWrap: 'wrap' } },
              React.createElement('span', { style: { marginRight: 4 } }, '纹理大小:'),
              inputSizes.map((s) => React.createElement('button', {
                key: s,
                className: 'mc-btn',
                'data-active': snap.inputSize === s ? '1' : '0',
                onClick: () => applyInputSize(s),
                style: { padding: '2px 8px', fontSize: 12 },
              }, String(s) + 'px')),
              React.createElement('input', {
                type: 'number', min: 4, max: 256, step: 4, value: snap.inputSize,
                onChange: (e) => applyInputSize(e.target.value),
                title: '自定义输入框纹理大小（4–256px）',
                style: { width: 76, padding: '2px 6px', fontSize: 12 },
              }),
              React.createElement('span', { style: { color: '#9a948a', fontSize: 11 } }, 'px')
            ),
              React.createElement('div', { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#f2f2f2', fontSize: 13 } },
                React.createElement('span', { style: { marginRight: 4 } }, '文字颜色:'),
                React.createElement('input', { type: 'color', value: snap.inputTextColor, onChange: (e) => { setStore({ inputTextColor: e.target.value }); applyInputTexture(store.input); }, style: { width: 40, height: 28, padding: 0, border: '2px solid #000' } })
              ),
            React.createElement('div', { style: { marginBottom: 12 } },
              React.createElement('button', { className: 'mc-btn', 'data-active': snap.input === 'none' ? '1' : '0', onClick: () => { setStore({ input: 'none' }); applyInputTexture('none'); }, style: { padding: '4px 12px', fontSize: 12 } }, '不使用输入框纹理')
            ),
            React.createElement(CustomList, { target: 'input' }),
            React.createElement(ImportBox, { target: 'input' })
          ),
      React.createElement('div', { style: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#f2f2f2', fontSize: 13 } },
        React.createElement('input', { type: 'checkbox', id: 'mc-particles', checked: snap.particles, onChange: (e) => setStore({ particles: e.target.checked }) }),
        React.createElement('label', { htmlFor: 'mc-particles', style: { cursor: 'pointer' } }, '漂浮方块粒子（装饰元素）')
      ),
    )
  );
}

module.exports.default = {
  name: '@superls-x/dsh-minecraft-theme',
  inject: ['theme', 'slots'],
  apply(ctx) {
    const theme = ctx.get('theme');
    if (theme !== undefined) {
      ctx.effect(() => theme.overrideTokens('minecraft-theme', TOKENS));
    }
    ctx.effect(() => styles.insert(CHROME));
    ctx.effect(() => () => {
      if (texDisposer) { try { texDisposer(); } catch (e) { /* ignore */ } texDisposer = null; }
      if (bubbleDisposer) { try { bubbleDisposer(); } catch (e) { /* ignore */ } bubbleDisposer = null; }
      if (inputDisposer) { try { inputDisposer(); } catch (e) { /* ignore */ } inputDisposer = null; }
      styles.dispose();
      if (musicAudio) { try { musicAudio.pause(); musicAudio.src = ''; } catch (e) { /* ignore */ } }
    });
    ctx.effect(() => {
      let done = false;
      let disposer = null;
      mcRpc('get-cjk-font').then((res) => {
        if (done) return;
        if (res && res.data) {
          const fmt = res.format === 'woff2' ? 'woff2' : 'truetype';
          disposer = styles.insert('@font-face{font-family:"McCjk";src:url("' + res.data + '") format("' + fmt + '");font-weight:400;font-style:normal;font-display:swap;}');
        }
      }).catch(() => {});
      return () => { done = true; if (disposer) disposer(); };
    });
    ctx.effect(() => {
      let done = false;
      let disposer = null;
      mcRpc('get-latin-font').then((res) => {
        if (done) return;
        if (res && res.data) {
          disposer = styles.insert('@font-face{font-family:"McPixel";src:url("' + res.data + '") format("woff2");font-weight:400;font-style:normal;font-display:swap;}');
        }
      }).catch(() => {});
      return () => { done = true; if (disposer) disposer(); };
    });
    let clickUri = null;
    let clickAudio = null;
    ctx.effect(() => {
      let done = false;
      mcRpc('get-click-sound').then((res) => {
        if (done) return;
        if (res && res.data) {
          clickUri = res.data;
          try {
            const a = new Audio(clickUri);
            a.preload = 'auto';
            a.volume = 0.9;
            a.load();
            clickAudio = a;
          } catch (e) { /* ignore */ }
        }
      }).catch(() => {});
      return () => { done = true; };
    });
    ctx.effect(() => {
      const onDocClick = (e) => {
        try {
          const t = e.target;
          if (!t || !t.closest) return;
          const hit = t.closest('button, [role="button"], [role="menuitem"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="option"], .mc-btn, input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"], select, summary');
          if (!hit) return;
          if (!clickUri || typeof Audio === 'undefined') return;
          let a = clickAudio || onDocClick.audio;
          if (!a) {
            try { a = new Audio(clickUri); a.volume = 0.9; onDocClick.audio = a; } catch (err) { return; }
          }
          try { a.currentTime = 0; } catch (err) { /* ignore */ }
          const p = a.play();
          if (p && p.catch) p.catch(() => {
            try {
              const n = new Audio(clickUri);
              n.volume = 0.9;
              const p2 = n.play();
              if (p2 && p2.catch) p2.catch(() => {});
            } catch (err) { /* ignore */ }
          });
        } catch (err) { /* ignore */ }
      };
      document.addEventListener('click', onDocClick, true);
      return () => { document.removeEventListener('click', onDocClick, true); };
    });
    ctx.effect(() => {
      let done = false;
      mcRpc('load-custom-textures').then((res) => {
        if (done) return;
        if (res) {
          setStore({
            custom: Array.isArray(res.custom) ? res.custom : store.custom,
            customCount: Array.isArray(res.custom) ? (res.customCount || res.custom.length) : store.customCount,
            renames: res.renames && typeof res.renames === 'object' ? res.renames : {},
            hidden: Array.isArray(res.hidden) ? res.hidden : [],
            order: Array.isArray(res.order) ? res.order : [],
          });
        }
      }).catch(() => {});
      return () => { done = true; };
    });
      ctx.effect(() => {
        let done = false;
        mcRpc('load-settings').then((res) => {
          if (done) return;
          if (res) {
            const patch = {};
            if (res.texture) patch.texture = res.texture;
            if (res.bubble !== undefined) patch.bubble = res.bubble;
            if (res.input !== undefined) patch.input = res.input;
            if (res.size) patch.size = Number(res.size);
            if (res.bubbleSize) patch.bubbleSize = Number(res.bubbleSize);
            if (res.inputSize) patch.inputSize = Number(res.inputSize);
            if (res.bubbleTextColor) patch.bubbleTextColor = res.bubbleTextColor;
            if (res.inputTextColor) patch.inputTextColor = res.inputTextColor;
            if (typeof res.particles === 'boolean') patch.particles = res.particles;
            setStore(patch);
            applyTexture(store.texture);
            applyBubbleTexture(store.bubble);
            applyInputTexture(store.input);
          }
        }).catch(() => {});
        return () => { done = true; };
      });
    applyTexture('grass');
    applyBubbleTexture(store.bubble);
    applyInputTexture(store.input);
    const slots = ctx.get('slots');
    if (slots === undefined) return;
    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'mc-texture-picker', order: -10, label: '纹理' },
      () => React.createElement(TextureButton, null)
    ));
    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'mc-music-player', order: -9, label: '音乐' },
      () => React.createElement(MusicButton, null)
    ));
    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'mc-particles' },
      () => React.createElement(Particles, null)
    ));
    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'mc-music' },
      () => React.createElement(MusicPanel, null)
    ));
    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'mc-picker' },
      () => React.createElement(TexturePicker, null)
    ));
  },
};
    return module.exports;
  }
});
