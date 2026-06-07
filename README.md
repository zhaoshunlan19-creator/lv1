# The Incubator - 团队协作练习项目

欢迎来到 The Incubator！🎉

这是一个**零基础友好**的练习项目，专为刚接触 Web 开发的团队成员准备。不用担心不会，跟着下面的步骤一步步来，你也能成为开发者！

## 这个项目是做什么的？

简单来说，这是一个"练习场"：
- 每个人都可以在这里创建自己的小页面
- 学习如何使用现代化的开发工具
- 练习团队协作，体验真实的工作流程
- 不用害怕弄坏项目，这就是用来练手的！

---

## 新手必读：开始之前的准备工作

### 第一步：安装必要的软件

#### 1. 安装 Node.js（必需）

Node.js 是运行这个项目的基础环境。

**下载地址**: [https://nodejs.org/zh-cn/](https://nodejs.org/zh-cn/)

- 下载 **LTS 版本**（长期支持版，更稳定）
- 双击安装包，一路点"下一步"即可
- 安装完成后，打开 PowerShell（或命令提示符），输入以下命令验证：
  ```bash
  node -v
  ```
  如果显示版本号（如 `v20.x.x`），说明安装成功！

#### 2. 安装 pnpm（必需）

pnpm 是一个快速、节省磁盘空间的包管理工具。

**打开 PowerShell**，输入以下命令：

```bash
npm install -g pnpm
```

安装完成后验证：
```bash
pnpm -v
```

看到版本号就说明成功了！

#### 3. 安装 Git（必需）

Git 是用来管理代码版本的工具，团队协作必备。

**下载地址**: [https://git-scm.com/downloads](https://git-scm.com/downloads)

- 下载并安装
- 安装时保持默认选项即可
- 验证安装：
  ```bash
  git --version
  ```

#### 4. 安装代码编辑器（推荐）

**推荐使用 VS Code**（Visual Studio Code）

**下载地址**: [https://code.visualstudio.com/](https://code.visualstudio.com/)

- 免费、强大、新手友好
- 安装后推荐安装这些插件（在 VS Code 左侧扩展商店搜索）：
  - `Chinese (Simplified)` - 中文界面
  - `ES7+ React/Redux/React-Native snippets` - React 代码片段
  - `Tailwind CSS IntelliSense` - CSS 自动提示
  - `Prettier` - 代码格式化

### 第二步：获取项目代码

打开 PowerShell（或 VS Code 的终端），输入：

```bash
# 1. 克隆项目到你的电脑
git clone https://gitee.com/HuangGuaDaGuiNan/the-incubator.git

# 2. 进入项目文件夹
cd TheIncubator

# 3. 安装项目依赖（会下载很多必要的文件，需要等一会儿）
pnpm install
```

### 第三步：启动项目

在项目文件夹里输入：

```bash
pnpm dev
```

看到类似这样的提示就说明成功了：
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
```

打开浏览器，访问 [http://localhost:3000](http://localhost:3000)，你应该能看到项目首页了！

🎉 **恭喜！环境准备完成，你已经成功运行了第一个项目！**

---

## 我该做什么？如何开始？

### 重要：分支隔离策略

在这个项目中，**每个人都在自己的分支上独立工作**。你的分支就是你的专属空间，可以自由创建任何页面，不用担心影响别人。

### 第一步：创建你自己的分支

```bash
# 创建并切换到你的分支（把 zhangsan 换成你的名字）
git checkout -b zhangsan
```

### 第二步：创建你的页面

1. **在 `app` 文件夹里创建页面**

   比如创建一个 `app/hello/page.tsx`，这就是你的第一个页面！

2. **写一些简单的代码**

   可以复制下面的模板开始：

   ```tsx
   export default function HelloPage() {
     return (
       <div className="p-8">
         <h1 className="text-3xl font-bold">你好，世界！</h1>
         <p className="mt-4">这是我的第一个 React 页面！</p>
       </div>
     )
   }
   ```

3. **在浏览器查看效果**

   访问 `http://localhost:3000/hello`

### 项目文件结构（简单理解）

```
TheIncubator/
├── app/                   ← 这里放你的页面
│   ├── page.tsx          ← 网站首页
│   ├── hello/            ← 示例：hello 页面
│   │   └── page.tsx
│   └── about/            ← 示例：about 页面
│       └── page.tsx
├── components/            ← 共用的组件（可复用的代码块）
│   └── ui/               ← UI 组件库
├── public/               ← 放图片等静态文件
└── package.json          ← 项目配置文件（不用管）
```

**记住**：你在自己的分支上工作，可以自由地在 `app` 文件夹下创建任何页面！

---

## 团队协作：如何提交你的代码

### Git 工作流程（新手版）

Git 就像是代码的"云盘"，可以保存你的代码，也能和队友共享。

#### 分支说明

- **master 分支**：由管理员维护，包含项目基础代码
- **个人分支**：你的专属空间，用你的名字命名（如 `zhangsan`、`lisi`）
- 你可以和其他队友的分支互相合并，学习借鉴彼此的代码

#### 基本流程：

**1. 写代码、保存、测试**

正常写代码，保存文件，在浏览器里看效果。

**2. 提交你的修改**

```bash
# 查看你修改了哪些文件
git status

# 把所有修改加入暂存区
git add .

# 提交修改，写上说明
git commit -m "添加了张三的个人介绍页面"
```

**3. 推送到远程仓库**

```bash
# 第一次推送需要用这个命令
git push -u origin zhangsan

# 之后再推送只需要
git push
```

**4. 想借鉴队友的代码？**

```bash
# 切换到你的分支
git checkout zhangsan

# 合并队友的分支到你的分支
git merge lisi
```

### 常用命令速查

```bash
# 查看当前状态
git status

# 查看所有分支
git branch

# 切换到主分支
git checkout master

# 拉取最新代码
git pull

# 查看提交历史
git log --oneline
```

---

## 常见问题（新手专区）

### 启动项目时遇到错误怎么办？

**问题 1：提示 "command not found" 或 "不是内部或外部命令"**

- **原因**：没安装对应的软件，或者没配置环境变量
- **解决**：重新安装 Node.js / pnpm / Git，安装时注意勾选"添加到 PATH"

**问题 2：`pnpm install` 很慢或失败**

- **原因**：网络问题，国外服务器连接慢
- **解决**：使用国内镜像源
  ```bash
  pnpm config set registry https://registry.npmmirror.com
  ```

**问题 3：端口被占用（Port 3000 is already in use）**

- **原因**：3000 端口被其他程序使用了
- **解决**：
  - 方法 1：关闭占用端口的程序
  - 方法 2：使用其他端口：`pnpm dev -p 3001`

### Git 操作遇到问题怎么办？

**问题 1：提示需要配置用户信息**

```bash
# 设置你的名字和邮箱
git config --global user.name "你的名字"
git config --global user.email "your.email@example.com"
```

**问题 2：不小心改错了，想撤销**

```bash
# 撤销所有未提交的修改（谨慎使用！）
git checkout .

# 撤销某个文件的修改
git checkout -- 文件名
```

**问题 3：合并冲突（Merge Conflict）**

- **原因**：你和队友改了同一个文件的同一个地方
- **解决**：
  1. 打开冲突文件，会看到 `<<<<<<`, `======`, `>>>>>>` 这些标记
  2. 手动编辑，保留需要的内容，删除标记
  3. 保存后重新提交

### 代码相关问题

**问题 1：改了代码但浏览器没反应**

- 试试刷新浏览器（Ctrl + F5 强制刷新）
- 检查终端有没有报错
- 重启开发服务器（Ctrl + C 停止，然后 `pnpm dev` 重启）

**问题 2：不知道怎么写代码**

- 先看看别人写的代码，模仿着来
- 查看本文末尾的学习资源
- 问队友或项目负责人

**问题 3：代码报错看不懂**

- 复制错误信息，去百度/Google 搜索
- 查看终端和浏览器控制台的错误提示
- 检查是否有拼写错误或语法问题

---

## 练习建议

### 新手任务（推荐从这里开始）
- ✅ 创建个人介绍页面，包含姓名、照片、自我介绍
- ✅ 做一个简单的计数器（点击按钮数字加 1）
- ✅ 制作一个个人名片，包含联系方式

### 进阶任务（有一定基础后尝试）
- 📝 做一个待办事项列表（可以添加、删除、标记完成）
- 🎨 实现亮色/暗色主题切换
- 📋 创建一个简单的表单（带验证功能）

### 挑战任务（想要更进一步）
- 🌐 调用天气 API 显示实时天气
- 📊 制作数据可视化图表
- 🔐 实现简单的登录功能

---

## 学习资源

### 官方文档（英文，建议配合翻译工具）
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 中文学习资源
- [React 中文文档](https://zh-hans.react.dev/)
- [菜鸟教程 - React](https://www.runoob.com/react/react-tutorial.html)
- [阮一峰 ES6 入门](https://es6.ruanyifeng.com/)

### 视频教程
- B站搜索：Next.js 入门、React 基础教程
- YouTube（需要梯子）：Traversy Media、Net Ninja

### 遇到问题时
1. 先看错误提示，尝试理解
2. 复制错误信息，去百度/Google 搜索
3. 在团队群里问问队友
4. 查看项目的 Issues 区，看看别人有没有遇到类似问题

---

## 常用命令汇总

### 项目相关
```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 检查代码规范
```

### Git 相关
```bash
git status                          # 查看状态
git add .                           # 添加所有修改
git commit -m "说明"                # 提交修改
git push                            # 推送到远程
git pull                            # 拉取最新代码
git checkout -b 分支名              # 创建并切换分支
git branch                          # 查看所有分支
```

---

## 项目负责人

如有任何问题，请联系项目负责人或在 Gitee Issues 中提问。

## 许可证

本项目仅供学习使用。

---

**开始你的编程之旅吧！加油！💪**

记住：
- 不懂就问，没有愚蠢的问题
- 多动手，多实践，多犯错（这里就是练习的地方）
- 和队友互相帮助，共同进步
