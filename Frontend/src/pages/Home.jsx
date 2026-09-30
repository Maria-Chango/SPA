import { useEffect, useState } from "react";
import { api } from "../api.js";
import VideoCard from "../components/VideoCard.jsx";

export default function Home() {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/videos?limit=50").then(setVideos).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!videos) return <p>Cargando...</p>;
  if (videos.length === 0) return <p>Aún no hay videos. ¡Sube el primero desde tu perfil!</p>;

  return (
    <>
      <section className="hero">
        <h1>Descubre lo último 🎬</h1>
        <p>{videos.length} videos publicados por la comunidad</p>
      </section>
      <div className="grid">
        {videos.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </>
  );

}