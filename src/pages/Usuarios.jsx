import { useEffect, useState } from "react";
import "../App.css";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [novoUsuario, setNovoUsuario] = useState("");

  useEffect(() => {
    const lista = JSON.parse(localStorage.getItem("usuarios")) || [];
    setUsuarios(lista);
  }, []);

  const criarUsuario = () => {
    if (!novoUsuario) {
      alert("Digite o nome do usuário");
      return;
    }

    const existe = usuarios.find(u => u.usuario === novoUsuario);
    if (existe) {
      alert("Usuário já existe");
      return;
    }

    const novo = {
      id: Date.now(),
      usuario: novoUsuario,
      senha: "0000",
      role: "user",
      primeiroLogin: true,
    };

    const novaLista = [...usuarios, novo];
    setUsuarios(novaLista);
    localStorage.setItem("usuarios", JSON.stringify(novaLista));

    alert("Usuário criado com senha provisória: 0000");

    setNovoUsuario("");
  };

  const excluir = (id) => {
    if (!window.confirm("Excluir usuário?")) return;

    const filtrado = usuarios.filter(u => u.id !== id);
    setUsuarios(filtrado);
    localStorage.setItem("usuarios", JSON.stringify(filtrado));
  };

  return (
    <>
      <h1>Gerenciar Usuários</h1>

      <div className="card">
        <input
          placeholder="Novo usuário"
          value={novoUsuario}
          onChange={e => setNovoUsuario(e.target.value)}
        />

        <button onClick={criarUsuario}>
          Criar Usuário
        </button>
      </div>

      <div className="card">
        <h3>Usuários cadastrados</h3>

        {usuarios.map(u => (
          <div key={u.id} className="item">
            <strong>{u.usuario}</strong> ({u.role})
            {u.role !== "admin" && (
              <button
                className="edit"
                onClick={() => excluir(u.id)}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}