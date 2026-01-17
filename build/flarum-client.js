/**
 * Flarum API 客户端
 * 封装所有与 Flarum 论坛的 HTTP 交互
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
export class FlarumClient {
    baseUrl;
    token = null;
    userId = null;
    cacheFilePath;
    constructor(baseUrl) {
        this.baseUrl = baseUrl || process.env.FLARUM_BASE_URL || "http://localhost";
        // 移除末尾斜杠
        this.baseUrl = this.baseUrl.replace(/\/$/, "");
        // 缓存文件路径：用户目录下的 .flarum-mcp-token.json
        this.cacheFilePath = join(homedir(), ".flarum-mcp-token.json");
    }
    /**
     * 从文件加载缓存的 Token
     */
    loadCachedToken() {
        try {
            if (!existsSync(this.cacheFilePath)) {
                return false;
            }
            const data = readFileSync(this.cacheFilePath, "utf-8");
            const cache = JSON.parse(data);
            // 验证是否是同一个论坛
            if (cache.baseUrl !== this.baseUrl) {
                console.error("缓存的 Token 来自不同的论坛，忽略");
                return false;
            }
            // 验证是否过期
            if (Date.now() > cache.expiresAt) {
                console.error("缓存的 Token 已过期");
                return false;
            }
            this.token = cache.token;
            this.userId = cache.userId;
            return true;
        }
        catch (error) {
            console.error("加载 Token 缓存失败:", error);
            return false;
        }
    }
    /**
     * 保存 Token 到文件
     */
    saveCachedToken() {
        if (!this.token || !this.userId) {
            return;
        }
        try {
            const cache = {
                token: this.token,
                userId: this.userId,
                baseUrl: this.baseUrl,
                createdAt: Date.now(),
                // 5年有效期（使用 remember=true 登录）
                expiresAt: Date.now() + 5 * 365 * 24 * 60 * 60 * 1000,
            };
            writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2), "utf-8");
            console.error(`Token 已缓存到: ${this.cacheFilePath}`);
        }
        catch (error) {
            console.error("保存 Token 缓存失败:", error);
        }
    }
    /**
     * 清除缓存的 Token
     */
    clearCachedToken() {
        try {
            if (existsSync(this.cacheFilePath)) {
                writeFileSync(this.cacheFilePath, "{}", "utf-8");
            }
        }
        catch (error) {
            console.error("清除 Token 缓存失败:", error);
        }
    }
    /**
     * 验证当前 Token 是否有效
     */
    async validateToken() {
        if (!this.token) {
            return false;
        }
        try {
            // 尝试访问需要认证的 API 来验证 Token
            await this.request("GET", "/api/users/me");
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 设置认证 Token
     */
    setToken(token, userId) {
        this.token = token;
        if (userId) {
            this.userId = userId;
        }
    }
    /**
     * 获取当前 Token
     */
    getToken() {
        return this.token;
    }
    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return this.token !== null;
    }
    /**
     * 构建请求头
     */
    getHeaders() {
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
        };
        if (this.token) {
            headers["Authorization"] = `Token ${this.token}`;
        }
        return headers;
    }
    /**
     * 发送 HTTP 请求
     */
    async request(method, endpoint, body) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: this.getHeaders(),
        };
        if (body && (method === "POST" || method === "PATCH")) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);
        // 处理 204 No Content
        if (response.status === 204) {
            return {};
        }
        const data = await response.json();
        if (!response.ok) {
            const errorData = data;
            const errorMessage = errorData.errors
                ?.map((e) => e.detail || e.code)
                .join(", ") || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    }
    // ==================== 认证 API ====================
    /**
     * 登录获取 Token
     */
    async login(identification, password, remember) {
        const endpoint = remember ? "/api/token?remember=1" : "/api/token";
        const result = await this.request("POST", endpoint, {
            identification,
            password,
        });
        // 保存 Token 到内存
        this.token = result.token;
        this.userId = result.userId;
        // 保存 Token 到文件缓存
        this.saveCachedToken();
        return result;
    }
    /**
     * 登出
     */
    logout() {
        this.token = null;
        this.userId = null;
        // 清除缓存文件
        this.clearCachedToken();
    }
    // ==================== 讨论 API ====================
    /**
     * 获取讨论列表
     */
    async getDiscussions(params) {
        const queryParts = [];
        if (params?.limit) {
            queryParts.push(`page[limit]=${params.limit}`);
        }
        if (params?.offset) {
            queryParts.push(`page[offset]=${params.offset}`);
        }
        if (params?.sort) {
            queryParts.push(`sort=${params.sort}`);
        }
        // 构建搜索查询（使用 Flarum Gambit 语法统一处理所有过滤条件）
        const searchParts = [];
        // 关键词搜索
        if (params?.search) {
            searchParts.push(params.search);
        }
        // 按用户过滤（使用 gambit 语法 author:username）
        if (params?.username) {
            searchParts.push(`author:${params.username}`);
        }
        else if (params?.userId) {
            searchParts.push(`author:${params.userId}`);
        }
        // 按标签过滤（使用 gambit 语法 tag:slug）
        if (params?.tag) {
            searchParts.push(`tag:${params.tag}`);
        }
        // 时间过滤（使用 gambit 语法 created:）
        if (params?.createdAfter && params?.createdBefore) {
            // 时间范围: created:YYYY-MM-DD..YYYY-MM-DD
            searchParts.push(`created:${params.createdAfter}..${params.createdBefore}`);
        }
        else if (params?.createdAfter) {
            // 晚于指定时间: created:>YYYY-MM-DD
            searchParts.push(`created:>${params.createdAfter}`);
        }
        else if (params?.createdBefore) {
            // 早于指定时间: created:<YYYY-MM-DD
            searchParts.push(`created:<${params.createdBefore}`);
        }
        // 将所有过滤条件组合到 filter[q] 参数
        if (searchParts.length > 0) {
            queryParts.push(`filter[q]=${encodeURIComponent(searchParts.join(" "))}`);
        }
        // 包含用户和标签信息
        queryParts.push("include=user,tags,firstPost");
        const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
        const response = await this.request("GET", `/api/discussions${query}`);
        return this.parseDiscussions(response);
    }
    /**
     * 获取单个讨论
     */
    async getDiscussion(id) {
        const response = await this.request("GET", `/api/discussions/${id}?include=user,tags,firstPost,posts`);
        const discussions = this.parseDiscussions(response);
        if (discussions.length === 0) {
            throw new Error(`Discussion ${id} not found`);
        }
        return discussions[0];
    }
    /**
     * 创建讨论
     */
    async createDiscussion(params) {
        const body = {
            data: {
                type: "discussions",
                attributes: {
                    title: params.title,
                    content: params.content,
                },
                relationships: {},
            },
        };
        // 添加标签
        if (params.tagIds && params.tagIds.length > 0) {
            body.data.relationships = {
                tags: {
                    data: params.tagIds.map((id) => ({ type: "tags", id })),
                },
            };
        }
        const response = await this.request("POST", "/api/discussions", body);
        const discussions = this.parseDiscussions(response);
        return discussions[0];
    }
    /**
     * 更新讨论
     */
    async updateDiscussion(id, params) {
        const attributes = {};
        if (params.title !== undefined) {
            attributes.title = params.title;
        }
        if (params.isSticky !== undefined) {
            attributes.isSticky = params.isSticky;
        }
        if (params.isLocked !== undefined) {
            attributes.isLocked = params.isLocked;
        }
        const body = {
            data: {
                type: "discussions",
                id,
                attributes,
            },
        };
        const response = await this.request("PATCH", `/api/discussions/${id}`, body);
        const discussions = this.parseDiscussions(response);
        return discussions[0];
    }
    /**
     * 删除讨论
     * @param id 讨论 ID
     * @param permanent 是否永久删除（默认 false，使用软删除/隐藏）
     */
    async deleteDiscussion(id, permanent = false) {
        if (permanent) {
            // 永久删除（需要管理员权限）
            await this.request("DELETE", `/api/discussions/${id}`);
        }
        else {
            // 软删除/隐藏（普通用户可以对自己的讨论执行）
            await this.request("PATCH", `/api/discussions/${id}`, {
                data: {
                    type: "discussions",
                    id,
                    attributes: {
                        isHidden: true,
                    },
                },
            });
        }
    }
    // ==================== 帖子 API ====================
    /**
     * 获取讨论的帖子列表
     */
    async getPosts(discussionId, params) {
        const queryParts = [`filter[discussion]=${discussionId}`];
        if (params?.limit) {
            queryParts.push(`page[limit]=${params.limit}`);
        }
        if (params?.offset) {
            queryParts.push(`page[offset]=${params.offset}`);
        }
        queryParts.push("include=user");
        const query = `?${queryParts.join("&")}`;
        const response = await this.request("GET", `/api/posts${query}`);
        return this.parsePosts(response, discussionId);
    }
    /**
     * 获取单个帖子
     */
    async getPost(id) {
        const response = await this.request("GET", `/api/posts/${id}?include=user,discussion`);
        const posts = this.parsePosts(response);
        if (posts.length === 0) {
            throw new Error(`Post ${id} not found`);
        }
        return posts[0];
    }
    /**
     * 创建帖子（回复）
     */
    async createPost(params) {
        const body = {
            data: {
                type: "posts",
                attributes: {
                    content: params.content,
                },
                relationships: {
                    discussion: {
                        data: {
                            type: "discussions",
                            id: params.discussionId,
                        },
                    },
                },
            },
        };
        const response = await this.request("POST", "/api/posts", body);
        const posts = this.parsePosts(response, params.discussionId);
        return posts[0];
    }
    /**
     * 更新帖子
     */
    async updatePost(id, params) {
        const body = {
            data: {
                type: "posts",
                id,
                attributes: {
                    content: params.content,
                },
            },
        };
        const response = await this.request("PATCH", `/api/posts/${id}`, body);
        const posts = this.parsePosts(response);
        return posts[0];
    }
    /**
     * 删除帖子
     * @param id 帖子 ID
     * @param permanent 是否永久删除（默认 false，使用软删除/隐藏）
     */
    async deletePost(id, permanent = false) {
        if (permanent) {
            // 永久删除（需要管理员权限）
            await this.request("DELETE", `/api/posts/${id}`);
        }
        else {
            // 软删除/隐藏（普通用户可以对自己的帖子执行）
            await this.request("PATCH", `/api/posts/${id}`, {
                data: {
                    type: "posts",
                    id,
                    attributes: {
                        isHidden: true,
                    },
                },
            });
        }
    }
    // ==================== 标签 API ====================
    /**
     * 获取所有标签
     */
    async getTags() {
        const response = await this.request("GET", "/api/tags");
        return this.parseTags(response);
    }
    // ==================== 用户 API ====================
    /**
     * 获取用户列表
     */
    async getUsers(params) {
        const queryParts = [];
        if (params?.limit) {
            queryParts.push(`page[limit]=${params.limit}`);
        }
        if (params?.offset) {
            queryParts.push(`page[offset]=${params.offset}`);
        }
        // 搜索用户名或显示名
        if (params?.search) {
            queryParts.push(`filter[q]=${encodeURIComponent(params.search)}`);
        }
        const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
        const response = await this.request("GET", `/api/users${query}`);
        return this.parseUsers(response);
    }
    /**
     * 获取单个用户
     */
    async getUser(id) {
        const response = await this.request("GET", `/api/users/${id}`);
        const users = this.parseUsers(response);
        if (users.length === 0) {
            throw new Error(`User ${id} not found`);
        }
        return users[0];
    }
    // ==================== 数据解析方法 ====================
    /**
     * 解析讨论数据
     */
    parseDiscussions(response) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        const included = response.included || [];
        // 建立 included 索引
        const includedMap = new Map();
        for (const item of included) {
            includedMap.set(`${item.type}:${item.id}`, item);
        }
        return data.map((item) => {
            const discussion = {
                id: item.id,
                title: item.attributes.title,
                slug: item.attributes.slug,
                commentCount: item.attributes.commentCount,
                participantCount: item.attributes.participantCount,
                createdAt: item.attributes.createdAt,
                lastPostedAt: item.attributes.lastPostedAt,
            };
            // 解析作者
            const userRef = item.relationships?.user?.data;
            if (userRef && !Array.isArray(userRef)) {
                const user = includedMap.get(`users:${userRef.id}`);
                if (user) {
                    const attrs = user.attributes;
                    discussion.author = {
                        id: userRef.id,
                        username: attrs.username,
                        displayName: attrs.displayName,
                    };
                }
            }
            // 解析标签
            const tagsRef = item.relationships?.tags?.data;
            if (tagsRef && Array.isArray(tagsRef)) {
                discussion.tags = tagsRef
                    .map((ref) => {
                    const tag = includedMap.get(`tags:${ref.id}`);
                    if (tag) {
                        const attrs = tag.attributes;
                        return {
                            id: ref.id,
                            name: attrs.name,
                            slug: attrs.slug,
                        };
                    }
                    return null;
                })
                    .filter((t) => t !== null);
            }
            // 解析首帖
            const firstPostRef = item.relationships?.firstPost?.data;
            if (firstPostRef && !Array.isArray(firstPostRef)) {
                const post = includedMap.get(`posts:${firstPostRef.id}`);
                if (post) {
                    const attrs = post.attributes;
                    discussion.firstPost = {
                        id: firstPostRef.id,
                        content: attrs.content,
                        contentHtml: attrs.contentHtml,
                    };
                }
            }
            return discussion;
        });
    }
    /**
     * 解析帖子数据
     */
    parsePosts(response, discussionId) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        const included = response.included || [];
        // 建立 included 索引
        const includedMap = new Map();
        for (const item of included) {
            includedMap.set(`${item.type}:${item.id}`, item);
        }
        return data.map((item) => {
            const post = {
                id: item.id,
                number: item.attributes.number,
                content: item.attributes.content,
                contentHtml: item.attributes.contentHtml,
                createdAt: item.attributes.createdAt,
                editedAt: item.attributes.editedAt,
                discussionId,
            };
            // 解析作者
            const userRef = item.relationships?.user?.data;
            if (userRef && !Array.isArray(userRef)) {
                const user = includedMap.get(`users:${userRef.id}`);
                if (user) {
                    const attrs = user.attributes;
                    post.author = {
                        id: userRef.id,
                        username: attrs.username,
                        displayName: attrs.displayName,
                    };
                }
            }
            // 解析讨论ID
            const discussionRef = item.relationships?.discussion?.data;
            if (discussionRef && !Array.isArray(discussionRef)) {
                post.discussionId = discussionRef.id;
            }
            return post;
        });
    }
    /**
     * 解析标签数据
     */
    parseTags(response) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        return data.map((item) => ({
            id: item.id,
            name: item.attributes.name,
            slug: item.attributes.slug,
            color: item.attributes.color,
        }));
    }
    /**
     * 解析用户数据
     */
    parseUsers(response) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        return data.map((item) => ({
            id: item.id,
            username: item.attributes.username,
            displayName: item.attributes.displayName,
            avatarUrl: item.attributes.avatarUrl,
            joinTime: item.attributes.joinTime,
            discussionCount: item.attributes.discussionCount,
            commentCount: item.attributes.commentCount,
        }));
    }
}
// 导出单例实例
export const flarumClient = new FlarumClient();
//# sourceMappingURL=flarum-client.js.map