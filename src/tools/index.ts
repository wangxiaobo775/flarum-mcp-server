/**
 * MCP 工具定义和处理
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type CallToolResult,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { flarumClient } from "../flarum-client.js";

/**
 * 工具定义列表
 */
const tools: Tool[] = [
  // ==================== 认证工具 ====================
  {
    name: "flarum_login",
    description: "登录 Flarum 论坛获取访问令牌",
    inputSchema: {
      type: "object",
      properties: {
        identification: {
          type: "string",
          description: "用户名或邮箱地址",
        },
        password: {
          type: "string",
          description: "用户密码",
        },
        remember: {
          type: "boolean",
          description: "是否记住登录（延长 Token 有效期至 5 年）",
          default: false,
        },
      },
      required: ["identification", "password"],
    },
  },
  {
    name: "flarum_logout",
    description: "登出 Flarum 论坛，清除当前会话",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "flarum_check_auth",
    description: "检查当前登录状态",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ==================== 讨论工具 ====================
  {
    name: "flarum_list_discussions",
    description: "获取论坛讨论列表，支持按用户、标签过滤",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "返回结果数量（1-50）",
          default: 20,
        },
        offset: {
          type: "number",
          description: "分页偏移量",
          default: 0,
        },
        sort: {
          type: "string",
          description: "排序方式：-lastPostedAt, -createdAt, -commentCount",
          default: "-lastPostedAt",
        },
        search: {
          type: "string",
          description: "搜索关键词",
        },
        userId: {
          type: "string",
          description: "按用户 ID 过滤（获取指定用户发布的讨论）",
        },
        username: {
          type: "string",
          description: "按用户名过滤（获取指定用户发布的讨论）。注意：论坛用户名为中文姓名的拼音全拼（无空格、小写），例如「张三」应转换为「zhangsan」，「王小明」应转换为「wangxiaoming」。如果用户输入中文名，请先转换为拼音再搜索。",
        },
        tag: {
          type: "string",
          description: "按标签 slug 过滤（获取指定标签下的讨论）",
        },
        createdAfter: {
          type: "string",
          description: "筛选创建时间晚于此日期的讨论（格式：YYYY-MM-DD，例如 2024-01-01）",
        },
        createdBefore: {
          type: "string",
          description: "筛选创建时间早于此日期的讨论（格式：YYYY-MM-DD，例如 2024-12-31）",
        },
      },
    },
  },
  {
    name: "flarum_get_discussion",
    description: "获取单个讨论的详细信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "讨论 ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "flarum_create_discussion",
    description: "创建新的讨论主题（需要先登录）",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "讨论标题",
        },
        content: {
          type: "string",
          description: "讨论内容（支持 Markdown 格式）",
        },
        tagIds: {
          type: "array",
          items: { type: "string" },
          description: "标签 ID 数组",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "flarum_update_discussion",
    description: "更新讨论信息（需要先登录，且只能编辑自己的讨论）",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "讨论 ID",
        },
        title: {
          type: "string",
          description: "新的讨论标题",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "flarum_delete_discussion",
    description: "删除讨论（需要先登录，且只能删除自己的讨论）",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "讨论 ID",
        },
        permanent: {
          type: "boolean",
          description: "是否永久删除（默认 false 为软删除/隐藏，true 需要管理员权限）",
          default: false,
        },
      },
      required: ["id"],
    },
  },
  {
    name: "flarum_list_tags",
    description: "获取论坛所有标签",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ==================== 用户工具 ====================
  {
    name: "flarum_list_users",
    description: "获取论坛用户列表",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "返回结果数量（1-50）",
          default: 20,
        },
        offset: {
          type: "number",
          description: "分页偏移量",
          default: 0,
        },
        search: {
          type: "string",
          description: "搜索关键词（匹配用户名或显示名）",
        },
      },
    },
  },
  {
    name: "flarum_get_user",
    description: "获取单个用户的详细信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "用户 ID",
        },
      },
      required: ["id"],
    },
  },

  // ==================== 帖子工具 ====================
  {
    name: "flarum_list_posts",
    description: "获取指定讨论的所有回复",
    inputSchema: {
      type: "object",
      properties: {
        discussionId: {
          type: "string",
          description: "讨论 ID",
        },
        limit: {
          type: "number",
          description: "返回结果数量（1-50）",
          default: 20,
        },
        offset: {
          type: "number",
          description: "分页偏移量",
          default: 0,
        },
      },
      required: ["discussionId"],
    },
  },
  {
    name: "flarum_get_post",
    description: "获取单个帖子的详细信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "帖子 ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "flarum_create_post",
    description: "在讨论中创建新的回复（需要先登录）",
    inputSchema: {
      type: "object",
      properties: {
        discussionId: {
          type: "string",
          description: "讨论 ID",
        },
        content: {
          type: "string",
          description: "回复内容（支持 Markdown 格式）",
        },
      },
      required: ["discussionId", "content"],
    },
  },
  {
    name: "flarum_update_post",
    description: "更新帖子内容（需要先登录，且只能编辑自己的帖子）",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "帖子 ID",
        },
        content: {
          type: "string",
          description: "新的帖子内容（支持 Markdown 格式）",
        },
      },
      required: ["id", "content"],
    },
  },
  {
    name: "flarum_delete_post",
    description: "删除帖子（需要先登录，且只能删除自己的帖子）",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "帖子 ID",
        },
        permanent: {
          type: "boolean",
          description: "是否永久删除（默认 false 为软删除/隐藏，true 需要管理员权限）",
          default: false,
        },
      },
      required: ["id"],
    },
  },
];

