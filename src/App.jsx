import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Servicos from "./pages/Servicos";
import Gastos from "./pages/Gastos";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import "./App.css";

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    try {
      const usuariosSalvos = localStorage.getItem("usuarios");

      if (!usuariosSalvos) {
        localStorage.setItem(
          "usuarios",
          JSON.stringify([
            {
              id: 1,
              usuario: "admin",
              senha: "admin123",
              role: "admin",
              primeiroLogin: false,
            },
          ])
        );
      }

      const user = JSON.parse(localStorage.getItem("usuarioLogado"));
      if (user) {
        setUsuarioLogado(user);
      }
    } catch (erro) {
      console.error("Erro:", erro);
      localStorage.clear();
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
  };

  if (carregando) return null;

  if (!usuarioLogado) {
    return <Login setUsuarioLogado={setUsuarioLogado} />;
  }

  return (
    <div className="container">
      <header className="topo">
        <span className="nav">
          Bem-vindo, <strong>{usuarioLogado.usuario}</strong>
        </span>

        <div className="links">
          <Link to="/" className="nav">Serviços</Link>
          <Link to="/gastos" className="nav">Gastos</Link>
        </div>

        {usuarioLogado.role === "admin" && (
          <Link to="/usuarios" className="nav">Usuários</Link>
        )}
      </header>

      <Routes>
        <Route path="/" element={<Servicos />} />
        <Route path="/gastos" element={<Gastos />} />

        {usuarioLogado.role === "admin" && (
          <Route path="/usuarios" element={<Usuarios />} />
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <button onClick={logout} className="sair">
        Sair
      </button>
      <div className="wrap"></div>
      <span className="apresentation">
        Desenvolvido por <strong>Uirleandro Santos</strong>
      </span>
    </div>
  );
}