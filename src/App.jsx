import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Servicos from "./pages/Servicos";
import Gastos from "./pages/Gastos";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import { LogOut } from "lucide-react";

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();

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
      if (user) setUsuarioLogado(user);
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

  const linkClass = (path) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      location.pathname === path
        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md scale-105"
        : "bg-slate-800 text-gray-300 hover:bg-blue-500 hover:text-white hover:scale-105"
    }`;

  if (carregando) return null;
  if (!usuarioLogado) return <Login setUsuarioLogado={setUsuarioLogado} />;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-200">

      {/* HEADER */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">

          {/* TEXTO */}
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-400 tracking-wide uppercase">
              Controle serviços
            </p>
            <h2 className="text-xl font-bold text-white">
              Bem-vindo, <span className="text-blue-400">{usuarioLogado.usuario}</span>
            </h2>
          </div>

          {/* MENU */}
          <div className="flex gap- flex-wrap justify-center">
            <Link to="/" className={linkClass("/")}>Serviços</Link>
            <Link to="/gastos" className={linkClass("/gastos")}>Gastos</Link>

            {usuarioLogado.role === "admin" && (
              <Link to="/usuarios" className={linkClass("/usuarios")}>
                Usuários
              </Link>
            )}
          </div>

          {/* BOTÃO SAIR */}
          <button
            onClick={logout}
            className="absolute right-5 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-xl"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl shadow-xl p-6 border border-slate-700 min-h-[400px]">
          <Routes>
            <Route path="/" element={<Servicos />} />
            <Route path="/gastos" element={<Gastos />} />
            {usuarioLogado.role === "admin" && (
              <Route path="/usuarios" element={<Usuarios />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* FOOTER FIXO */}
      <footer className="bg-slate-800 border-t border-slate-700 text-center py-3 text-sm text-gray-400">
        Desenvolvido por{" "}
        <strong className="text-gray-300">
          Uirleandro Santos
        </strong>
      </footer>

    </div>
  );
}