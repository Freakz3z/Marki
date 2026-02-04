# Marki - Modern Documentation Platform

Marki 是一个基于 React + TypeScript + Vite 的现代化文档平台，专为替代 GitBook 而设计。它可以作为静态站点生成器使用，也支持直接渲染远程 GitHub 仓库中的 Markdown 内容。

## ✨ 核心特性

- **双模式支持**：
  - 📂 **本地模式**：类似 GitBook，直接读取 `docs/` 目录下的 Markdown 文件。
  - ☁️ **远程模式**：通过配置，直接动态拉取 GitHub 仓库内容，无需重新构建即可更新内容。
- **GitHub 深度集成**：
  - 🕒 自动获取并展示文档的**最近更新时间**和**贡献者**信息（基于 GitHub API）。
  - 🔗 智能识别外部链接，并添加可视化标识。
  - 🖼️ 自动修正远程 Markdown 中的相对路径图片链接。
- **现代化 UI/UX**：
  - 🌗 **深色/浅色模式**：内置舒适的日间/夜间主题切换。
  - 📑 **智能目录**：右侧 "On This Page" 目录支持滚动监听与高亮。
  - 📱 **响应式设计**：完美适配移动端与桌面端。
  - 🔎 **即时搜索**：支持文档标题快速检索。
  - ↔️ **上下文导航**：页脚自动生成“上一页/下一页”导航按钮。
- **高度可配置**：
  - ⚙️ 通过 `public/settings.json` 即可实时修改网站标题、Logo、Favicon 及数据源仓库。

## 🚀 快速开始

### 1. 配置

在 `public/settings.json` 中配置你的站点信息：

```json
{
  "githubRepo": "YourUsername/Your-Repo",  // 留空则使用本地 docs/ 模式
  "branch": "main",
  "siteTitle": "My Wiki",
  "navbarTitle": "Marki Docs",
  "logoPath": "/logo.jpg"
}
```

### 2. 运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 构建

```bash
npm run build
```

## 🛠️ 项目结构

- `src/services/docs.ts`: 核心引擎，负责双模式切换、Markdown 解析及 GitHub API 交互。
- `src/components/MarkdownRenderer.tsx`: 定制的 Markdown 渲染器，包含代码高亮、链接处理等插件。
- `src/layouts/MainLayout.tsx`: 全局布局，处理视口滚动与侧边栏逻辑。
- `public/settings.json`: 运行时配置文件。

## 📝 编辑器

访问 `/admin` 路径可以使用内置的简易 Markdown 编辑器（主要用于本地模式下的快速调式）。

