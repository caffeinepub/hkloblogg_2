import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";

export function useUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      try {
        return await actor.getCallerUserRole();
      } catch {
        return UserRole.guest;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterOrClaimAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<UserRole> => {
      if (!actor) throw new Error("Inte inloggad");
      // registerOrClaimAdmin is a new backend function; cast to any until types regenerate
      return (actor as any).registerOrClaimAdmin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRole"] });
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useAllPosts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPublishedPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePost(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["post", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostComments(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["comments", postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPostComments(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostLikes(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["likes", postId.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getPostLikes(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useHasLiked(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["hasLiked", postId.toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasLikedPost(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLikePost(postId: bigint) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (!actor) throw new Error("Inte inloggad");
      if (liked) return actor.unlikePost(postId);
      return actor.likePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["likes", postId.toString()] });
      qc.invalidateQueries({ queryKey: ["hasLiked", postId.toString()] });
    },
  });
}

export function useAddComment(postId: bigint) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      authorName,
      content,
    }: { authorName: string; content: string }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.addComment(postId, authorName, content);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId.toString()] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
      authorName,
      published,
    }: {
      title: string;
      content: string;
      authorName: string;
      published: boolean;
    }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.createPost(title, content, authorName, published);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkAllRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.markAllNotificationsAsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.markNotificationAsRead(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Inte inloggad");
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userRole"] });
    },
  });
}
