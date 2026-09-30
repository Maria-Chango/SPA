import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Player() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const counted = useRef(null); // evita contar la vista dos veces (StrictMode)

  useEffect(() => {
    setVideo(null);
    setError("");
    if (counted.current === id) return;
    counted.current = id;

    api.get(`/videos/${id}`).then(setVideo).catch((e) => setError(e.message));
    api.get(`/videos/${id}/comments`).then(setComments).catch(() => {});
    api.get(`/videos?exclude_id=${id}&limit=8`).then(setRelated).catch(() => {});
    window.scrollTo(0, 0);
  }, [id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const c = await api.post(`/videos/${id}/comments`, { content: text });
      setComments([c, ...comments]);
      setText("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !video) return <p className="error">{error}</p>;
  if (!video) return <p>Cargando...</p>;

  return (
    <div className="player-layout">
      <section>
        <video src={video.video_url} poster={video.thumbnail_url} controls className="player" />

        <div className="player-info">
          <h2>{video.title}</h2>
          <p className="muted">
            {video.user_name} · {video.views} vistas ·{" "}
            {new Date(video.created_at).toLocaleDateString()}
          </p>
          <p>{video.description}</p>
        </div>

        <h3>{comments.length} comentarios</h3>
        <form onSubmit={send} className="comment-form">
          <input
            placeholder="Escribe un comentario..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          <button>Comentar</button>
        </form>
        {error && <p className="error">{error}</p>}
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <span className="avatar">{c.user_name[0].toUpperCase()}</span>
            <div>
              <strong>{c.user_name}</strong>{" "}
              <span className="muted">{new Date(c.created_at).toLocaleString()}</span>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
      </section>

      <aside>
        <h3>Recomendados</h3>
        {related.map((v) => <VideoCard key={v.id} video={v} compact />)}
      </aside>
    </div>
  );
}