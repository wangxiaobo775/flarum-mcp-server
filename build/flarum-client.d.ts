/**
 * Flarum API 客户端
 * 封装所有与 Flarum 论坛的 HTTP 交互
 */
import type { LoginResult, Discussion, Post, Tag, User, ListParams, CreateDiscussionParams, UpdateDiscussionParams, CreatePostParams, UpdatePostParams } from "./types.js";
export declare class FlarumClient {
    private baseUrl;
    private token;
    private userId;
    private cacheFilePath;
    constructor(baseUrl?: string);
    /**
     * 从文件加载缓存的 Token
     */
    loadCachedToken(): boolean;
    /**
     * 保存 Token 到文件
     */
    private saveCachedToken;
    /**
     * 清除缓存的 Token
     */
    clearCachedToken(): void;
    /**
     * 验证当前 Token 是否有效
     */
    validateToken(): Promise<boolean>;
    /**
     * 设置认证 Token
     */
    setToken(token: string, userId?: string): void;
    /**
     * 获取当前 Token
     */
    getToken(): string | null;
    /**
     * 检查是否已登录
     */
    isAuthenticated(): boolean;
    /**
     * 构建请求头
     */
    private getHeaders;
    /**
     * 发送 HTTP 请求
     */
    private request;
    /**
     * 登录获取 Token
     */
    login(identification: string, password: string, remember?: boolean): Promise<LoginResult>;
    /**
     * 登出
     */
    logout(): void;
    /**
     * 获取讨论列表
     */
    getDiscussions(params?: ListParams): Promise<Discussion[]>;
    /**
     * 获取单个讨论
     */
    getDiscussion(id: string): Promise<Discussion>;
    /**
     * 创建讨论
     */
    createDiscussion(params: CreateDiscussionParams): Promise<Discussion>;
    /**
     * 更新讨论
     */
    updateDiscussion(id: string, params: UpdateDiscussionParams): Promise<Discussion>;
    /**
     * 删除讨论
     * @param id 讨论 ID
     * @param permanent 是否永久删除（默认 false，使用软删除/隐藏）
     */
    deleteDiscussion(id: string, permanent?: boolean): Promise<void>;
    /**
     * 获取讨论的帖子列表
     */
    getPosts(discussionId: string, params?: ListParams): Promise<Post[]>;
    /**
     * 获取单个帖子
     */
    getPost(id: string): Promise<Post>;
    /**
     * 创建帖子（回复）
     */
    createPost(params: CreatePostParams): Promise<Post>;
    /**
     * 更新帖子
     */
    updatePost(id: string, params: UpdatePostParams): Promise<Post>;
    /**
     * 删除帖子
     * @param id 帖子 ID
     * @param permanent 是否永久删除（默认 false，使用软删除/隐藏）
     */
    deletePost(id: string, permanent?: boolean): Promise<void>;
    /**
     * 获取所有标签
     */
    getTags(): Promise<Tag[]>;
    /**
     * 获取用户列表
     */
    getUsers(params?: ListParams): Promise<User[]>;
    /**
     * 获取单个用户
     */
    getUser(id: string): Promise<User>;
    /**
     * 解析讨论数据
     */
    private parseDiscussions;
    /**
     * 解析帖子数据
     */
    private parsePosts;
    /**
     * 解析标签数据
     */
    private parseTags;
    /**
     * 解析用户数据
     */
    private parseUsers;
}
export declare const flarumClient: FlarumClient;
//# sourceMappingURL=flarum-client.d.ts.map