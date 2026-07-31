import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { 
  Pencil, 
  Trash, 
  PlusCircle, 
  Calendar, 
  Search, 
  Scissors, 
  DollarSign, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Filter,
  Share2,
  Send,
  X
} from "lucide-react";

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

  // ESTADOS DO COMPARTILHAMENTO
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCustomPeriodModal, setShowCustomPeriodModal] = useState(false);
  const [shareInicio, setShareInicio] = useState(hoje);
  const [shareFim, setShareFim] = useState(hoje);

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

  // --- LÓGICA DE COMPARTILHAMENTO VIA WHATSAPP ---
  const processarCompartilhamento = (dataInicio, dataFim, titulo) => {
    const servicosFiltrados = lista.filter(
      i => (!dataInicio || i.data >= dataInicio) && (!dataFim || i.data <= dataFim)
    );

    const gastosFiltrados = gastos.filter(
      i => (!dataInicio || i.data >= dataInicio) && (!dataFim || i.data <= dataFim)
    );

    const totalBrutoServicos = servicosFiltrados.reduce((acc, cur) => acc + Number(cur.valor || 0), 0);
    const totalGastosComp = gastosFiltrados.reduce((acc, cur) => acc + Number(cur.valor || 0), 0);
    const liquidoComp = totalBrutoServicos / 2;
    const receberComp = (totalBrutoServicos - totalGastosComp) / 2;

    const formatarDataBR = (strData) => {
      if (!strData) return "";
      const [y, m, d] = strData.split("-");
      return `${d}/${m}/${y}`;
    };

    // Helper para obter o dia da semana por extenso + data BR
    const formatarCabecalhoDia = (strData) => {
      if (!strData) return "";
      const [y, m, d] = strData.split("-");
      const dataObj = new Date(Number(y), Number(m) - 1, Number(d));
      
      let diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
      // Capitaliza a primeira letra do dia da semana
      diaSemana = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

      return `${diaSemana} - ${d}/${m}/${y}`;
    };

    let msg = `📊 *RESUMO FINANCEIRO - ${titulo.toUpperCase()}*\n`;
    if (dataInicio && dataFim) {
      msg += `📅 *Período:* ${formatarDataBR(dataInicio)} até ${formatarDataBR(dataFim)}\n\n`;
    } else {
      msg += `\n`;
    }

    msg += `💵 *Bruto Total:* R$ ${totalBrutoServicos.toFixed(2).replace(".", ",")}\n`;
    msg += `📉 *Total de Gastos:* R$ ${totalGastosComp.toFixed(2).replace(".", ",")}\n`;
    msg += `🔷 *Líquido:* R$ ${liquidoComp.toFixed(2).replace(".", ",")}\n`;
    msg += `⭐ *A Receber:* R$ ${receberComp.toFixed(2).replace(".", ",")}\n\n`;

    msg += `-----------------------------------\n`;
    msg += `✂️ *SERVIÇOS PRESTADOS (${servicosFiltrados.length})*\n`;

    if (servicosFiltrados.length === 0) {
      msg += `_Nenhum serviço cadastrado no período._\n`;
    } else {
      // 1. Agrupa os serviços pela data (ordem decrescente de data)
      const servicosPorData = servicosFiltrados.reduce((acc, item) => {
        if (!acc[item.data]) acc[item.data] = [];
        acc[item.data].push(item);
        return acc;
      }, {});

      // Ordena as datas (das mais recentes para as mais antigas)
      const datasOrdenadas = Object.keys(servicosPorData).sort((a, b) => b.localeCompare(a));

      // 2. Itera sobre cada grupo de data
      datasOrdenadas.forEach((dataChave) => {
        msg += `\n📅 *${formatarCabecalhoDia(dataChave)}*\n`;
        servicosPorData[dataChave].forEach((item) => {
          msg += `• *${item.servico}* (${item.nome}) - R$ ${Number(item.valor).toFixed(2).replace(".", ",")}\n`;
        });
      });
    }

    msg += `\n-----------------------------------\n`;
    msg += `💸 *GASTOS/DESPESAS (${gastosFiltrados.length})*\n`;
    if (gastosFiltrados.length === 0) {
      msg += `_Nenhum gasto cadastrado no período._\n`;
    } else {
      gastosFiltrados.forEach((gasto) => {
        const desc = gasto.descricao || gasto.nome || gasto.gasto || "Gasto";
        msg += `• *${desc}* - R$ ${Number(gasto.valor).toFixed(2).replace(".", ",")} [${formatarDataBR(gasto.data)}]\n`;
      });
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");

    setShowShareModal(false);
    setShowCustomPeriodModal(false);
  };

  const handleCompartilharHoje = () => {
    processarCompartilhamento(hoje, hoje, "Dia Atual");
  };

  const handleCompartilharSemana = () => {
    const hojeDate = new Date();
    const diaSemana = hojeDate.getDay();
    const dom = new Date(hojeDate);
    dom.setDate(hojeDate.getDate() - diaSemana);
    
    const sab = new Date(dom);
    sab.setDate(dom.getDate() + 6);

    const domStr = dom.toISOString().split("T")[0];
    const sabStr = sab.toISOString().split("T")[0];

    processarCompartilhamento(domStr, sabStr, "Semana Atual");
  };

  const handleCompartilharQuinzena = () => {
    const hojeObj = new Date();
    const dia = hojeObj.getDate();
    const y = hojeObj.getFullYear();
    const m = String(hojeObj.getMonth() + 1).padStart(2, "0");

    let dtInicio = "";
    let dtFim = "";
    let rotulo = "";

    if (dia <= 15) {
      dtInicio = `${y}-${m}-01`;
      dtFim = `${y}-${m}-15`;
      rotulo = "1ª Quinzena";
    } else {
      const ultimoDia = new Date(y, hojeObj.getMonth() + 1, 0).getDate();
      dtInicio = `${y}-${m}-16`;
      dtFim = `${y}-${m}-${ultimoDia}`;
      rotulo = "2ª Quinzena";
    }

    processarCompartilhamento(dtInicio, dtFim, rotulo);
  };

  const handleCompartilharCustomizado = () => {
    if (!shareInicio || !shareFim) {
      alert("Selecione a data inicial e final.");
      return;
    }
    processarCompartilhamento(shareInicio, shareFim, "Período Escolhido");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-100 antialiased">

      {/* BOTÃO COMPARTILHAR */}
        <button
          onClick={() => setShowShareModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Share2 size={16} />
          Compartilhar
        </button>

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Scissors size={20} />
            </div>
            Controle de Serviços
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Cadastre novos atendimentos e acompanhe suas finanças
          </p>
        </div>

        
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle size={18} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            {editandoId ? "Editar Atendimento" : "Novo Atendimento"}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Serviço Prestado</label>
            <select
              value={servico}
              onChange={e => setServico(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 p-2.5 rounded-xl text-xs text-slate-200 outline-none transition"
            >
              <option value="" disabled>Selecione o serviço</option>
              <option>Banho</option>
              <option>Banho + Tosa Higiênica</option>
              <option>Banho + Tosa Completa</option>
              <option>Outro</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome do Pet ou Cliente</label>
            <input
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
              placeholder="Ex: Rex / Maria Silva"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Valor Cobrado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 pl-8 pr-3 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition font-mono"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data do Atendimento</label>
            <input
              type="date"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 p-2.5 rounded-xl text-xs text-slate-200 outline-none transition"
              value={data}
              onChange={e => setData(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Observações (opcional)</label>
          <textarea
            rows="2"
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition resize-none"
            placeholder="Anotações adicionais sobre o pet ou cliente..."
            value={obs}
            onChange={e => setObs(e.target.value)}
          />
        </div>

        <button
          onClick={salvar}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-medium text-white py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/20 text-xs active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
        </button>
      </div>

      {/* BOTÃO ALTERNAR VISUALIZAÇÃO */}
      <div className="flex justify-end">
        <button
          onClick={() => setMostrarLista(!mostrarLista)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 active:scale-95 shadow-sm"
        >
          {mostrarLista ? (
            <>
              <EyeOff size={15} className="text-rose-400" /> Ocultar Trabalhos
            </>
          ) : (
            <>
              <Eye size={15} className="text-emerald-400" /> Ver Trabalhos do Mês
            </>
          )}
        </button>
      </div>

      {/* LISTA DO MÊS */}
      {mostrarLista && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* CARDS RESUMO DO MÊS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card titulo="Bruto" valor={totalBruto} cor="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
            <Card titulo="Líquido" valor={totalLiquido} cor="text-sky-400" bg="bg-sky-500/10 border-sky-500/20" />
            <Card titulo="Gastos" valor={totalGastos} cor="text-rose-400" bg="bg-rose-500/10 border-rose-500/20" />
            <Card titulo="A Receber" valor={totalReceber} cor="text-purple-400" bg="bg-purple-500/10 border-purple-500/20" />
          </div>

          {/* LISTA E BUSCA */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por serviço, cliente ou obs..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 transition"
              />
            </div>

            <div className="space-y-2 pt-1">
              {servicosFiltrados.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {item.servico}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        {item.nome}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{item.data}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        R$ {item.valor.toFixed(2).replace(".",",")}
                      </span>
                    </p>
                    {item.obs && (
                      <p className="text-[10px] text-slate-500 italic">"{item.obs}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => editar(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => excluir(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Excluir"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {servicosFiltrados.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500">Nenhum serviço encontrado no período.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SEÇÃO DE CONSULTA POR PERÍODO */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">Consultar por Período Customizado</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">Início</label>
            <input 
              type="date" 
              value={inicio} 
              onChange={e => setInicio(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition" 
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1 block">Fim</label>
            <input 
              type="date" 
              value={fim} 
              onChange={e => setFim(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition" 
            />
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar resultados da busca..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <button
          onClick={calcularPeriodo}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-950/20 active:scale-[0.99]"
        >
          Calcular Período
        </button>

        {/* CARDS DO PERÍODO */}
        {servicosPeriodo.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <Card titulo="Bruto" valor={brutoPeriodo} cor="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
              <Card titulo="Líquido" valor={liquidoPeriodo} cor="text-sky-400" bg="bg-sky-500/10 border-sky-500/20" />
              <Card titulo="Gastos" valor={gastosPeriodo} cor="text-rose-400" bg="bg-rose-500/10 border-rose-500/20" />
              <Card titulo="A Receber" valor={receberPeriodo} cor="text-purple-400" bg="bg-purple-500/10 border-purple-500/20" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Subtotal Calculado</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                R$ {subtotalPeriodo.toFixed(2).replace(".",",")}
              </span>
            </div>

            <div className="space-y-2">
              {servicosPeriodoFiltrados.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {item.servico} — <span className="text-slate-400 font-normal">{item.nome}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {item.data}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-400 font-bold font-mono">
                    R$ {item.valor.toFixed(2).replace(".",",")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE COMPARTILHAMENTO */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => {
                setShowShareModal(false);
                setShowCustomPeriodModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Compartilhar Relatório</h3>
                <p className="text-[11px] text-slate-400">Envie o resumo diretamente via WhatsApp</p>
              </div>
            </div>

            {!showCustomPeriodModal ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCompartilharHoje}
                  className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition group"
                >
                  <span>Dia Atual (Hoje)</span>
                  <Send size={14} className="text-slate-500 group-hover:text-emerald-400 transition" />
                </button>

                <button
                  onClick={handleCompartilharSemana}
                  className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition group"
                >
                  <span>Semana Atual</span>
                  <Send size={14} className="text-slate-500 group-hover:text-emerald-400 transition" />
                </button>

                <button
                  onClick={handleCompartilharQuinzena}
                  className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-between transition group"
                >
                  <div className="text-left">
                    <p>Quinzena Atual</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date().getDate() <= 15 ? "1ª Quinzena (01 ao 15)" : "2ª Quinzena (16 ao Fim)"}
                    </p>
                  </div>
                  <Send size={14} className="text-slate-500 group-hover:text-emerald-400 transition" />
                </button>

                <button
                  onClick={() => setShowCustomPeriodModal(true)}
                  className="w-full bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 p-3 rounded-xl text-xs font-medium text-slate-300 flex items-center justify-between transition"
                >
                  <span>Escolher Período...</span>
                  <Calendar size={14} className="text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">Data Inicial</label>
                  <input
                    type="date"
                    value={shareInicio}
                    onChange={(e) => setShareInicio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">Data Final</label>
                  <input
                    type="date"
                    value={shareFim}
                    onChange={(e) => setShareFim(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowCustomPeriodModal(false)}
                    className="w-1/2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs py-2 rounded-xl font-medium transition"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleCompartilharCustomizado}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* COMPONENTE CARD MELHORADO */
function Card({ titulo, valor, cor, bg }) {
  return (
    <div className={`border p-3 rounded-xl text-center flex flex-col justify-between ${bg}`}>
      <p className="text-slate-400 text-[11px] font-medium mb-1">{titulo}</p>
      <h2 className={`text-sm font-extrabold font-mono ${cor}`}>
        R$ {valor.toFixed(2).replace(".",",")}
      </h2>
    </div>
  );
}