帮我进行 Git 提交，遵循以下步骤：

## 提交流程

1. **查看状态**：并行执行以下命令了解当前状态
   - 运行 `git status` 查看所有未跟踪和已修改的文件
   - 运行 `git diff` 查看未暂存的修改
   - 运行 `git diff --staged` 查看已暂存的修改
   - 运行 `git log --oneline -5` 查看最近的提交记录，学习提交风格

2. **分析修改**：
   - 仔细分析所有变更内容
   - 识别修改的性质（新功能、修复、重构、文档、配置等）
   - 确保没有敏感文件（.env、密钥等）

3. **起草提交信息**：
   - 使用中文编写提交信息
   - 格式：`<type>: <简短描述>`
   - type 类型：
     - `feat`: 新功能
     - `fix`: 修复 bug
     - `docs`: 文档更新
     - `style`: 代码格式调整（不影响功能）
     - `refactor`: 重构代码
     - `perf`: 性能优化
     - `test`: 测试相关
     - `chore`: 构建/工具/依赖等杂项
   - 提交信息要准确反映"为什么"而不只是"做了什么"
   - 如果修改较多，添加详细说明（使用空行分隔）

4. **执行提交**：并行执行以下命令
   - 使用 `git add` 添加相关文件到暂存区（优先指定具体文件而不是 `git add .`）
   - 使用 `git commit` 提交，消息末尾添加：
     ```
     Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
     ```
   - 提交后运行 `git status` 确认提交成功

5. **推送到远程**：
   - 询问用户是否需要推送到远程仓库
   - 如果需要推送，执行 `git push` 或 `git push origin main`
   - 如果有多个远程仓库，询问是否需要推送到所有仓库

## 注意事项

- 使用 HEREDOC 格式传递提交信息，确保格式正确
- 不要使用 `--no-verify` 等跳过钩子的选项
- 不要使用 `--amend` 修改提交，除非用户明确要求
- 不要强制推送到 main/master 分支
- 提交前确认没有包含不应提交的文件

## 示例

```bash
git commit -m "$(cat <<'EOF'
feat: 添加用户登录功能

- 实现登录表单组件
- 添加表单验证逻辑
- 集成 API 认证接口

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```
