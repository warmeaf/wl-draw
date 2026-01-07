---
name: front-end-engineering-report
description: 审查前端项目的工程化配置质量，基于审查结果和模板生成可视化的HTML报告。
license: Complete terms in LICENSE.txt
---

# 前端工程化质量审查报告

## 审查维度

### 1. 代码质量

- **语法校验**：ESLint/Biome 配置文件及规则完整性
- **代码格式化**：Prettier/Biome 格式化配置

### 2. Git 工作流

- **提交规范**：Commitlint 配置（提交类型定义、验证规则）
- **Pre-commit Hook**：Husky pre-commit 钩子配置
- **Commit-msg Hook**：Husky commit-msg 钩子配置
- **暂存文件检查**：lint-staged 配置

### 3. 版本管理

- **Node.js 版本锁定**：`.nvmrc` 文件
- **包管理器约束**：`package.json` 的 `engines` 字段、 `packageManager` 字段 和 `preinstall` 钩子

### 4. 文档质量

- **README.md**：结构完整性、内容完整性、格式规范度

## 评分标准

| 等级 | 分数范围 | 说明                   |
| ---- | -------- | ---------------------- |
| 完整 | 90-100   | 配置文件存在且规则完善 |
| 部分 | 50-89    | 配置存在但不完整       |
| 缺失 | 0-49     | 未配置该项功能         |

## 执行步骤

### Phase 1: 探索配置

使用 Explore agent 并行探索：

1. 代码质量工具配置（Biome/ESLint/Prettier 等）
2. Git 工作流配置（Husky/Commitlint/lint-staged）
3. 版本管理配置（.nvmrc/package.json）
4. README 文档质量

### Phase 2: 收集数据

读取各配置文件内容，整理为以下数据结构：

```javascript
{
  categories: [
    {
      name: "类别名称",           // 固定值: "代码质量" | "Git 工作流" | "版本管理" | "文档质量"
      icon: "fa-icon",            // Font Awesome icon class，如 "fa-code" | "fa-git" | "fa-cubes" | "fa-file-text-o"
      configs: [
        {
          name: "配置项名称",      // 类别下的具体配置项名称
          tool: "工具名称",       // 使用的工具名称，如 "Biome" | "ESLint" | "Husky" | "Commitlint" 等
          status: "complete|partial|missing",  // 只能是这三个值之一
          score: 0 - 100,         // 数字类型，0 到 100 之间的整数
          files: ["配置文件路径"], // 字符串数组，相关配置文件的相对路径
          description: "说明",    // 配置状态的文字描述
        },
      ],
    },
  ];
}
```

**重要约束说明：**

1. **固定类别结构**：必须包含以下 4 个类别，类别名称和 icon 不可随意更改：
   - `代码质量` (icon: "fa-code") - 包含语法校验、代码格式化等配置
   - `Git 工作流` (icon: "fa-git") - 包含提交规范、pre-commit hook 等配置
   - `版本管理` (icon: "fa-cubes") - 包含 Node.js 版本锁定、包管理器约束等
   - `文档质量` (icon: "fa-file-text-o") - 包含 README.md 等文档

2. **status 字段约束**：只能是 `"complete"`、`"partial"` 或 `"missing"` 三个值之一，不能使用其他值

3. **score 字段约束**：必须是 0-100 的整数，且与 status 字段对应：
   - `complete` → 90-100
   - `partial` → 50-89
   - `missing` → 0-49

### Phase 3: 生成报告

1. 创建输出目录 `.cqm/engineering/`，如果不存在
2. 基于模板生成 HTML 报告
3. 输出文件：`.cqm/engineering/engineering-report.html`

## 报告规范

### 设计风格

- 必须参考的模板：`.claude\skills\front-end-engineering-report\template\engineering-report-template.html`

## 总结与建议

- 必须在报告中包含具体的总结与建议
