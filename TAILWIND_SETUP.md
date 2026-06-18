# Tailwind CSS 从 CDN 迁移到生产构建 — 操作记录

> **日期：** 2026-06-18
> **项目：** flashgen-simulator (`D:\code\test-flashplayer`)
> **目标：** 将 Tailwind CSS 从 Play CDN 运行时模式切换到 Vite 构建时管线，支持 GitHub Pages 生产部署

---

## 背景

原项目通过 `index.html` 中的 CDN 脚本加载 Tailwind：

```html
<script src="https://cdn.tailwindcss.com"></script>
```

这种方式（Play CDN）在运行时解析所有 Tailwind 类名，缺点是：
- **性能差** — 每次页面加载都要下载并解析完整的 Tailwind 引擎（~400 kB）
- **无法 tree-shaking** — 所有工具类都会被包含，无 unused 样式清除
- **无自定义配置** — 无法使用 `tailwind.config.js` 设置主题色、断点等
- **外部依赖** — 需要联网才能加载，不支持离线开发
- **生产不安全** — 运行时动态注入 CSS，浏览器解析开销大

---

## 执行步骤

### 1. 安装 Tailwind CSS v4 和 Vite 插件

```bash
npm install -D tailwindcss @tailwindcss/vite
```

| 包名 | 版本 | 用途 |
|------|------|------|
| `tailwindcss` | 4.3.1 | Tailwind CSS 核心库 |
| `@tailwindcss/vite` | 4.3.1 | Tailwind v4 官方 Vite 集成插件 |

> 注意：Tailwind v4 不再需要 `postcss`、`autoprefixer`、`tailwind.config.js` 或 `postcss.config.js`。所有配置通过 CSS 原生的 `@import` 和 `@theme` 指令完成。

### 2. 更新 Vite 配置 (`vite.config.ts`)

**变更内容：**
- 导入 `tailwindcss` from `@tailwindcss/vite`
- 在 `plugins` 数组的开头添加 `tailwindcss()`

```ts
import tailwindcss from '@tailwindcss/vite';

// 在 plugins 中：
plugins: [tailwindcss(), react()],
```

**关键原则：** `tailwindcss()` 插件必须放在其他插件**之前**，确保它在 CSS 管道中优先处理 Tailwind 指令。

### 3. 创建 CSS 入口文件 (`index.css`)

新建 `D:\code\test-flashplayer\index.css`：

```css
@import "tailwindcss";
```

这行指令被 `@tailwindcss/vite` 插件识别并替换为完整的 Tailwind 生成的 CSS。可以在此文件顶部添加自定义 CSS 或使用 `@theme` 指令自定义设计令牌。

### 4. 移除 CDN 脚本 (`index.html`)

**移除：**
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**保留不变：**
```html
<link rel="stylesheet" href="/index.css">
```

Vite 在构建时会自动处理此 `<link>`，将 `index.css` 通过 `@tailwindcss/vite` 插件编译后输出为带内容哈希的生产 CSS 文件（如 `assets/index-ClOb1MdN.css`），并更新 HTML 中的引用路径。

### 5. 构建验证

```bash
npm run build
```

**构建结果：**

| 文件 | 原始大小 | Gzip 后 |
|------|----------|---------|
| `assets/index-*.css` | 61.05 kB | 9.75 kB |
| `assets/index-*.js` | 331.92 kB | 99.27 kB |

构建产物 `dist/index.html` 中的 CSS 引用已自动更新为：
```html
<link rel="stylesheet" crossorigin href="/test-flashplayer/assets/index-ClOb1MdN.css">
```

路径前缀 `/test-flashplayer/` 与 `vite.config.ts` 中配置的 `base` 保持一致，确保 GitHub Pages 部署后资源路径正确。

---

## 文件变更清单

| 文件 | 操作类型 | 说明 |
|------|---------|------|
| `package.json` | 更新 | 新增 `tailwindcss` 和 `@tailwindcss/vite` 依赖 |
| `package-lock.json` | 新增 | 依赖锁定文件，需提交以确保构建可复现 |
| `index.css` | 新增 | Tailwind CSS 入口文件 |
| `vite.config.ts` | 修改 | 添加 `@tailwindcss/vite` 插件 |
| `index.html` | 修改 | 移除 Tailwind CDN 脚本 |
| `node_modules/` | 新增 | 构建依赖（已在 `.gitignore` 中忽略） |

---

## GitHub Pages 部署说明

现有的 `.github/workflows/deploy.yml` 工作流会自动处理构建流程：

```yaml
- name: Install Dependencies
  run: npm install
- name: Build
  run: npm run build
```

部署前需确保：

1. ✅ `package-lock.json` **已提交** — 保证 `npm install` 安装的版本与开发环境一致
2. ✅ `vite.config.ts` 中的 `base: '/test-flashplayer/'` 与仓库名匹配
3. ✅ `.gitignore` 中已忽略 `node_modules` 和 `dist`
4. ✅ 部署工作流中包含 `.nojekyll` 文件创建（已有）

触发部署：推送到 `deploy` 分支，或在 GitHub Actions 页手动触发。

---

## 后续优化建议

- **自定义主题：** 在 `index.css` 中使用 `@theme` 指令自定义颜色、字体、断点等设计令牌
- **CSS 优化：** 如果将来需要更精细的样式拆分，可以创建多个 CSS 文件按需导入
- **自动更新：** Tailwind v4 使用 Lightning CSS 进行自动前缀添加和 CSS 压缩，无需额外配置

---

## 回滚指南

如需恢复 CDN 模式：

1. 从 `index.html` 删除新创建的 `<link rel="stylesheet" href="/index.css">` 和 `<link crossorigin ...>` 
2. 恢复 `<script src="https://cdn.tailwindcss.com"></script>` 到 `<head>` 中
3. 删除 `index.css` 文件
4. 从 `vite.config.ts` 中移除 `tailwindcss()` 插件和相关导入
5. 运行 `npm uninstall tailwindcss @tailwindcss/vite`
6. 删除 `package-lock.json`
