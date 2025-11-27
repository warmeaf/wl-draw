<div align="center">

<img src="./public/logo.webp" alt="wl-draw Logo" width="200" height="auto">

# wl-draw

**数字白板绘图应用，基于 Vue 3 和 Leafer UI 构建，提供流畅的绘图和编辑体验。**

[![Vue 3](https://img.shields.io/badge/Vue-3.5+-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leafer UI](https://img.shields.io/badge/Leafer%20UI-1.10+-00D26A?logo=leaf&logoColor=white)](https://www.leaferjs.com/ui/guide/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## 📖 项目简介

wl-draw 是一个功能完善的数字白板应用，支持多种绘图工具、文本编辑、画布操作等功能。应用采用插件化架构设计，核心系统保持简洁稳定，功能通过插件扩展，具有高度的灵活性和可维护性。

### ✨ 核心功能

- **🎨 绘图工具**：选择、平移、矩形、圆形、直线、箭头、画笔、文本、图片
- **🖼️ 画布操作**：缩放（鼠标滚轮、按钮）、平移（工具和空格键）、无限画布
- **📦 对象管理**：对象添加、删除、选择、移动、缩放、对齐和吸附
- **📜 历史记录**：撤销/重做功能，支持最多 50 步历史记录
- **💾 导出功能**：支持导出为图片（PNG）和 JSON 格式
- **⌨️ 快捷键支持**：所有工具支持键盘快捷键，支持快捷键冲突检测和规范化处理
- **🔌 插件化架构**：完整的工具插件系统，支持工具注册、生命周期管理、事件系统、Hook 系统、快捷键管理、依赖管理和懒加载

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd wl-draw

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动开发服务器
pnpm dev
```

应用将在 `http://localhost:5173` 启动。

### 构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 代码检查与格式化

```bash
# 检查代码
pnpm lint:check

# 格式化代码
pnpm format

# 自动修复并格式化
pnpm check
```

## 📚 使用指南

### 基本操作

1. **选择工具**：点击工具栏中的选择工具（快捷键 `V`）或使用快捷键切换
2. **绘制图形**：选择绘图工具（矩形、圆形、直线等），在画布上拖拽绘制
3. **编辑对象**：使用选择工具选中对象后，可以移动、缩放、删除
4. **文本编辑**：选择文本工具（快捷键 `T`），在画布上点击添加文本
5. **画布操作**：
   - 使用鼠标滚轮缩放画布
   - 按住空格键拖拽平移画布
   - 使用工具栏的缩放按钮

### 快捷键列表

| 功能      | 快捷键         |
| --------- | -------------- |
| 选择工具  | `V`            |
| 矩形工具  | `R`            |
| 圆形工具  | `C`            |
| 直线工具  | `L`            |
| 箭头工具  | `A`            |
| 画笔工具  | `P`            |
| 文本工具  | `T`            |
| 导出图片  | `Shift+E`      |
| 导出 JSON | `Shift+J`      |
| 撤销      | `Ctrl+Z`       |
| 重做      | `Ctrl+Shift+Z` |
| 放大      | `Ctrl+=`       |
| 缩小      | `Ctrl+-`       |

## 📁 项目结构

```
wl-draw/
├── public/                 # 静态资源
│   └── logo.webp          # 项目 Logo
├── src/
│   ├── components/         # Vue 组件
│   │   ├── Canvas.vue      # 画布组件
│   │   ├── Toolbar.vue     # 工具栏组件
│   │   └── ...
│   ├── composables/        # 组合式函数
│   │   ├── events/         # 事件处理
│   │   ├── features/       # 功能封装
│   │   ├── state/          # 状态管理
│   │   └── tool/           # 工具相关
│   ├── config/             # 配置文件
│   │   ├── canvas.ts       # 画布配置
│   │   ├── export.ts       # 导出配置
│   │   └── theme.ts        # 主题配置
│   ├── constants/          # 常量定义
│   ├── plugins/            # 插件系统
│   │   ├── builtin/        # 内置插件
│   │   ├── composables/    # 插件组合函数
│   │   ├── registry.ts     # 插件注册表
│   │   ├── events.ts       # 事件系统
│   │   └── types.ts        # 插件类型定义
│   ├── stores/             # Pinia 状态管理
│   │   ├── canvas.ts       # 画布状态
│   │   └── history.ts      # 历史记录状态
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── docs/                   # 文档目录
│   ├── 插件化架构评分报告.md
│   └── 插件开发指南.md
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 🛠️ 技术栈

### 核心框架

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具

### 绘图引擎

- **Leafer UI** - 高性能 Canvas 渲染引擎
- **@leafer-in/editor** - 对象编辑功能（选择、移动、缩放）
- **@leafer-in/viewport** - 视口和缩放功能
- **@leafer-in/view** - 视图功能
- **@leafer-in/arrow** - 箭头绘制功能
- **@leafer-in/text-editor** - 文本编辑功能
- **@leafer-in/export** - 画布导出功能
- **leafer-x-easy-snap** - 对象对齐和吸附功能

### 状态管理

- **Pinia** - Vue 官方状态管理库

### UI 组件库

- **Naive UI** - Vue 3 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架

### 工具库

- **VueUse** - Vue Composition API 工具集合

### 开发工具

- **Biome** - 快速、可靠的代码检查和格式化工具
- **Husky** - Git hooks 工具
- **lint-staged** - 对暂存文件运行 linter
- **commitlint** - Git 提交信息规范检查工具
- **unplugin-auto-import** - 自动导入 API，无需手动 import
- **unplugin-vue-components** - 自动导入 Vue 组件
- **unplugin-icons** - 按需图标导入，基于 Iconify
- **@iconify/json** - Iconify 图标数据集合
- **rolldown-vite** - 基于 Rolldown 的高性能 Vite 构建工具

## 架构设计

### 插件化架构

wl-draw 采用微内核插件化架构，遵循以下核心原则：

#### 1. 核心与插件分离

- **微内核**：核心系统保持最小化和稳定，仅包含基础功能和插件管理机制
- **功能模块化**：业务功能以插件形式存在，每个插件负责独立功能
- **职责清晰**：核心系统管理插件生命周期，插件实现具体功能

#### 2. 统一的插件接口规范

- **ToolPlugin 接口**：定义插件必须实现的统一接口
- **插件元数据**：包含版本、描述、依赖等信息
- **能力声明**：通过 `capabilities` 声明插件行为，系统自动调整
- **工具实例**：插件通过 `createTool` 创建工具实例，实现具体功能

#### 3. 插件管理机制

- **插件注册表（PluginRegistry）**：统一管理所有插件的注册、查询、卸载
- **插件验证**：注册时验证插件规范、依赖关系、版本兼容性
- **生命周期管理**：支持插件安装、激活、停用、卸载等生命周期
- **插件状态跟踪**：跟踪插件状态（registered、activated、deactivated、error），记录注册和激活时间
- **懒加载支持**：支持插件懒加载，按需加载插件代码，提升初始加载性能
- **依赖管理**：
  - 支持插件依赖声明和依赖顺序计算
  - 使用拓扑排序算法确保依赖顺序正确
  - 自动检测循环依赖并抛出错误
  - 自动加载依赖插件

#### 4. 通信机制

- **事件驱动**：基于事件总线的插件间通信机制
- **类型安全**：事件系统提供完整的 TypeScript 类型支持
- **事件管理**：
  - 自动跟踪事件订阅，插件卸载时自动清理
  - 支持一次性事件订阅（once）
  - 事件处理器错误自动捕获和处理
- **事件类型**：支持丰富的事件类型，包括：
  - 插件生命周期事件（激活、停用）
  - 工具切换事件
  - 对象操作事件（创建、删除、选择、修改）
  - 画布操作事件（缩放、平移）
  - 绘制事件（开始、更新、完成）
  - 快捷键触发事件

#### 5. Hook 系统

- **生命周期钩子**：在关键节点（工具切换、绘制开始/完成）执行自定义逻辑
- **拦截器钩子**：支持在操作前拦截（如阻止工具切换）
- **处理器钩子**：支持在操作后执行后续处理

#### 6. 能力驱动设计

插件通过 `capabilities` 声明能力，系统根据能力自动：

- 切换画布模式（绘图模式/普通模式）
- 分发事件（拖拽、点击等）
- 启用/禁用功能（如拖拽平移）

#### 7. 快捷键系统

- **快捷键注册**：插件可以通过 `shortcut` 字段声明快捷键
- **快捷键规范化**：自动规范化快捷键格式（统一大小写、排序修饰键）
- **冲突检测**：注册时自动检测快捷键冲突，并发出警告
- **快捷键解析**：支持解析复杂快捷键组合（Ctrl、Shift、Alt、Meta）
- **事件触发**：快捷键触发时自动发送 `shortcut:triggered` 事件

### 架构层次

```
┌─────────────────────────────────────┐
│          UI 层 (Vue Components)     │
│  Toolbar, Canvas, ToolSelector...  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        核心系统 (Core System)        │
│  - 插件注册表 (PluginRegistry)       │
│  - 事件总线 (EventBus)               │
│  - Hook 系统 (Hook System)           │
│  - 工具管理器 (Tool Manager)         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        插件层 (Plugin Layer)         │
│  - 内置插件 (Builtin Plugins)        │
│  - 工具插件 (Tool Plugins)           │
│  - 扩展插件 (Extension Plugins)      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        基础设施层 (Infrastructure)    │
│  - Leafer UI (绘图引擎)              │
│  - Pinia (状态管理)                  │
│  - VueUse (工具库)                   │
└─────────────────────────────────────┘
```

### 核心模块

- **插件系统** (`src/plugins/`)：插件注册、管理、事件、Hook、快捷键
- **状态管理** (`src/stores/`)：画布状态、工具状态、对象管理、历史记录
- **工具组合函数** (`src/composables/`)：工具逻辑封装和复用
- **组件** (`src/components/`)：UI 组件（工具栏、画布、工具选择器等）
- **配置** (`src/config/`)：画布配置、主题配置、导出配置
- **错误处理** (`src/utils/errorHandler.ts`)：统一的错误处理机制，支持错误分类、日志记录和用户友好的错误提示

### 内置插件

应用内置了以下插件，按类别分类：

#### 选择工具（Selection Tools）

- **选择工具** (`select`) - 快捷键：`V` - 选择和操作画布对象
- **平移工具** (`pan`) - 平移画布视图

#### 绘图工具（Drawing Tools）

- **矩形工具** (`rect`) - 快捷键：`R` - 绘制矩形
- **圆形工具** (`circle`) - 快捷键：`C` - 绘制圆形
- **直线工具** (`line`) - 快捷键：`L` - 绘制直线
- **箭头工具** (`arrow`) - 快捷键：`A` - 绘制箭头
- **画笔工具** (`pen`) - 快捷键：`P` - 自由手绘
- **文本工具** (`text`) - 快捷键：`T` - 添加文本
- **图片工具** (`image`) - 添加图片到画布

#### 实用工具（Utility Tools）

- **导出图片** (`export`) - 快捷键：`Shift+E` - 导出画布为图片
- **导出 JSON** (`exportJson`) - 快捷键：`Shift+J` - 导出画布为 JSON
- **撤销** (`undo`) - 快捷键：`Ctrl+Z` - 撤销上一步操作
- **重做** (`redo`) - 快捷键：`Ctrl+Shift+Z` - 重做上一步操作
- **放大** (`zoomIn`) - 快捷键：`Ctrl+=` - 放大画布
- **缩小** (`zoomOut`) - 快捷键：`Ctrl+-` - 缩小画布

所有插件支持懒加载，提升应用初始加载性能。

### 插件开发

插件开发遵循统一的接口规范，支持三种插件类别：

- **选择工具** (`selection`)：实现对象选择和操作功能（如选择工具、平移工具）
- **绘图工具** (`drawing`)：实现绘图功能（如矩形、圆形、画笔、文本等）
- **实用工具** (`utility`)：实现辅助功能（如导出、撤销/重做、缩放等）

插件可以声明依赖关系、注册生命周期钩子、订阅事件、声明快捷键，并支持懒加载以优化性能。

详细的插件开发指南请参考 [插件开发指南](./docs/插件开发指南.md)。

## 👨‍💻 开发指南

### 开发规范

项目使用以下工具保证代码质量：

- **Biome**: 代码检查和格式化
- **Husky**: Git hooks 管理
- **lint-staged**: 暂存文件检查
- **commitlint**: 提交信息规范检查

### Git 提交规范

项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**：

- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 插件开发

#### 创建插件

1. 在 `src/plugins/builtin/` 目录下创建插件文件
2. 实现 `ToolPlugin` 接口
3. 在 `src/plugins/builtin/index.ts` 中注册插件

#### 插件示例

```typescript
import type { ToolPlugin } from '../types'

export const myPlugin: ToolPlugin = {
  id: 'my-plugin',
  name: '我的插件',
  category: 'utility',
  version: '1.0.0',
  shortcut: 'Ctrl+M',
  capabilities: {
    requiresDrawingMode: false,
  },
  createTool() {
    return {
      onActivate() {
        console.log('插件已激活')
      },
      onDeactivate() {
        console.log('插件已停用')
      },
    }
  },
}
```

更多详细信息请参考 [插件开发指南](./docs/插件开发指南.md)。

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [Leafer UI 文档](https://leaferjs.com/)
- [插件开发指南](./docs/插件开发指南.md)
- [插件化架构评分报告](./docs/插件化架构评分报告.md)

---

<div align="center">

**Made with ❤️ using Vue 3 and Leafer UI**

</div>
