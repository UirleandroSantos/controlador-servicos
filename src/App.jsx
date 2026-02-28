import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  // Data de hoje
  const hoje = new Date().toISOString().split("T")[0];

  // Mês atual
  const ano = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, "0");
  const primeiroDiaDoMes = `${ano}-${mes}-01`;

  // Estados do formulário
  const [servico, setServico] = useState("");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [data, setData] = useState(hoje);

  // Estados da aplicação
  const [lista, setLista] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  // Subtotal
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [subtotal, setSubtotal] = useState(0);

  // 🔹 Carregar serviços ao iniciar
  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("servicos")) || [];
    setLista(dados);
  }, []);
  

  // 🔹 Salvar serviço
  const salvar = () => {
    
    if (!servico || !nome || !valor) {
      alert("Preencha Serviço, Nome e Valor");
      return;
    }

    const novoServico = {
      id: Date.now(),
      servico,
      nome,
      valor: Number(valor),
      obs,
      data,
    };

    const novaLista = [...lista, novoServico];
    setLista(novaLista);
    localStorage.setItem("servicos", JSON.stringify(novaLista));

    // Limpar campos (mantendo data atual)
    setServico("");
    setNome("");
    setValor("");
    setObs("");
    setData(hoje);
  };

  // 🔹 Calcular subtotal por período
  const calcularSubtotal = () => {
    const total = lista
      .filter(
        item =>
          (!inicio || item.data >= inicio) &&
          (!fim || item.data <= fim)
      )
      .reduce((soma, item) => soma + item.valor, 0);

    setSubtotal(total);
  };

  // 🔹 Limpar todos os serviços
  const limparTudo = () => {
    const confirmar = window.confirm(
      "Tem certeza que deseja apagar TODOS os serviços? Essa ação não pode ser desfeita."
    );

    if (!confirmar) return;

    localStorage.removeItem("servicos");
    setLista([]);
    setSubtotal(0);
  };

  // 🔹 Trabalhos somente do mês atual
  const trabalhosDoMes = lista.filter(
    item => item.data >= primeiroDiaDoMes && item.data <= hoje
  );

  return (
    <div className="container">
      <h1>Controle de Serviços</h1>

      {/* CADASTRO */}
      <div className="card">
        <h2>Novo Serviço</h2>

        <select value={servico} onChange={e => setServico(e.target.value)}>
          <option value="">Selecione o serviço</option>
          <option>Banho</option>
          <option>Banho + Tosa Higiênica</option>
          <option>Banho + Tosa Completa</option>
          <option>Outro</option>
        </select>

        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={e => setValor(e.target.value)}
        />

        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
        />

        <textarea
          placeholder="Observações (opcional)"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button type="button" onClick={salvar}>
          Salvar Serviço
        </button>
      </div>

      {/* BOTÕES */}
      <button
        className="toggle"
        onClick={() => setMostrarLista(!mostrarLista)}
      >
        Trabalhos realizados (mês atual)
      </button>

      {/* LISTA DO MÊS */}
      {mostrarLista && (
        <div className="card">
          {trabalhosDoMes.length === 0 && (
            <p>Nenhum serviço realizado neste mês</p>
          )}

          {trabalhosDoMes.map(item => (
            <div key={item.id} className="item">
              <strong>{item.servico}</strong> — {item.nome}
              <br />
              R$ {item.valor.toFixed(2)} | {item.data}
              <br />
              {item.obs && <em>{item.obs}</em>}
            </div>
          ))}
        </div>
      )}

      {/* SUBTOTAL */}
      <div className="card">
        <h2>Subtotal por período</h2>

        <input
          type="date"
          value={inicio}
          onChange={e => setInicio(e.target.value)}
        />

        <input
          type="date"
          value={fim}
          onChange={e => setFim(e.target.value)}
        />

        <button type="button" onClick={calcularSubtotal}>
          Calcular
        </button>

        <h3>Total: R$ {subtotal.toFixed(2)}</h3>
      </div>

      <button
        className="toggle danger"
        onClick={limparTudo}
      >
        Limpar todos os serviços
      </button>
    </div>
  );
}