## 说明

本文档是 Claude Code 的记忆文件，方便 AI 快速了解项目。详细内容查阅 README.md。

## 项目定位

**IdeaForge 创意工坊** —— AI 辅助创意孵化工具，管理员录入/导入创意，AI 自动生成需求分析和 MVP 规划，访客浏览创意广场。

团队协作练习项目，新手学习 Web 开发。采用**分支隔离**策略，每位成员在自己的分支上独立工作。

## 技术栈

- 框架：Next.js 16 + React 19
- 样式：Tailwind CSS 4 + shadcn/ui
- 包管理：pnpm

## 项目结构

```
app/
  page.tsx                    # 首页 - 聚焦模式（默认）+ 网格瀑布流模式切换
  admin/layout.tsx            # 管理后台共用布局（左侧边栏导航，新增页面只需加 NAV_ITEMS 一条）
  admin/page.tsx              # 创意管理（CRUD 列表）
  admin/settings/page.tsx     # API 密钥设置页
  idea/[id]/page.tsx          # 创意详情页（含来源区块）
  api/ideas/                  # 创意 CRUD API
  api/analyze/                # AI 分析 API（AITOLL/DeepSeek）
  api/settings/               # 设置读写 API
  api/douyin/extract/         # 抖音分享链接解析（JustOneAPI）
  api/douyin/draft/           # AI 生成创意草稿（AITOLL）
components/
  idea-card.tsx               # 创意卡片（瀑布流）
  idea-card-focus.tsx         # 聚焦大卡
  idea-sheet.tsx              # 创意文档 Sheet（新建/编辑统一入口，Notion 风格内联编辑）
  source-badge.tsx            # 来源徽章（从 SOURCE_REGISTRY 读取，新增来源只改注册表）
  analysis-section.tsx        # 需求分析展示
  mvp-section.tsx             # MVP 方案展示
lib/
  types.ts                    # 类型定义（含 IdeaSource、SOURCE_REGISTRY）
  storage.ts                  # JSON 文件存储（data/ideas.json）
  settings.ts                 # 设置存储（data/settings.json），getApiKey 优先读文件再回退 env
  ai.ts                       # AITOLL AI 客户端
  prompts.ts                  # Prompt 模板
data/
  ideas.json                  # 创意数据
  settings.json               # API 密钥（优先级高于 .env.local，gitignore）
docs/justoneapi/              # JustOneAPI 接口文档
```

## 环境变量

```
AITOLL_API_KEY=...          # AI 分析和草稿生成（也可在 /admin/settings 配置）
JUSTONEAPI_TOKEN=...        # 抖音数据提取（也可在 /admin/settings 配置）
```

优先级：`data/settings.json` > `.env.local`

## 来源扩展

新增创意来源只需在 `lib/types.ts` 的 `SOURCE_REGISTRY` 添加一条记录：

```ts
{ label: '显示名', color: 'Tailwind 颜色类' }
```

## 抖音导入流程

1. 管理员在创意文档 Sheet 的"从抖音导入"Popover 中粘贴分享文字/链接
2. `分享链接解析 V1` → 提取 videoId
3. `视频详情 V2` → 获取文案、封面、播放量等
4. AI 生成创意草稿（title / description / targetUser）预填到文档字段
5. 管理员编辑确认后提交 → 创建并触发深度分析

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm tsc --noEmit # 类型检查（无 eslint.config.js）
```

## 开发环境

- 系统：Windows / 终端：PowerShell

## 分支策略

- master 由管理员维护；成员在个人分支独立工作，分支间可互相合并

## 注意事项

- 目标用户为中文母语者
- AI 不应自行启动项目，需要时提示用户操作
- JustOneAPI 301 为临时采集失败，已实现自动重试 3 次
- 抖音封面图 URL 带签名有时效性，不适合长期存储
