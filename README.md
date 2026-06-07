# lv1.today

AI 辅助创意孵化工具。管理员录入或从抖音导入创意，AI 自动生成需求分析和 MVP 规划，访客浏览创意广场。

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

访问 http://localhost:3000，管理后台在 /admin。

## 环境变量

.env.local 中配置：

AITOLL_API_KEY=       # AI 分析和草稿生成
JUSTONEAPI_TOKEN=     # 抖音数据提取

## 主要功能

**访客端**
- 聚焦模式：单卡全宽，标题→渐变展示区→描述，支持探索下一个随机浏览和历史回顾
- 网格模式：竖屏比例瀑布流卡片，展示区预留图片/视频位置

**管理后台**
- 手动创建/编辑/删除创意
- 抖音导入：粘贴分享链接 → 提取视频信息 → AI 生成草稿 → 确认发布
- 发布后自动触发 AI 深度分析（需求分析 + MVP 规划）

## 数据

创意存储在 data/ideas.json，字段包含 source IdeaSource（来源类型 douyin | manual 及视频元数据）。

## 分支策略

- master 由管理员维护
- 成员在个人分支独立工作，分支间可互相合并
