import { useState } from "react";
import { supabase } from "../../services/supabase";

export default function Login({ setUsuarioLogado }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [usuarioTemp, setUsuarioTemp] = useState(null);
  const [manterConectado, setManterConectado] = useState(true);
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!usuario || !senha) {
      alert("Preencha o usuário e a senha.");
      return;
    }

    setCarregando(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("usuario", usuario.trim().toLowerCase());

    setCarregando(false);

    if (error || !data || data.length === 0) {
      alert("Usuário não encontrado");
      return;
    }

    const user = data[0];

    if (String(user.senha) !== String(senha)) {
      alert("Senha incorreta");
      return;
    }

    if (user.primeiro_login) {
      setUsuarioTemp(user);
      return;
    }

    if (manterConectado) {
      localStorage.setItem("usuarioLogado", JSON.stringify(user));
    }

    setUsuarioLogado(user);
  };

  const definirNovaSenha = async () => {
    if (!/^\d{4}$/.test(novaSenha)) {
      alert("A senha deve ter exatamente 4 dígitos numéricos");
      return;
    }

    setCarregando(true);

    // Garantindo que o ID seja enviado corretamente como número inteiro
    const idUsuario = parseInt(usuarioTemp.id, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        senha: String(novaSenha),
        primeiro_login: false
      })
      .eq("id", idUsuario)
      .select();

    setCarregando(false);

    if (error) {
      alert("Erro do Supabase: " + error.message);
      console.error("Erro completo:", error);
      return;
    }

    // Se nenhuma linha foi alterada no banco
    if (!data || data.length === 0) {
      alert("O Supabase recusou a alteração. Verifique as permissões de UPDATE no painel do Supabase (RLS).");
      return;
    }

    const atualizado = data[0];

    alert("Senha alterada com sucesso!");

    if (manterConectado) {
      localStorage.setItem("usuarioLogado", JSON.stringify(atualizado));
    }

    setUsuarioLogado(atualizado);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Controle de serviços
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Acesse sua conta
          </p>
        </div>

        {!usuarioTemp ? (
          <div className="space-y-4">
            <input
              className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Usuário"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
            />

            <input
              type="password"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={manterConectado}
                onChange={() => setManterConectado(!manterConectado)}
                className="accent-indigo-500 w-4 h-4"
              />
              Manter-me conectado
            </label>

            <button
              onClick={entrar}
              disabled={carregando}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 transition text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50"
            >
              {carregando ? "Aguarde..." : "Entrar"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white">
                Primeiro acesso
              </h3>
              <p className="text-sm text-gray-300">
                Defina sua nova senha
              </p>
            </div>

            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-center text-lg"
              placeholder="Nova senha (4 dígitos)"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
            />

            <button
              onClick={definirNovaSenha}
              disabled={carregando}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 transition text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50"
            >
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}