#!/usr/bin/env node
/**
 * Flarum MCP Server
 *
 * 提供对 Flarum 论坛的增删改查操作
 *
 * 环境变量：
 * - FLARUM_BASE_URL: Flarum 论坛的 URL（默认：http://localhost）
 * - FLARUM_USERNAME: 用户名或邮箱（可选，用于自动登录）
 * - FLARUM_PASSWORD: 密码（可选，用于自动登录）
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";
import { flarumClient } from "./flarum-client.js";
// 创建 MCP 服务器
const server = new Server({
    name: "flarum-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// 注册所有工具
registerTools(server);
// 自动登录（优先使用缓存的 Token）
async function autoLogin() {
    // 1. 尝试加载缓存的 Token
    if (flarumClient.loadCachedToken()) {
        console.error("发现缓存的 Token，正在验证...");
        // 验证 Token 是否有效
        const isValid = await flarumClient.validateToken();
        if (isValid) {
            console.error("✓ 使用缓存的 Token 登录成功");
            return;
        }
        else {
            console.error("缓存的 Token 已失效，尝试重新登录...");
        }
    }
    // 2. 如果没有有效缓存，使用环境变量登录
    const username = process.env.FLARUM_USERNAME;
    const password = process.env.FLARUM_PASSWORD;
    if (username && password) {
        try {
            const result = await flarumClient.login(username, password, true);
            console.error(`✓ 登录成功，用户ID: ${result.userId}`);
        }
        catch (error) {
            console.error(`✗ 登录失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// 启动服务器
async function main() {
    console.error("Flarum MCP Server 正在启动...");
    console.error(`论坛地址: ${process.env.FLARUM_BASE_URL || "http://localhost"}`);
    // 尝试自动登录
    await autoLogin();
    // 连接传输层
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Flarum MCP Server 已就绪");
}
main().catch((error) => {
    console.error("服务器启动失败:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map