import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await api.post("/users", form);
      const data = await api.post("/login", {
        email: form.email,
        password: form.password,
      });
      login(data.access_token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-box">
      <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
      <form onSubmit={submit}>
        {mode === "register" && (
          <input placeholder="Nombre" value={form.name} onChange={set("name")} required />
        )}
        <input type="email" placeholder="Correo" value={form.email} onChange={set("email")} required />
        <input
          type="password"
          placeholder="Contraseña (mín. 6)"
          value={form.password}
          onChange={set("password")}
          minLength={6}
          maxLength={72}
          required
        />
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>
          {busy ? "Espera..." : mode === "login" ? "Entrar" : "Registrarme"}
        </button>
      </form>
      <button
        className="link"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
      >
        {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </div>
  );
}