import { useEffect, useState } from "react";
import "../App.css";

export default function Servicos() {
  const hoje = new Date().toISOString().split("T")[0];
  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const primeiroDiaDoMes = `${ano}-${mes}-01`;

  const [servico, setServico] = useState("");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [data, setData] = useState(hoje);

  const [lista, setLista] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [servicosPeriodo, setServicosPeriodo] = useState([]);

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("servicos")) || [];
    setLista(dados);
  }, []);

  const limparFormulario = () => {
    setServico("");
    setNome("");
    setValor("");
    setObs("");
    setData(hoje);
  };

  const salvar = () => {
    if (!servico || !nome || !valor) {
      alert("Preencha Serviço, Nome e Valor");
      return;
    }

    if (editandoId) {
      const atualizada = lista.map(item =>
        item.id === editandoId
          ? { ...item, servico, nome, valor: Number(valor), obs, data }
          : item
      );
      setLista(atualizada);
      localStorage.setItem("servicos", JSON.stringify(atualizada));
      setEditandoId(null);
    } else {
      const novo = {
        id: Date.now(),
        servico,
        nome,
        valor: Number(valor),
        obs,
        data,
      };
      const novaLista = [...lista, novo];
      setLista(novaLista);
      localStorage.setItem("servicos", JSON.stringify(novaLista));
    }

    limparFormulario();
  };

  const editar = (item) => {
    setServico(item.servico);
    setNome(item.nome);
    setValor(item.valor);
    setObs(item.obs || "");
    setData(item.data);
    setEditandoId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

//   const limparTodos = () => {
//     if (!window.confirm("Apagar TODOS os serviços?")) return;
//     localStorage.removeItem("servicos");
//     setLista([]);
//     setSubtotal(0);
//     setServicosPeriodo([]);
//     setMostrarLista(false);
//   };

  const calcularSubtotal = () => {
    const filtrados = lista.filter(
      i => (!inicio || i.data >= inicio) && (!fim || i.data <= fim)
    );
    setSubtotal(filtrados.reduce((s, i) => s + i.valor, 0));
    setServicosPeriodo(filtrados);
  };

  const servicosDoMes = lista.filter(
    i => i.data >= primeiroDiaDoMes && i.data <= hoje
  );

  const subtotalMes = servicosDoMes.reduce((s, i) => s + i.valor, 0);

  return (
    <>
      <h1>Controle de Serviços</h1>

      <div className="card">
        <select value={servico} onChange={e => setServico(e.target.value)}>
          <option value="" disabled>Selecione o serviço</option>
          <option>Banho</option>
          <option>Banho + Tosa Higiênica</option>
          <option>Banho + Tosa Completa</option>
          <option>Outro</option>
        </select>

        <input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
        <input type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
        <input type="date" value={data} onChange={e => setData(e.target.value)} />

        <textarea
          placeholder="Observações"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button onClick={salvar}>
          {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
        </button>
      </div>

      <button className="toggle" onClick={() => setMostrarLista(!mostrarLista)}>
        Trabalhos do mês atual
      </button>

      {mostrarLista && (
        <div className="card">
          <h3>Subtotal do mês: R$ {subtotalMes.toFixed(2).replace(".",",")}</h3>

          {servicosDoMes.map(item => (
            <div key={item.id} className="item">
              <strong>{item.servico}</strong> — {item.nome}<br />
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
        <h3>Total: R$ {subtotal.toFixed(2)}</h3>
      </div>
    </>
  );
}