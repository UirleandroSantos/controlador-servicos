import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState("");

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    const { data } = await supabase.from("usuarios").select("*");
    setUsuarios(data || []);
  };

  const criarUsuario = async () => {
    if (!novoUsuario) {
      alert("Digite o nome");
      return;
    }

    await supabase.from("usuarios").insert([
      {
        usuario: novoUsuario.toLowerCase(),
        senha: "0000",
        role: "user",
        primeiro_login: true
      }
    ]);

    alert("Usuário criado com senha 0000");
    setNovoUsuario("");
    carregarUsuarios();
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir usuário?")) return;

    await supabase.from("usuarios").delete().eq("id", id);
    carregarUsuarios();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold text-white">
          Gerenciar Usuários
        </h1>

        {/* CRIAR USUÁRIO */}
        <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg space-y-4">

          <input
            className="w-full bg-[#0f172a] border border-gray-600 p-3 rounded-xl"
            placeholder="Novo usuário"
            value={novoUsuario}
            onChange={e => setNovoUsuario(e.target.value)}
          />

          <button
            onClick={criarUsuario}
            className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold w-full"
          >
            Criar Usuário
          </button>

        </div>

        {/* LISTA */}
        <div className="bg-[#1e293b] p-5 rounded-2xl shadow space-y-3">

          {usuarios.map(u => (
            <div
              key={u.id}
              className="flex justify-between items-center border-b border-gray-700 pb-2"
            >
              <div>
                <strong className="text-white">{u.usuario}</strong>
                <span className="text-sm text-gray-400 ml-2">
                  ({u.role})
                </span>
              </div>

              <button
                onClick={() => excluir(u.id)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white"
              >
                Excluir
              </button>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}