/**
 * 工具调用处理器
 */
async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    switch (name) {
      // ==================== 认证工具 ====================
      case "flarum_login": {
        const result = await flarumClient.login(
          args.identification as string,
          args.password as string,
          args.remember as boolean | undefined
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "登录成功",
                  userId: result.userId,
                  tokenPreview: `${result.token.substring(0, 8)}...`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_logout": {
        flarumClient.logout();
        return {
          content: [{ type: "text", text: "已成功登出" }],
        };
      }

      case "flarum_check_auth": {
        const isAuthenticated = flarumClient.isAuthenticated();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  isAuthenticated,
                  message: isAuthenticated
                    ? "已登录，可以执行需要认证的操作"
                    : "未登录，请先使用 flarum_login 工具登录",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ==================== 讨论工具 ====================
      case "flarum_list_discussions": {
        const discussions = await flarumClient.getDiscussions({
          limit: (args.limit as number) || 20,
          offset: (args.offset as number) || 0,
          sort: (args.sort as string) || "-lastPostedAt",
          search: args.search as string | undefined,
          userId: args.userId as string | undefined,
          username: args.username as string | undefined,
          tag: args.tag as string | undefined,
          createdAfter: args.createdAfter as string | undefined,
          createdBefore: args.createdBefore as string | undefined,
        });

        const formatted = discussions.map((d) => ({
          id: d.id,
          title: d.title,
          author: d.author?.displayName || "未知",
          commentCount: d.commentCount,
          createdAt: d.createdAt,
          lastPostedAt: d.lastPostedAt,
          tags: d.tags?.map((t) => t.name).join(", ") || "",
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { total: formatted.length, discussions: formatted },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_get_discussion": {
        const discussion = await flarumClient.getDiscussion(args.id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: discussion.id,
                  title: discussion.title,
                  author: discussion.author?.displayName || "未知",
                  commentCount: discussion.commentCount,
                  participantCount: discussion.participantCount,
                  createdAt: discussion.createdAt,
                  lastPostedAt: discussion.lastPostedAt,
                  tags: discussion.tags?.map((t) => t.name) || [],
                  firstPost: discussion.firstPost
                    ? {
                        id: discussion.firstPost.id,
                        content: discussion.firstPost.content,
                      }
                    : null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_create_discussion": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const discussion = await flarumClient.createDiscussion({
          title: args.title as string,
          content: args.content as string,
          tagIds: args.tagIds as string[] | undefined,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "讨论创建成功",
                  discussion: {
                    id: discussion.id,
                    title: discussion.title,
                    slug: discussion.slug,
                    createdAt: discussion.createdAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_update_discussion": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const updatedDiscussion = await flarumClient.updateDiscussion(
          args.id as string,
          { title: args.title as string | undefined }
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "讨论更新成功",
                  discussion: {
                    id: updatedDiscussion.id,
                    title: updatedDiscussion.title,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_delete_discussion": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const permanentDiscussion = (args.permanent as boolean) || false;
        await flarumClient.deleteDiscussion(args.id as string, permanentDiscussion);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: permanentDiscussion
                    ? `讨论 ${args.id} 已永久删除`
                    : `讨论 ${args.id} 已隐藏（软删除）`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_list_tags": {
        const tags = await flarumClient.getTags();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: tags.length,
                  tags: tags.map((t) => ({
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    color: t.color,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ==================== 用户工具 ====================
      case "flarum_list_users": {
        const users = await flarumClient.getUsers({
          limit: (args.limit as number) || 20,
          offset: (args.offset as number) || 0,
          search: args.search as string | undefined,
        });

        const formattedUsers = users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          joinTime: u.joinTime,
          discussionCount: u.discussionCount,
          commentCount: u.commentCount,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { total: formattedUsers.length, users: formattedUsers },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_get_user": {
        const user = await flarumClient.getUser(args.id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: user.id,
                  username: user.username,
                  displayName: user.displayName,
                  avatarUrl: user.avatarUrl,
                  joinTime: user.joinTime,
                  discussionCount: user.discussionCount,
                  commentCount: user.commentCount,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ==================== 帖子工具 ====================
      case "flarum_list_posts": {
        const posts = await flarumClient.getPosts(
          args.discussionId as string,
          {
            limit: (args.limit as number) || 20,
            offset: (args.offset as number) || 0,
          }
        );

        const formattedPosts = posts.map((p) => ({
          id: p.id,
          number: p.number,
          author: p.author?.displayName || "未知",
          content: p.content,
          createdAt: p.createdAt,
          editedAt: p.editedAt,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  discussionId: args.discussionId,
                  total: formattedPosts.length,
                  posts: formattedPosts,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_get_post": {
        const post = await flarumClient.getPost(args.id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: post.id,
                  number: post.number,
                  author: post.author?.displayName || "未知",
                  content: post.content,
                  contentHtml: post.contentHtml,
                  createdAt: post.createdAt,
                  editedAt: post.editedAt,
                  discussionId: post.discussionId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_create_post": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const newPost = await flarumClient.createPost({
          discussionId: args.discussionId as string,
          content: args.content as string,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "回复创建成功",
                  post: {
                    id: newPost.id,
                    number: newPost.number,
                    createdAt: newPost.createdAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_update_post": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const updatedPost = await flarumClient.updatePost(args.id as string, {
          content: args.content as string,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "帖子更新成功",
                  post: {
                    id: updatedPost.id,
                    number: updatedPost.number,
                    editedAt: updatedPost.editedAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "flarum_delete_post": {
        if (!flarumClient.isAuthenticated()) {
          return {
            content: [
              { type: "text", text: "错误：请先使用 flarum_login 工具登录" },
            ],
            isError: true,
          };
        }

        const permanent = (args.permanent as boolean) || false;
        await flarumClient.deletePost(args.id as string, permanent);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: permanent
                    ? `帖子 ${args.id} 已永久删除`
                    : `帖子 ${args.id} 已隐藏（软删除）`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`未知工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `操作失败: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 注册所有 MCP 工具
 */
export function registerTools(server: Server): void {
  // 列出工具
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // 处理工具调用
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;
      return handleToolCall(name, (args || {}) as Record<string, unknown>);
    }
  );
}
