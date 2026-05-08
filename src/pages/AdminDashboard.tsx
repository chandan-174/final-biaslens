import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [blogs, setBlogs] = useState([]);

  // ✅ EDIT STATE
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    content: "",
  });
  const [image, setImage] = useState(null);

  const navigate = useNavigate();

  // ✅ LOGOUT FUNCTION
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    setBlogs(data || []);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id) => {
    await supabase.from("blogs").delete().eq("id", id);
    fetchBlogs();
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      
      {/* 🔥 HEADER WITH LOGOUT */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="space-y-6">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="p-5 rounded-2xl border border-border bg-card/60 flex flex-col gap-3"
          >

            {/* 🔹 EDIT MODE */}
            {editingId === blog.id ? (
              <>
                <input
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border"
                  placeholder="Title"
                />

                <input
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border"
                  placeholder="Description"
                />

                <textarea
                  value={editData.content}
                  onChange={(e) =>
                    setEditData({ ...editData, content: e.target.value })
                  }
                  className="w-full p-2 rounded bg-background border"
                  placeholder="Content"
                />

                {blog.image && (
                  <img
                    src={blog.image}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}

                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full"
                />

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      let imageUrl = blog.image;

                      // 🔁 If new image selected
                      if (image) {
                        const fileName = `${Date.now()}-${image.name}`;

                        const { error: uploadError } = await supabase.storage
                          .from("blogs")
                          .upload(fileName, image);

                        if (uploadError) {
                          alert("Image upload failed ❌");
                          return;
                        }

                        const { data } = supabase.storage
                          .from("blogs")
                          .getPublicUrl(fileName);

                        imageUrl = data.publicUrl;
                      }

                      await supabase
                        .from("blogs")
                        .update({
                          title: editData.title,
                          description: editData.description,
                          content: editData.content,
                          image: imageUrl,
                        })
                        .eq("id", blog.id);

                      setEditingId(null);
                      setImage(null);
                      fetchBlogs();
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 🔹 VIEW MODE */}
                <div>
                  <h2 className="font-semibold">{blog.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {blog.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(blog.id);
                      setEditData({
                        title: blog.title,
                        description: blog.description,
                        content: blog.content,
                      });
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}