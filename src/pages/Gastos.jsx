import { useEffect, useState } from "react";
import "../App.css";

export default function Gastos() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado) return null;

  const chaveStorage = `gastos_${usuarioLogado.usuario}`;

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
    const dados = JSON.parse(localStorage.getItem(chaveStorage)) || [];
    setLista(dados);
  }, [chaveStorage]);

  const salvarLista = (novaLista) => {
    setLista(novaLista);
    localStorage.setItem(chaveStorage, JSON.stringify(novaLista));
  };

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
      salvarLista(atualizada);
      setEditandoId(null);
    } else {
      const novo = {
        id: Date.now(),
        descricao,
        valor: Number(valor),
        obs,
        data,
      };
      salvarLista([...lista, novo]);
    }

    limparFormulario();
  };

  const editar = (item) => {
    setDescricao(item.descricao);
    setValor(item.valor);
    setObs(item.obs || "");
    setData(item.data);
    setEditandoId(item.id);
  };

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
        <input placeholder="Descrição do gasto" value={descricao} onChange={e => setDescricao(e.target.value)} />
        <input type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
        <input type="date" value={data} onChange={e => setData(e.target.value)} />
        <textarea placeholder="Observações" value={obs} onChange={e => setObs(e.target.value)} />

        <button onClick={salvar}>
          {editandoId ? "Atualizar Gasto" : "Salvar Gasto"}
        </button>
      </div>

      <button className="toggle" onClick={() => setMostrarLista(!mostrarLista)}>
        Gastos do mês atual
      </button>

      {mostrarLista && (
        <div className="card">
          <h3>Subtotal do mês: R$ {subtotalMes.toFixed(2).replace(".", ",")}</h3>

          {gastosDoMes.map(item => (
            <div key={item.id} className="item">
              <strong>{item.descricao}</strong><br />
              R$ {item.valor.toFixed(2).replace(".", ",")} | {item.data}<br />
              {item.obs && <em>{item.obs}</em>}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Consultar período</h2>

        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
        <button onClick={calcularSubtotal}>Calcular</button>

        <h3>Total: R$ {subtotal.toFixed(2).replace(".", ",")}</h3>

        {gastosPeriodo.length > 0 && (
          <>
            <h3>Gastos no período:</h3>
            {gastosPeriodo.map(item => (
              <div key={item.id} className="item">
                <strong>{item.descricao}</strong><br />
                R$ {item.valor.toFixed(2).replace(".", ",")} | {item.data}<br />
                {item.obs && <em>{item.obs}</em>}
              </div>
            ))}
          </>
        )}

        {gastosPeriodo.length === 0 && inicio && fim && (
          <p>Nenhum gasto encontrado no período.</p>
        )}
      </div>
    </>
  );
}