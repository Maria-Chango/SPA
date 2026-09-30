import { useEffect, useState } from "react";
import { api, uploadFile } from "../api.js";
import { useAuth } from "../auth.jsx";
import VideoCard from "../components/VideoCard.jsx";

const MAX_VIDEO = 100 * 1024 * 1024;
const MAX_THUMB = 5 * 1024 * 1024;

export default function Profile() {
  const { user } = useAuth();
  const [info, setInfo] = useState(user);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", video: null, thumb: null });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // {id, title, description}

  const load = () => {
    api.get(`/users/${user.id}`).then(setInfo).catch(() => {});
    api.get(`/videos?user_id=${user.id}&limit=100`).then(setVideos).catch(() => {});
  };
  useEffect(load, []); // eslint-disable-line

  const publish = async (e) => {
    e.preventDefault();
    setError("");
    const { video, thumb } = form;
    if (!video || !thumb) return setError("Selecciona el video y la miniatura");
    if (!video.name.toLowerCase().endsWith(".mp4")) return setError("El video debe ser MP4");
    if (video.size > MAX_VIDEO) return setError("El video supera 100 MB");
    if (!/\.(jpe?g|png)$/i.test(thumb.name)) return setError("Miniatura: JPG, JPEG o PNG");
    if (thumb.size > MAX_THUMB) return setError("La miniatura supera 5 MB");

    try {
      setStatus("Subiendo miniatura...");
      const thumbnail_url = await uploadFile("thumbnail", thumb);
      setStatus("Subiendo video (puede tardar)...");
      const video_url = await uploadFile("video", video);
      setStatus("Guardando...");
      await api.post("/videos", {
        title: form.title,
        description: form.description,
        video_url,
        thumbnail_url,
      });
      setForm({ title: "", description: "", video: null, thumb: null });
      e.target.reset();
      setStatus("¡Video publicado!");
      load();
    } catch (err) {
      setStatus("");
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/videos/${editing.id}`, {
        title: editing.title,
        description: editing.description,
      });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("¿Eliminar este video?")) return;
    try {
      await api.del(`/videos/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <section className="profile-head">
        <h2>{info.name}</h2>
        <p className="muted">{info.email}</p>
        <p><strong>{info.video_count ?? videos.length}</strong> videos publicados</p>
      </section>

      <section>
        <h3>Publicar video</h3>
        <form onSubmit={publish} className="upload-form">
          <input placeholder="Título" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Descripción" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label>Video (MP4, máx. 100 MB)
            <input type="file" accept="video/mp4"
              onChange={(e) => setForm({ ...form, video: e.target.files[0] })} />
          </label>
          <label>Miniatura (JPG/PNG, máx. 5 MB)
            <input type="file" accept="image/jpeg,image/png"
              onChange={(e) => setForm({ ...form, thumb: e.target.files[0] })} />
          </label>
          <button disabled={!!status && status !== "¡Video publicado!"}>Publicar</button>
        </form>
        {status && <p className="ok">{status}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h3>Mis videos</h3>
        {videos.length === 0 && <p className="muted">Todavía no has publicado videos.</p>}
        <div className="grid">
          {videos.map((v) => (
            <div key={v.id} className="owned">
              <VideoCard video={v} />
              {editing?.id === v.id ? (
                <div className="edit-box">
                  <input value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  <textarea value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  <button onClick={saveEdit}>Guardar</button>
                  <button className="link" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              ) : (
                <div className="actions">
                  <button onClick={() => setEditing({ id: v.id, title: v.title, description: v.description })}>
                    Editar
                  </button>
                  <button className="danger" onClick={() => remove(v.id)}>Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}