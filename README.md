# dsh-minecraft-theme

> Minecraft 主题插件 for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/dsh)

为 DSH Web 界面铺满 Minecraft 方块纹理背景，并把整个界面改成像素风：
MC 风格灰色按钮、像素字体、按钮点击音效、方块纹理选择/导入/管理，以及内置 Minecraft 原声的**音乐播放器**（支持导入本地音乐文件夹，全程不上传）。

![license](https://img.shields.io/badge/license-MIT-blue)

## 截图

| 主题 | 纹理管理 | 音乐播放器 |
| --- | --- | --- |
| ![主题](screenshots/theme.png) | ![纹理](screenshots/texture.png) | ![音乐](screenshots/music.png) |

## 功能特性

### 🎨 主题
- **方块纹理背景**：21 种官方 Minecraft 方块纹理（草方块、石头、钻石块、TNT……）平铺铺满页面，可一键切换
- **纹理大小可调**：64 / 96 / 128 / 192 / 256 px
- **像素字体**：中文（Zpix 像素字体）+ 英文（Silkscreen），全界面生效
- **MC 风格按钮**：灰色浮雕质感按钮，点击播放 Minecraft 官方 `click.ogg` 音效
- **漂浮方块粒子**：装饰元素，可开关

### 🖼 纹理管理
- **我的纹理**统一列表：内置 21 个方块 + 导入/自制的纹理，均可一键应用
- **管理模式**：改名（内置方块也能改）、删除（可恢复）、↑↓ 调整顺序
- **导入纹理**：粘贴图片（Ctrl+V）、拖入图片、输入本地图片路径 / data URI
- **持久化**：自定义纹理、改名、排序保存到本地，重启不丢

### 🎵 音乐播放器
- **16 首 Minecraft 官方原声**：菜单（Minecraft 主题曲 / Clark / Sweden / Danny）+ 游戏音乐（Subwoofer Lullaby、Living Mice、Dry Hands……）
- **播放控制**：播放/暂停、上一首/下一首、音量、可拖动进度条、自动连播
- **本地音乐**：选择本地文件夹导入自己的音乐（ogg/mp3/wav/flac，数量不限），直接本地播放、不上传
- **分组列表**：◆ 默认音乐 / ◆ 本地音乐 分开显示
- 内存友好：内置音乐缓存最多 6 首（LRU），本地音乐流式播放

## 安装

```bash
# 从本地仓库目录安装（开发）
dsh plugin --profile <profile> add link:D:/Documents/dsh/mc-plugin

# 发布到 npm 后
dsh plugin --profile <profile> add @superls-x/dsh-minecraft-theme
```

> 插件需要两个本地资源目录才能完整运行：
> - `<workspace>/mc-textures/zpix.ttf`（中文字体，可选，缺失时回退系统字体）
> - `<workspace>/mc-textures/music/*.ogg`（默认音乐，可选，缺失时从 CDN 拉取）
>
> 音效/字体/默认音乐会通过主机进程读取本地文件。

## 使用

1. 侧边栏底部出现 **纹理**（方块图标）与 **音乐**（♪/♫）两个按钮
2. 点击 **纹理**：切换背景纹理、导入/管理自定义纹理
3. 点击 **音乐**：选择曲目播放、导入本地音乐文件夹
4. 点击任意按钮都有 MC 点击声；打开纹理面板可调纹理大小、开关粒子

## 目录结构

```
dsh-minecraft-theme/
├── cordis.patch.yml   # 组合补丁：作为 profile bundle 挂载
├── lib/index.js       # 主机端：本地资源读取（纹理/字体/音效/音乐）
├── client/client.js   # 浏览器端：主题 + 纹理管理 + 音乐播放器
├── package.json
├── README.md
└── LICENSE
```

## 免责声明

- Minecraft 是 Mojang Studios 的商标；本插件与 Mojang 无关
- 默认音乐/音效/纹理来自 [InventivetalentDev/minecraft-assets](https://github.com/InventivetalentDev/minecraft-assets)（非商业学习用途），相关版权归其所有者
- 字体 Zpix（[SolidZORO/zpix-pixel-font](https://github.com/SolidZORO/zpix-pixel-font)）与 Silkscreen 版权归其作者

## License

[MIT](LICENSE)
