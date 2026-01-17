/**
 * Flarum API 类型定义
 */

// JSON:API 通用类型
export interface JsonApiResource<T = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: T;
  relationships?: Record<string, {
    data: { type: string; id: string } | { type: string; id: string }[] | null;
  }>;
}

export interface JsonApiResponse<T = Record<string, unknown>> {
  data: JsonApiResource<T> | JsonApiResource<T>[];
  included?: JsonApiResource[];
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export interface JsonApiError {
  status: string;
  code: string;
  detail: string;
  source?: {
    pointer?: string;
  };
}

export interface JsonApiErrorResponse {
  errors: JsonApiError[];
}

// 登录相关
export interface LoginResult {
  token: string;
  userId: string;
}

// 用户
export interface UserAttributes {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  slug: string;
  email?: string;
  joinTime?: string;
  discussionCount?: number;
  commentCount?: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  joinTime?: string;
  discussionCount?: number;
  commentCount?: number;
}

// 讨论
export interface DiscussionAttributes {
  title: string;
  slug: string;
  commentCount: number;
  participantCount: number;
  createdAt: string;
  lastPostedAt: string | null;
  lastPostNumber: number;
  canReply: boolean;
  canRename: boolean;
  canDelete: boolean;
  canHide: boolean;
  isSticky?: boolean;
  isLocked?: boolean;
}

export interface Discussion {
  id: string;
  title: string;
  slug: string;
  commentCount: number;
  participantCount: number;
  createdAt: string;
  lastPostedAt: string | null;
  author?: {
    id: string;
    username: string;
    displayName: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  firstPost?: {
    id: string;
    content: string;
    contentHtml: string;
  };
}

// 帖子
export interface PostAttributes {
  number: number;
  contentType: string;
  content: string;
  contentHtml: string;
  createdAt: string;
  editedAt: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  canHide?: boolean;
}

export interface Post {
  id: string;
  number: number;
  content: string;
  contentHtml: string;
  createdAt: string;
  editedAt: string | null;
  author?: {
    id: string;
    username: string;
    displayName: string;
  };
  discussionId?: string;
}

// 标签
export interface TagAttributes {
  name: string;
  description: string;
  slug: string;
  color: string;
  icon?: string;
  discussionCount: number;
  position?: number;
  isChild: boolean;
  isHidden: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

// 列表参数
export interface ListParams {
  limit?: number;
  offset?: number;
  sort?: string;
  search?: string;
  // 过滤参数
  userId?: string;      // 按用户 ID 过滤
  username?: string;    // 按用户名过滤
  tag?: string;         // 按标签 slug 过滤
  // 时间过滤参数
  createdAfter?: string;  // 创建时间晚于（格式：YYYY-MM-DD）
  createdBefore?: string; // 创建时间早于（格式：YYYY-MM-DD）
}

// 创建讨论参数
export interface CreateDiscussionParams {
  title: string;
  content: string;
  tagIds?: string[];
}

// 更新讨论参数
export interface UpdateDiscussionParams {
  title?: string;
  isSticky?: boolean;
  isLocked?: boolean;
}

// 创建帖子参数
export interface CreatePostParams {
  discussionId: string;
  content: string;
}

// 更新帖子参数
export interface UpdatePostParams {
  content: string;
}
