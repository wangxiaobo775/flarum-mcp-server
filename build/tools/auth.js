/**
 * 认证相关 MCP 工具
 */
import { z } from "zod";
import { flarumClient } from "../flarum-client.js";
/**
 * 注册认证工具
 */
export function registerAuthTools(server) {
    // 登录工具
    server.tool("flarum_login", "登录 Flarum 论坛获取访问令牌", {
        identification: z
            .string()
            .describe("用户名或邮箱地址"),
        password: z
            .string()
            .describe("用户密码"),
        remember: z
            .boolean()
            .optional()
            .default(false)
            .describe("是否记住登录（延长 Token 有效期至 5 年）"),
    }, async ({ identification, password, remember }) => {
        try {
            const result = await flarumClient.login(identification, password, remember);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "登录成功",
                            userId: result.userId,
                            tokenPreview: `${result.token.substring(0, 8)}...`,
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
                        text: `登录失败: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    // 登出工具
    server.tool("flarum_logout", "登出 Flarum 论坛，清除当前会话", {}, async () => {
        flarumClient.logout();
        return {
            content: [
                {
                    type: "text",
                    text: "已成功登出",
                },
            ],
        };
    });
    // 检查登录状态
    server.tool("flarum_check_auth", "检查当前登录状态", {}, async () => {
        const isAuthenticated = flarumClient.isAuthenticated();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        isAuthenticated,
                        message: isAuthenticated
                            ? "已登录，可以执行需要认证的操作"
                            : "未登录，请先使用 flarum_login 工具登录",
                    }, null, 2),
                },
            ],
        };
    });
}
//# sourceMappingURL=auth.js.map