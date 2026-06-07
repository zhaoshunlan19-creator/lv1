## 说明

- 本文档是 Codex CLI 的记忆文件，方便 AI 快速了解项目
- 详细内容请查阅 README.md

## 项目定位

团队协作练习项目，用于新手学习 Web 开发。采用**分支隔离**策略，每位成员在自己的分支上独立工作。

## 技术栈

- 框架：Next.js 16 + React 19
- 样式：Tailwind CSS 4
- UI 组件：shadcn/ui
- 包管理：pnpm

## 项目结构

```
app/              # 页面目录，成员可自由创建页面
components/ui/    # shadcn/ui 组件
public/           # 静态资源
```

## 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm lint         # 代码检查
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