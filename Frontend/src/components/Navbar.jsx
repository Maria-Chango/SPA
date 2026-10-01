import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <i></i><span>PlayVideos</span>
      </Link>
      {user && (
        <nav>
          <Link to="/profile" className="user-chip">
            <span className="avatar">{user.name[0].toUpperCase()}</span>
            {user.name}
          </Link>
          <button className="link" onClick={() => { logout(); navigate("/auth"); }}>
            Salir
          </button>
        </nav>
      )}
    </header>
  );
}