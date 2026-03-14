import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useAllPosts } from "../hooks/useQueries";

function formatDate(ns: bigint) {
  return new Date(Number(ns / BigInt(1_000_000))).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SAMPLE_POSTS = [
  {
    id: BigInt(1),
    title: "Välkommen till HKLOblogg",
    content:
      "Det här är den första blogginlägget på vår nya plattform. Vi är glada att ha dig här och ser fram emot att dela tankar, idéer och berättelser med dig.",
    authorName: "Redaktionen",
    createdAt: BigInt(Date.now()) * BigInt(1_000_000),
    published: true,
    likes: 12,
  },
  {
    id: BigInt(2),
    title: "Livet i Stockholm på vintern",
    content:
      "Vintermorgnar i Stockholm har en alldeles speciell karaktär. Dimman ligger tät över Mälaren och stadens stenar glänser av frost...",
    authorName: "Anna Lindgren",
    createdAt: BigInt(Date.now() - 86400000) * BigInt(1_000_000),
    published: true,
    likes: 8,
  },
  {
    id: BigInt(3),
    title: "Recension: Årets bästa bok om teknik",
    content:
      "I år har vi sett en rad intressanta utgivningar inom tech-litteraturen. Men en bok sticker ut som den klart bästa...",
    authorName: "Erik Ström",
    createdAt: BigInt(Date.now() - 172800000) * BigInt(1_000_000),
    published: true,
    likes: 24,
  },
];

export function HomePage() {
  const { data: posts, isLoading } = useAllPosts();

  const displayPosts = posts && posts.length > 0 ? posts : SAMPLE_POSTS;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
          HKLOblogg
        </h1>
        <p className="text-muted-foreground text-lg">
          Tankar, berättelser och idéer — för alla.
        </p>
      </div>

      {/* Post list */}
      {isLoading ? (
        <div className="space-y-6" data-ocid="blog.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-border pb-6">
              <Skeleton className="h-6 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/4 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0" data-ocid="blog.list">
          {displayPosts.map((post, idx) => (
            <article
              key={post.id.toString()}
              data-ocid={`blog.post.item.${idx + 1}`}
              className="py-7 border-b border-border last:border-0 group"
            >
              <Link
                to="/post/$id"
                params={{ id: post.id.toString() }}
                className="block"
              >
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
                  {post.title}
                </h2>
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="font-medium">{post.authorName}</span>
                <span>·</span>
                <span>{formatDate(post.createdAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {"likes" in post ? post.likes : 0}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                {post.content}
              </p>
            </article>
          ))}

          {displayPosts.length === 0 && (
            <div
              data-ocid="blog.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <p className="text-lg font-display">Inga inlägg ännu.</p>
              <p className="text-sm mt-1">Bli den första att skriva något!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
