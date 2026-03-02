import { useEffect, useState } from "react";
import "../App.css";

export default function Gastos() {
  const hoje = new Date().toISOString().split("T")[0];
  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const primeiroDiaDoMes = `${ano}-${mes}-01`;

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [data, setData] = useState(hoje);

  const [lista, setLista] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [gastosPeriodo, setGastosPeriodo] = useState([]);

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("gastos")) || [];
    setLista(dados);
  }, []);

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setObs("");
    setData(hoje);
  };

  const salvar = () => {
    if (!descricao || !valor) {
      alert("Preencha descrição e valor");
      return;
    }

    if (editandoId) {
      const atualizada = lista.map(item =>
        item.id === editandoId
          ? { ...item, descricao, valor: Number(valor), obs, data }
          : item
      );
      setLista(atualizada);
      localStorage.setItem("gastos", JSON.stringify(atualizada));
      setEditandoId(null);
    } else {
      const novo = {
        id: Date.now(),
        descricao,
        valor: Number(valor),
        obs,
        data,
      };
      const novaLista = [...lista, novo];
      setLista(novaLista);
      localStorage.setItem("gastos", JSON.stringify(novaLista));
    }

    limparFormulario();
  };

  const editar = (item) => {
    setDescricao(item.descricao);
    setValor(item.valor);
    setObs(item.obs || "");
    setData(item.data);
    setEditandoId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

//   const limparTodos = () => {
//     if (!window.confirm("Apagar TODOS os gastos?")) return;
//     localStorage.removeItem("gastos");
//     setLista([]);
//     setSubtotal(0);
//     setGastosPeriodo([]);
//     setMostrarLista(false);
//   };

  const calcularSubtotal = () => {
    const filtrados = lista.filter(
      i => (!inicio || i.data >= inicio) && (!fim || i.data <= fim)
    );
    setSubtotal(filtrados.reduce((s, i) => s + i.valor, 0));
    setGastosPeriodo(filtrados);
  };

  const gastosDoMes = lista.filter(
    i => i.data >= primeiroDiaDoMes && i.data <= hoje
  );

  const subtotalMes = gastosDoMes.reduce((s, i) => s + i.valor, 0);

  return (
    <>
      <h1>Controle de Gastos</h1>

      <div className="card">
        <input
          placeholder="Descrição do gasto"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
        />

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={e => setValor(e.target.value)}
        />

        <input type="date" value={data} onChange={e => setData(e.target.value)} />

        <textarea
          placeholder="Observações"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button onClick={salvar}>
          {editandoId ? "Atualizar Gasto" : "Salvar Gasto"}
        </button>
      </div>

      <button className="toggle" onClick={() => setMostrarLista(!mostrarLista)}>
        Gastos do mês atual
      </button>

      {mostrarLista && (
        <div className="card">
          <h3>Subtotal do mês: R$ {subtotalMes.toFixed(2).replace(".",",")}</h3>

          {gastosDoMes.map(item => (
            <div key={item.id} className="item">
              <strong>{item.descricao}</strong><br />
              R$ {item.valor.toFixed(2).replace(".",",")} | {item.data}<br />
              {item.obs && <em>{item.obs}</em>}<br />
              <button className="edit" onClick={() => editar(item)}>Editar</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Consultar período</h2>
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
        <button onClick={calcularSubtotal}>Calcular</button>
        <h3>Total: R$ {subtotal.toFixed(2).replace(".",",")}</h3>
      </div>
    </>
  );
}