/**
 * 讨论（Discussion）相关 MCP 工具
 */
import { z } from "zod";
import { flarumClient } from "../flarum-client.js";
/**
 * 注册讨论工具
 */
export function registerDiscussionTools(server) {
    // 获取讨论列表
    server.tool("flarum_list_discussions", "获取论坛讨论列表", {
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
        sort: z
            .enum(["-lastPostedAt", "-createdAt", "-commentCount", "lastPostedAt", "createdAt", "commentCount"])
            .optional()
            .default("-lastPostedAt")
            .describe("排序方式：- 前缀表示降序"),
        search: z
            .string()
            .optional()
            .describe("搜索关键词"),
    }, async ({ limit, offset, sort, search }) => {
        try {
            const discussions = await flarumClient.getDiscussions({
                limit,
                offset,
                sort,
                search,
            });
            // 格式化输出
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
                        text: JSON.stringify({
                            total: formatted.length,
                            discussions: formatted,
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
                        text: `获取讨论列表失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 获取单个讨论
    server.tool("flarum_get_discussion", "获取单个讨论的详细信息", {
        id: z
            .string()
            .describe("讨论 ID"),
    }, async ({ id }) => {
        try {
            const discussion = await flarumClient.getDiscussion(id);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
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
                        text: `获取讨论详情失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 创建讨论
    server.tool("flarum_create_discussion", "创建新的讨论主题（需要先登录）", {
        title: z
            .string()
            .min(1)
            .max(200)
            .describe("讨论标题"),
        content: z
            .string()
            .min(1)
            .describe("讨论内容（支持 Markdown 格式）"),
        tagIds: z
            .array(z.string())
            .optional()
            .describe("标签 ID 数组"),
    }, async ({ title, content, tagIds }) => {
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
            const discussion = await flarumClient.createDiscussion({
                title,
                content,
                tagIds,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "讨论创建成功",
                            discussion: {
                                id: discussion.id,
                                title: discussion.title,
                                slug: discussion.slug,
                                createdAt: discussion.createdAt,
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
                        text: `创建讨论失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 更新讨论
    server.tool("flarum_update_discussion", "更新讨论信息（需要先登录，且只能编辑自己的讨论）", {
        id: z
            .string()
            .describe("讨论 ID"),
        title: z
            .string()
            .min(1)
            .max(200)
            .optional()
            .describe("新的讨论标题"),
    }, async ({ id, title }) => {
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
            const discussion = await flarumClient.updateDiscussion(id, { title });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "讨论更新成功",
                            discussion: {
                                id: discussion.id,
                                title: discussion.title,
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
                        text: `更新讨论失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 删除讨论
    server.tool("flarum_delete_discussion", "删除讨论（需要先登录，且只能删除自己的讨论）", {
        id: z
            .string()
            .describe("讨论 ID"),
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
            await flarumClient.deleteDiscussion(id);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: `讨论 ${id} 已成功删除`,
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
                        text: `删除讨论失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 获取标签列表
    server.tool("flarum_list_tags", "获取论坛所有标签", {}, async () => {
        try {
            const tags = await flarumClient.getTags();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            total: tags.length,
                            tags: tags.map((t) => ({
                                id: t.id,
                                name: t.name,
                                slug: t.slug,
                                color: t.color,
                            })),
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
                        text: `获取标签列表失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
}
//# sourceMappingURL=discussions.js.map