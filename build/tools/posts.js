/**
 * 帖子/回复（Post）相关 MCP 工具
 */
import { z } from "zod";
import { flarumClient } from "../flarum-client.js";
/**
 * 注册帖子工具
 */
export function registerPostTools(server) {
    // 获取讨论的帖子列表
    server.tool("flarum_list_posts", "获取指定讨论的所有回复", {
        discussionId: z
            .string()
            .describe("讨论 ID"),
        limit: z
            .number()
            .int()
            .min(1)
            .max(50)
            .optional()
            .default(20)
            .describe("返回结果数量（1-50）"),
        offset: z
            .number()
            .int()
            .min(0)
            .optional()
            .default(0)
            .describe("分页偏移量"),
    }, async ({ discussionId, limit, offset }) => {
        try {
            const posts = await flarumClient.getPosts(discussionId, {
                limit,
                offset,
            });
            // 格式化输出
            const formatted = posts.map((p) => ({
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
                        text: JSON.stringify({
                            discussionId,
                            total: formatted.length,
                            posts: formatted,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `获取帖子列表失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 获取单个帖子
    server.tool("flarum_get_post", "获取单个帖子的详细信息", {
        id: z
            .string()
            .describe("帖子 ID"),
    }, async ({ id }) => {
        try {
            const post = await flarumClient.getPost(id);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            id: post.id,
                            number: post.number,
                            author: post.author?.displayName || "未知",
                            content: post.content,
                            contentHtml: post.contentHtml,
                            createdAt: post.createdAt,
                            editedAt: post.editedAt,
                            discussionId: post.discussionId,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `获取帖子详情失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 创建帖子（回复）
    server.tool("flarum_create_post", "在讨论中创建新的回复（需要先登录）", {
        discussionId: z
            .string()
            .describe("讨论 ID"),
        content: z
            .string()
            .min(1)
            .describe("回复内容（支持 Markdown 格式）"),
    }, async ({ discussionId, content }) => {
        try {
            if (!flarumClient.isAuthenticated()) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "错误：请先使用 flarum_login 工具登录",
                        },
                    ],
                    isError: true,
                };
            }
            const post = await flarumClient.createPost({
                discussionId,
                content,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "回复创建成功",
                            post: {
                                id: post.id,
                                number: post.number,
                                createdAt: post.createdAt,
                            },
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `创建回复失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 更新帖子
    server.tool("flarum_update_post", "更新帖子内容（需要先登录，且只能编辑自己的帖子）", {
        id: z
            .string()
            .describe("帖子 ID"),
        content: z
            .string()
            .min(1)
            .describe("新的帖子内容（支持 Markdown 格式）"),
    }, async ({ id, content }) => {
        try {
            if (!flarumClient.isAuthenticated()) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "错误：请先使用 flarum_login 工具登录",
                        },
                    ],
                    isError: true,
                };
            }
            const post = await flarumClient.updatePost(id, { content });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "帖子更新成功",
                            post: {
                                id: post.id,
                                number: post.number,
                                editedAt: post.editedAt,
                            },
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `更新帖子失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 删除帖子
    server.tool("flarum_delete_post", "删除帖子（需要先登录，且只能删除自己的帖子）", {
        id: z
            .string()
            .describe("帖子 ID"),
    }, async ({ id }) => {
        try {
            if (!flarumClient.isAuthenticated()) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "错误：请先使用 flarum_login 工具登录",
                        },
                    ],
                    isError: true,
                };
            }
            await flarumClient.deletePost(id);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `帖子 ${id} 已成功删除`,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `删除帖子失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=posts.js.map