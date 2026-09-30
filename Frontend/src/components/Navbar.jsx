import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">▶ VideoPlatform</Link>
      {user && (
        <nav>
          <Link to="/profile">{user.name}</Link>
          <button
            className="link"
            onClick={() => { logout(); navigate("/auth"); }}
          >
            Salir
          </button>
        </nav>
      )}
    </header>
  );
}