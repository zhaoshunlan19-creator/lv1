# lv1.today

AI 辅助创意孵化工具。管理员录入或从外部来源导入创意，AI 自动生成需求分析和 MVP 规划，访客浏览创意广场。

团队协作练习项目，用于新手学习 Web 开发。

## 技术栈

- Next.js 16 + React 19
- Tailwind CSS 4 + shadcn/ui
- pnpm

## 快速开始

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000，管理后台在 /admin（直接输入路径进入，不在首页暴露入口）。

## 环境变量

在 `.env.local` 中配置，或登录后在 `/admin/settings` 页面直接填写（设置页优先级更高）：

```
AITOLL_API_KEY=       # AI 分析和草稿生成
JUSTONEAPI_TOKEN=     # 抖音数据提取
```

## 主要功能

**访客端**
- 聚焦模式：单卡全宽，支持随机探索和浏览历史
- 网格模式：竖屏比例瀑布流

**管理后台**（`/admin`，左侧边栏导航）
- 创意管理：列表展示，含来源徽章；新建/编辑/删除/重新分析
- 创意文档 Sheet：新建和编辑统一入口，Notion 风格内联编辑，需求分析和 MVP 方案直接展示在文档内
- 抖音导入：通过 Popover 粘贴链接，AI 自动提取并预填文档字段
- 设置：在页面内配置 API 密钥，无需改 .env 文件

**AI 分析**
- 创意发布后自动触发深度分析（需求分析 + MVP 规划）
- 支持手动重新触发

## 来源系统

创意来源通过 `SOURCE_REGISTRY`（`lib/types.ts`）统一管理。新增来源只需在注册表添加一条 `{ label, color }` 记录，`SourceBadge` 组件和管理列表自动适配。

目前支持：`manual`（手动录入）、`douyin`（抖音导入）。

## 数据存储

- `data/ideas.json` — 创意列表
- `data/settings.json` — API 密钥（优先级高于 .env.local，`data/` 目录已在 .gitignore）

## 分支策略

- master 由管理员维护
- 成员在个人分支独立工作，分支间可互相合并
