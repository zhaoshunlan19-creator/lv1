# AITOLL 使用示例

本目录包含 AITOLL API 的实际使用示例，可以直接参考或复制到项目中。

## 示例列表

1. **chat-example.tsx** - 简单的聊天界面示例
2. **image-gen-example.tsx** - 图像生成示例
3. **api-route-example.ts** - Next.js API 路由示例

## 使用方法

### 1. 复制客户端代码

```bash
cp .claude/skills/aitoll/client.ts lib/aitoll.ts
```

### 2. 配置 API Key

在 `.env.local` 中添加：
```env
AITOLL_API_KEY=your-key-here
```

### 3. 参考示例创建自己的功能

根据需求修改示例代码，集成到你的应用中。

## 注意事项

- 示例代码仅供参考，需要根据实际项目调整
- 确保已安装必要的依赖（Next.js, React, Tailwind CSS 等）
- API 调用应该在服务器端进行（API Routes），避免暴露 API Key
