import { useState } from "react";
import "../App.css";

export default function Login({ setUsuarioLogado }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [usuarioTemp, setUsuarioTemp] = useState(null);

  const entrar = () => {
    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    const encontrado = usuarios.find(
      u => u.usuario === usuario && u.senha === senha
    );

    if (!encontrado) {
      alert("Usuário ou senha inválidos");
      return;
    }

    if (encontrado.primeiroLogin) {
      setUsuarioTemp(encontrado);
      return;
    }

    localStorage.setItem("usuarioLogado", JSON.stringify(encontrado));
    setUsuarioLogado(encontrado);
  };

  const definirNovaSenha = () => {
    if (!/^\d{4}$/.test(novaSenha)) {
      alert("A senha deve ter exatamente 4 dígitos numéricos");
      return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    const atualizados = usuarios.map(u =>
      u.id === usuarioTemp.id
        ? { ...u, senha: novaSenha, primeiroLogin: false }
        : u
    );

    localStorage.setItem("usuarios", JSON.stringify(atualizados));

    const atualizado = atualizados.find(u => u.id === usuarioTemp.id);

    localStorage.setItem("usuarioLogado", JSON.stringify(atualizado));
    setUsuarioLogado(atualizado);
  };

  return (
    <div className="container">
      <h1>Login</h1>

      {!usuarioTemp ? (
        <div className="card">
          <input
            placeholder="Usuário"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />

          <button onClick={entrar}>Entrar</button>
        </div>
      ) : (
        <div className="card">
          <h3>Primeiro acesso</h3>
          <p>Defina sua nova senha de 4 dígitos</p>

          <input
            type="password"
            placeholder="Nova senha (4 dígitos)"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
          />

          <button onClick={definirNovaSenha}>
            Salvar nova senha
          </button>
        </div>
      )}
    </div>
  );
}