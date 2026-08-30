import { useState } from "react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import FormError from "../../../components/FormError";
import { createPost, extractCommunityErrorMessage } from "../api";

const CATEGORIES = [
  "General",
  "Exam Prep",
  "Study Group",
  "Course Help",
  "Resources",
];

export default function PostForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and discussion content.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newPost = await createPost({
        title: title.trim(),
        category,
        content: content.trim(),
      });
      onCreated(newPost);
    } catch (err) {
      setError(extractCommunityErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="academic-form">
      {error && <FormError message={error} />}

      <Input
        label="Discussion Title / Question"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., How to solve recurring relations in Algorithms?"
        required
      />

      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-input"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Content / Details</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, ask questions, or link resources..."
          rows={4}
          className="form-input"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            resize: "vertical",
          }}
          required
        />
      </div>

      <div className="form-actions-row">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "🚀 Publish Discussion"}
        </Button>
      </div>
    </form>
  );
}
