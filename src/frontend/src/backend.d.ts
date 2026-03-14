import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Notification {
    id: bigint;
    notificationType: NotificationType;
    createdAt: bigint;
    read: boolean;
    recipient: Principal;
    referenceId: bigint;
    message: string;
}
export interface Comment {
    id: bigint;
    content: string;
    createdAt: bigint;
    authorName: string;
    author: Principal;
    postId: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Post {
    id: bigint;
    title: string;
    content: string;
    published: boolean;
    createdAt: bigint;
    authorName: string;
    author: Principal;
    updatedAt: bigint;
}
export enum NotificationType {
    like = "like",
    comment = "comment",
    follow = "follow"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: bigint, authorName: string, content: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(title: string, content: string, authorName: string, published: boolean): Promise<bigint>;
    deleteComment(id: bigint): Promise<void>;
    deletePost(id: bigint): Promise<void>;
    followUser(user: Principal): Promise<void>;
    getAllPublishedPosts(): Promise<Array<Post>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPost(id: bigint): Promise<Post | null>;
    getPostComments(postId: bigint): Promise<Array<Comment>>;
    getPostLikes(postId: bigint): Promise<bigint>;
    getUserFollowers(user: Principal): Promise<Array<Principal>>;
    getUserFollowing(user: Principal): Promise<Array<Principal>>;
    getUserNotifications(): Promise<Array<Notification>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasLikedPost(postId: bigint): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    markAllNotificationsAsRead(): Promise<void>;
    markNotificationAsRead(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unfollowUser(user: Principal): Promise<void>;
    unlikePost(postId: bigint): Promise<void>;
    updatePost(id: bigint, title: string, content: string, published: boolean): Promise<void>;
}
