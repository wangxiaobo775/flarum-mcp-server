# Flarum MCP Server

[English](#english) | [中文](#中文)

---

## English

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Flarum](https://flarum.org/) forums. This allows Claude Code and other MCP clients to interact with Flarum forums - creating, reading, updating, and deleting discussions, posts, users, and tags.

### Installation

```bash
npm install -g flarum-mcp-server
```

### Configuration

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "flarum": {
      "command": "flarum-mcp-server",
      "env": {
        "FLARUM_BASE_URL": "https://your-forum.com",
        "FLARUM_USERNAME": "your-email@example.com",
        "FLARUM_PASSWORD": "your-password"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FLARUM_BASE_URL` | Yes | Your Flarum forum URL |
| `FLARUM_USERNAME` | No | Email or username for auto-login |
| `FLARUM_PASSWORD` | No | Password for auto-login |

### Available Tools

#### Discussions

| Tool | Description |
|------|-------------|
| `flarum_list_discussions` | List discussions (supports filtering by user, tag, date) |
| `flarum_get_discussion` | Get discussion details |
| `flarum_create_discussion` | Create a new discussion |
| `flarum_update_discussion` | Update a discussion |
| `flarum_delete_discussion` | Delete/hide a discussion |

#### Posts

| Tool | Description |
|------|-------------|
| `flarum_list_posts` | List posts in a discussion |
| `flarum_get_post` | Get post details |
| `flarum_create_post` | Create a reply |
| `flarum_update_post` | Update a post |
| `flarum_delete_post` | Delete/hide a post |

#### Users & Tags

| Tool | Description |
|------|-------------|
| `flarum_list_users` | List users (supports search) |
| `flarum_get_user` | Get user details |
| `flarum_list_tags` | List all tags |

#### Authentication

| Tool | Description |
|------|-------------|
| `flarum_login` | Login to the forum |
| `flarum_logout` | Logout |
| `flarum_check_auth` | Check authentication status |

### Usage Examples

In Claude Code, you can say:

- "List the latest 10 discussions"
- "Create a new discussion titled 'Hello World' with content 'This is my first post'"
- "Reply to discussion 123 with 'Thanks for sharing!'"
- "Show me all discussions by user john"
- "Get discussions created after 2024-01-01"

### Features

- **Auto-login**: Configure credentials in environment variables for automatic authentication
- **Token caching**: Tokens are cached locally (`~/.flarum-mcp-token.json`) with 5-year expiration
- **Filtering**: Filter discussions by user, tag, and date range
- **Soft delete**: Default delete operation hides content (recoverable), with option for permanent deletion

### Requirements

- Node.js >= 18.0.0
- A Flarum forum with API access

### Development

```bash
# Clone and install dependencies
git clone https://github.com/wangxiaobo775/flarum-mcp-server.git
cd flarum-mcp-server
npm install

# Build
npm run build

# Watch mode
npm run dev
```

### License

MIT

---

## 中文

一个用于 [Flarum](https://flarum.org/) 论坛的 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 服务器。让 Claude Code 和其他 MCP 客户端能够与 Flarum 论坛交互，实现讨论、帖子、用户和标签的增删改查操作。

### 安装

```bash
npm install -g flarum-mcp-server
```

### 配置

在 Claude Code 设置文件（`~/.claude/settings.json`）中添加：

```json
{
  "mcpServers": {
    "flarum": {
      "command": "flarum-mcp-server",
      "env": {
        "FLARUM_BASE_URL": "https://your-forum.com",
        "FLARUM_USERNAME": "你的邮箱",
        "FLARUM_PASSWORD": "你的密码"
      }
    }
  }
}
```

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `FLARUM_BASE_URL` | 是 | Flarum 论坛地址 |
| `FLARUM_USERNAME` | 否 | 用于自动登录的邮箱或用户名 |
| `FLARUM_PASSWORD` | 否 | 用于自动登录的密码 |

### 可用工具

#### 讨论

| 工具 | 功能 |
|------|------|
| `flarum_list_discussions` | 获取讨论列表（支持按用户、标签、时间过滤） |
| `flarum_get_discussion` | 获取讨论详情 |
| `flarum_create_discussion` | 创建新讨论 |
| `flarum_update_discussion` | 更新讨论 |
| `flarum_delete_discussion` | 删除/隐藏讨论 |

#### 帖子

| 工具 | 功能 |
|------|------|
| `flarum_list_posts` | 获取讨论的回复列表 |
| `flarum_get_post` | 获取帖子详情 |
| `flarum_create_post` | 创建回复 |
| `flarum_update_post` | 更新帖子 |
| `flarum_delete_post` | 删除/隐藏帖子 |

#### 用户和标签

| 工具 | 功能 |
|------|------|
| `flarum_list_users` | 获取用户列表（支持搜索） |
| `flarum_get_user` | 获取用户详情 |
| `flarum_list_tags` | 获取所有标签 |

#### 认证

| 工具 | 功能 |
|------|------|
| `flarum_login` | 登录论坛 |
| `flarum_logout` | 登出 |
| `flarum_check_auth` | 检查登录状态 |

### 使用示例

在 Claude Code 中直接说：

- "获取最新的 10 条讨论"
- "创建一个新讨论，标题是《Hello World》，内容是《这是我的第一个帖子》"
- "在讨论 123 中回复：感谢分享！"
- "显示用户 zhangsan 的所有讨论"
- "获取 2024 年 1 月之后创建的讨论"

### 功能特性

- **自动登录**：在环境变量中配置账号密码，启动时自动登录
- **Token 缓存**：Token 本地缓存（`~/.flarum-mcp-token.json`），有效期 5 年
- **过滤功能**：支持按用户、标签、时间范围过滤讨论
- **软删除**：默认使用软删除（隐藏），可恢复；支持永久删除选项

### 系统要求

- Node.js >= 18.0.0
- 可访问 API 的 Flarum 论坛

### 开发

```bash
# 克隆并安装依赖
git clone https://github.com/wangxiaobo775/flarum-mcp-server.git
cd flarum-mcp-server
npm install

# 编译
npm run build

# 监听模式
npm run dev
```

### 许可证

MIT
