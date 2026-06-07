## 说明

- 本文档是 Claude Code 的记忆文件，方便 AI 快速了解项目
- 详细内容请查阅 README.md

## 项目定位

**IdeaForge 创意工坊** —— AI 辅助创意孵化工具，管理员录入/导入创意，AI 自动生成需求分析和 MVP 规划，访客浏览创意广场。

团队协作练习项目，用于新手学习 Web 开发。采用**分支隔离**策略，每位成员在自己的分支上独立工作。

## 技术栈

- 框架：Next.js 16 + React 19
- 样式：Tailwind CSS 4
- UI 组件：shadcn/ui
- 包管理：pnpm

## 项目结构

```
app/
  page.tsx                    # 首页 - 聚焦模式（默认）+ 网格瀑布流模式切换，浏览历史 Sheet 在聚焦模式底部
  admin/page.tsx              # 管理后台（CRUD + 抖音导入）
  idea/[id]/page.tsx          # 创意详情页（含来源区块）
  api/ideas/                  # 创意 CRUD API
  api/analyze/                # AI 分析 API（AITOLL/DeepSeek）
  api/douyin/extract/         # 抖音分享链接解析（JustOneAPI）
  api/douyin/draft/           # AI 生成创意草稿（AITOLL）
components/
  idea-card.tsx               # 创意卡片（竖屏比例，aspect-[3/4] 展示区预留图片，瀑布流布局）
  idea-card-focus.tsx         # 聚焦大卡（标题→渐变展示区→描述+查看详情）
  create-idea-dialog.tsx      # 手动创建创意弹窗
  edit-idea-dialog.tsx        # 编辑创意弹窗
  douyin-import-dialog.tsx    # 抖音导入弹窗（三阶段流程）
  analysis-section.tsx        # AI 分析结果展示
  mvp-section.tsx             # MVP 方案展示
lib/
  types.ts                    # 类型定义（含 IdeaSource）
  storage.ts                  # JSON 文件存储
  ai.ts                       # AITOLL AI 客户端
  prompts.ts                  # Prompt 模板
data/ideas.json               # 数据存储
docs/justoneapi/              # JustOneAPI 接口文档
```

## 环境变量（.env.local）

```
AITOLL_API_KEY=...          # AI 分析和草稿生成
JUSTONEAPI_TOKEN=...        # 抖音数据提取
```

## 抖音导入流程

1. 管理员粘贴分享文字/链接
2. `分享链接解析 V1` → 从 redirect_url 提取 videoId
3. `视频详情 V2` → 获取文案、封面、播放量等
4. AI 生成创意草稿（title / description / targetUser）
5. 管理员预览编辑后确认 → 正式创建并触发 AI 深度分析
6. source 字段持久化到 ideas.json，详情页展示来源区块

## 数据结构扩展

`Idea` 新增 `source?: IdeaSource`，类型为 `douyin | manual`，记录视频元数据。

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm lint         # 代码检查（注意：无 eslint.config.js，用 tsc --noEmit 验证）
```

## 开发环境

- 系统：Windows
- 终端：PowerShell

## 分支策略

- master 分支由管理员维护
- 成员创建个人分支作为独立空间（如 `zhangsan`、`lisi`）
- 分支之间可互相合并，但一般不合并到 master

## 注意事项

- 目标用户为中文母语者
- AI 不应自行启动项目，需要时提示用户操作
- JustOneAPI 301 错误为临时采集失败，已实现自动重试 3 次
- 抖音封面图有时效性（URL 带签名过期时间），不适合长期存储展示
