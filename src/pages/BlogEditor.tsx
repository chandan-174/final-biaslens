import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BlogEditor() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const handleSave = async () => {
    let imageUrl = "";

    if (image) {
      const fileName = `${Date.now()}-${image.name}`;

      const { error: uploadError } = await supabase.storage
        .from("blogs")
        .upload(fileName, image);

      if (uploadError) {
        console.error(uploadError);
        alert("Image upload failed ❌");
        return;
      }

      const { data } = supabase.storage
        .from("blogs")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("blogs").insert([
      {
        title,
        description: desc,
        content,
        image: imageUrl,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error ❌");
    } else {
      alert("Blog saved 🚀");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">Create Blog</h1>

      <input
        className="w-full p-3 border rounded mb-4"
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="w-full p-3 border rounded mb-4"
        placeholder="Description"
        onChange={(e) => setDesc(e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-4"
      />

      <textarea
        className="w-full p-3 border rounded h-40 mb-4"
        placeholder="Write in markdown..."
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-blue-500 text-white rounded"
      >
        Save Blog
      </button>
    </div>
  );
}