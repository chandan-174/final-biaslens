import { useParams, useNavigate } from "react-router-dom";
import blogs from "@/data/blogs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const blog = blogs.find((b) => b.id === id);

  if (!blog) {
    return <div className="p-10 text-center">Blog not found</div>;
  }

  const related = blogs.filter((b) => b.id !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* HERO */}
      <div className="relative py-20 px-6 text-center border-b border-border">
        <h1 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
          {blog.title}
        </h1>

        <p className="mt-4 text-muted-foreground">
          By Team BiasLens • {new Date().toDateString()}
        </p>

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-sm text-blue-400 hover:underline"
        >
          ← Back
        </button>
      </div>

      {/* CONTENT */}
      <div className="max-w-3xl mx-auto px-6 py-16 leading-relaxed text-muted-foreground text-lg">
        {blog.content}
              {/* HERO IMAGE */}
              {blog.image && (
                  <div className="max-w-5xl mx-auto px-6 mt-10">
                      <img
                          src={blog.image}
                          alt={blog.title}
                          className="rounded-2xl w-full object-cover"
                      />
                  </div>
              )}

              {/* CONTENT */}
              <div className="max-w-3xl mx-auto px-6 py-16 prose prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {blog.content}
                  </ReactMarkdown>
              </div>
      </div>

      {/* RELATED BLOGS */}
      <div className="max-w-7xl mx-auto px-6 pb-20">

        <h2 className="text-2xl font-semibold mb-8">
          Related Articles
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {related.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/blog/${post.id}`)}
              className="cursor-pointer p-5 rounded-xl border border-border bg-card/60 hover:scale-[1.02] transition"
            >
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {post.desc}
              </p>
              {blog.image && (
                <img
                  src={blog.image}
                  className="mt-6 rounded-xl w-full"
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}