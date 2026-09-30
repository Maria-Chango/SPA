import { Link } from "react-router-dom";

export default function VideoCard({ video, compact = false }) {
  const date = new Date(video.created_at).toLocaleDateString();
  return (
    <Link to={`/video/${video.id}`} className={compact ? "card compact" : "card"}>
      <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
      <div className="card-body">
        <span className="avatar">{video.user_name[0].toUpperCase()}</span>
        <div className="card-info">
          <h3>{video.title}</h3>
          <p>{video.user_name}</p>
          <p>{video.views} vistas · {date}</p>
        </div>
      </div>
    </Link>
  );
}