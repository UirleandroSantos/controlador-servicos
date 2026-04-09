import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { Pencil, Trash } from "lucide-react";

export default function Servicos() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado) return null;

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
  const [gastos, setGastos] = useState([]);

  const [mostrarLista, setMostrarLista] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // ALTERAÇÃO AQUI
  const [inicio, setInicio] = useState(primeiroDiaDoMes);
  const [fim, setFim] = useState(hoje);

  const [subtotalPeriodo, setSubtotalPeriodo] = useState(0);
  const [servicosPeriodo, setServicosPeriodo] = useState([]);

  // NOVOS STATES PARA OS CARDS DO PERÍODO
  const [brutoPeriodo, setBrutoPeriodo] = useState(0);
  const [liquidoPeriodo, setLiquidoPeriodo] = useState(0);
  const [gastosPeriodo, setGastosPeriodo] = useState(0);
  const [receberPeriodo, setReceberPeriodo] = useState(0);

  // BUSCA
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
    carregarGastos();
  }, []);

  // GARANTE PADRÃO SEMPRE QUE CARREGAR
  useEffect(() => {
    setInicio(primeiroDiaDoMes);
    setFim(hoje);
  }, [primeiroDiaDoMes, hoje]);

  const carregar = async () => {
    const { data } = await supabase
      .from("servicos")
      .select("*")
      .eq("usuario_id", usuarioLogado.id)
      .order("data", { ascending: false });

    setLista(data || []);
  };

  const carregarGastos = async () => {
    const { data } = await supabase
      .from("gastos")
      .select("*")
      .eq("usuario_id", usuarioLogado.id);

    setGastos(data || []);
  };

  const limparFormulario = () => {
    setServico("");
    setNome("");
    setValor("");
    setObs("");
    setData(hoje);
  };

  const salvar = async () => {
    if (!servico || !nome || !valor) {
      alert("Preencha tudo");
      return;
    }

    if (editandoId) {
      await supabase
        .from("servicos")
        .update({
          servico,
          nome,
          valor: Number(valor),
          obs,
          data
        })
        .eq("id", editandoId);
    } else {
      await supabase.from("servicos").insert([
        {
          usuario_id: usuarioLogado.id,
          servico,
          nome,
          valor: Number(valor),
          obs,
          data
        }
      ]);
    }

    setEditandoId(null);
    limparFormulario();
    carregar();
  };

  const excluir = async (id) => {
    if (!window.confirm("Deseja excluir este serviço?")) return;

    await supabase.from("servicos").delete().eq("id", id);
    carregar();
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

  const calcularPeriodo = () => {
    const filtrados = lista.filter(
      i => (!inicio || i.data >= inicio) && (!fim || i.data <= fim)
    );

    const gastosFiltrados = gastos.filter(
      i => (!inicio || i.data >= inicio) && (!fim || i.data <= fim)
    );

    const bruto = filtrados.reduce((s, i) => s + i.valor, 0);
    const gastosTotal = gastosFiltrados.reduce((s, i) => s + i.valor, 0);
    const liquido = bruto / 2;
    const receber = (bruto - gastosTotal) / 2;

    setSubtotalPeriodo(bruto);
    setServicosPeriodo(filtrados);

    // SET DOS CARDS
    setBrutoPeriodo(bruto);
    setLiquidoPeriodo(liquido);
    setGastosPeriodo(gastosTotal);
    setReceberPeriodo(receber);
  };

  const servicosPeriodoFiltrados = servicosPeriodo.filter(item =>
    item.servico.toLowerCase().includes(busca.toLowerCase()) ||
    item.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (item.obs || "").toLowerCase().includes(busca.toLowerCase())
  );

  const servicosDoMes = lista.filter(
    i => i.data >= primeiroDiaDoMes && i.data <= hoje
  );

  const servicosFiltrados = servicosDoMes.filter(item =>
    item.servico.toLowerCase().includes(busca.toLowerCase()) ||
    item.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (item.obs || "").toLowerCase().includes(busca.toLowerCase())
  );

  const totalBruto = servicosDoMes.reduce((s, i) => s + i.valor, 0);
  const totalLiquido = totalBruto / 2;

  const gastosDoMes = gastos.filter(
    i => i.data >= primeiroDiaDoMes && i.data <= hoje
  );

  const totalGastos = gastosDoMes.reduce((s, i) => s + i.valor, 0);
  const totalReceber = (totalBruto - totalGastos) / 2;

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-white">Controle de Serviços</h1>
        <p className="text-gray-400 text-sm">
          Cadastre e acompanhe seus serviços
        </p>
      </div>

      {/* FORM */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">

        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={servico}
            onChange={e => setServico(e.target.value)}
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="" disabled>Selecione o serviço</option>
            <option>Banho</option>
            <option>Banho + Tosa Higiênica</option>
            <option>Banho + Tosa Completa</option>
            <option>Outro</option>
          </select>

          <input
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl"
            placeholder="Nome do cliente"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />

          <input
            type="number"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl"
            placeholder="Valor (R$)"
            value={valor}
            onChange={e => setValor(e.target.value)}
          />

          <input
            type="date"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl"
            value={data}
            onChange={e => setData(e.target.value)}
          />
        </div>

        <textarea
          className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl"
          placeholder="Observações"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button
          onClick={salvar}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-xl font-semibold"
        >
          {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
        </button>
      </div>

      {/* BOTÃO */}
      <button
        onClick={() => setMostrarLista(!mostrarLista)}
        className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-xl"
      >
        {mostrarLista ? "Ocultar Trabalhos" : "Ver Trabalhos do Mês"}
      </button>

      {mostrarLista && (
        <div className="space-y-6">

          {/* RESUMO */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card titulo="Bruto" valor={totalBruto} cor="text-green-400" />
            <Card titulo="Líquido" valor={totalLiquido} cor="text-blue-400" />
            <Card titulo="Gastos" valor={totalGastos} cor="text-red-400" />
            <Card titulo="Receber" valor={totalReceber} cor="text-purple-400" />
          </div>

          {/* BUSCA */}
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl"
          />

          {/* LISTA */}
          <div className="bg-slate-800/70 border border-slate-700 p-5 rounded-2xl space-y-3">
            {servicosFiltrados.map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b border-slate-700 pb-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.servico} — {item.nome}
                  </p>
                  <p className="text-sm text-gray-400">
                    {item.data} • <span className="text-green-400">R$ {item.valor.toFixed(2).replace(".",",")}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => editar(item)}
                    className="bg-blue-500  px-2 py-1 rounded-lg w-fit"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => excluir(item.id)}
                    className="bg-red-500 px-2 py-1 rounded-lg w-fit"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}

            {servicosFiltrados.length === 0 && (
              <p className="text-gray-400 text-center">
                Nenhum resultado encontrado
              </p>
            )}
          </div>

        </div>
      )}

      {/* PERÍODO */}
      <div className="bg-slate-800/70 border border-slate-700 p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white">Consultar por período</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid md:grid-cols-2">
            <label>Data Inicio</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="bg-slate-900 p-3 rounded-xl" />
          </div>
          <div className="grid md:grid-cols-2">
            <label>Data Fim</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="bg-slate-900 p-3 rounded-xl" />
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar no período..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl"
        />

        <button
          onClick={calcularPeriodo}
          className="w-full bg-indigo-600 py-2 rounded-xl"
        >
          Calcular período
        </button>

        {/* CARDS DO PERÍODO */}
        {servicosPeriodo.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card titulo="Bruto" valor={brutoPeriodo} cor="text-green-400" />
            <Card titulo="Líquido" valor={liquidoPeriodo} cor="text-blue-400" />
            <Card titulo="Gastos" valor={gastosPeriodo} cor="text-red-400" />
            <Card titulo="Receber" valor={receberPeriodo} cor="text-purple-400" />
          </div>
        )}

        <h3>
          Total: <span className="text-green-400">R$ {subtotalPeriodo.toFixed(2).replace(".",",")}</span>
        </h3>

        <div className="space-y-3">
          {servicosPeriodoFiltrados.map(item => (  // 👈 ÚNICA ALTERAÇÃO AQUI
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <p className="text-white font-semibold">
                {item.servico} — {item.nome}
              </p>
              <p className="text-sm text-gray-400">
                {item.data}
              </p>
              <p className="text-green-400 font-bold mt-1">
                R$ {item.valor.toFixed(2).replace(".",",")}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* COMPONENTE CARD */
function Card({ titulo, valor, cor }) {
  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
      <p className="text-gray-400 text-sm">{titulo}</p>
      <h2 className={`font-bold ${cor}`}>R$ {valor.toFixed(2).replace(".",",")}</h2>
    </div>
  );
}