import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useCallerProfile,
  useHasLiked,
  useLikePost,
  usePost,
  usePostComments,
  usePostLikes,
} from "../hooks/useQueries";

function formatDate(ns: bigint) {
  return new Date(Number(ns / BigInt(1_000_000))).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostPage() {
  const { id } = useParams({ from: "/post/$id" });
  const postId = BigInt(id);

  const { data: post, isLoading: postLoading } = usePost(postId);
  const { data: comments, isLoading: commentsLoading } =
    usePostComments(postId);
  const { data: likes } = usePostLikes(postId);
  const { data: hasLiked } = useHasLiked(postId);
  const { data: profile } = useCallerProfile();

  const likePost = useLikePost(postId);
  const addComment = useAddComment(postId);

  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    likePost.mutate(hasLiked ?? false, {
      onError: () => toast.error("Något gick fel"),
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const authorName = profile?.name ?? "Anonym";
    addComment.mutate(
      { authorName, content: commentText },
      {
        onSuccess: () => {
          setCommentText("");
          toast.success("Kommentar tillagd");
        },
        onError: () => toast.error("Kunde inte lägga till kommentaren"),
      },
    );
  };

  if (postLoading) {
    return (
      <div
        className="container max-w-2xl mx-auto px-4 py-10"
        data-ocid="post.loading_state"
      >
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className="container max-w-2xl mx-auto px-4 py-16 text-center"
        data-ocid="post.error_state"
      >
        <p className="text-lg text-muted-foreground">Inlägget hittades inte.</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">
          ← Tillbaka
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tillbaka till bloggen
      </Link>

      {/* Post header */}
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
        {post.title}
      </h1>
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
        <span className="font-medium">{post.authorName}</span>
        <span>·</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>

      {/* Content */}
      <div className="prose-blog whitespace-pre-wrap mb-8">{post.content}</div>

      {/* Like */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant={hasLiked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          disabled={likePost.isPending}
          data-ocid="post.like_button"
          className="gap-2"
        >
          {likePost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
          )}
          {likes?.toString() ?? "0"} gillningar
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Comments */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Kommentarer{" "}
          {comments && comments.length > 0 && `(${comments.length})`}
        </h2>

        {commentsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {comments && comments.length > 0 ? (
              comments.map((c) => (
                <div
                  key={c.id.toString()}
                  className="bg-muted/50 rounded-md p-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">
                      {c.authorName}
                    </span>
                    <span>·</span>
                    <span>{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Inga kommentarer ännu. Bli den första!
              </p>
            )}
          </div>
        )}

        {/* Add comment */}
        {isLoggedIn ? (
          <div className="space-y-3">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Skriv en kommentar…"
              rows={3}
              data-ocid="post.comment.input"
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              data-ocid="post.comment.submit_button"
              size="sm"
            >
              {addComment.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Skicka kommentar
            </Button>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-md p-4 text-sm text-muted-foreground">
            <Button variant="link" className="p-0 h-auto" onClick={login}>
              Logga in
            </Button>{" "}
            för att kommentera.
          </div>
        )}
      </div>
    </div>
  );
}
