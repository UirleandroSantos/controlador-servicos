import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { 
  Pencil, 
  Trash, 
  PlusCircle, 
  Receipt, 
  Search, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Filter,
  X,
  AlertTriangle
} from "lucide-react";

export default function Gastos() {
  const usuarioLogado = useMemo(() => {
    try {
      const item = localStorage.getItem("usuarioLogado");
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = usuarioLogado?.id ? Number(usuarioLogado.id) : null;

  const { hoje, primeiroDiaDoMes } = useMemo(() => {
    const dataAtual = new Date();
    const hojeStr = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-${String(dataAtual.getDate()).padStart(2, "0")}`;
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    return {
      hoje: hojeStr,
      primeiroDiaDoMes: `${ano}-${mes}-01`
    };
  }, []);

  const [tipoSaida, setTipoSaida] = useState("Gasto");
  const [descricao, setDescricao] = useState("Alimentação");
  const [descricaoOutro, setDescricaoOutro] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [data, setData] = useState(hoje);

  const [lista, setLista] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);

  const [inicio, setInicio] = useState(primeiroDiaDoMes);
  const [fim, setFim] = useState(hoje);
  const [subtotal, setSubtotal] = useState(0);
  const [gastosPeriodo, setGastosPeriodo] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [busca, setBusca] = useState("");

  const [showDeletePeriodModal, setShowDeletePeriodModal] = useState(false);
  const [deleteInicio, setDeleteInicio] = useState(primeiroDiaDoMes);
  const [deleteFim, setDeleteFim] = useState(hoje);
  const [excluindoPeriodo, setExcluindoPeriodo] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;

    // Busca registros das duas tabelas em paralelo
    const [resGastos, resAdiantamentos] = await Promise.all([
      supabase.from("gastos").select("*").eq("usuario_id", userId),
      supabase.from("adiantamentos").select("*").eq("usuario_id", userId)
    ]);

    if (resGastos.error) console.error("Erro ao carregar gastos:", resGastos.error);
    if (resAdiantamentos.error) console.error("Erro ao carregar adiantamentos:", resAdiantamentos.error);

    const gastosFormatados = (resGastos.data || []).map(item => ({
      ...item,
      tipo_origem: "Gasto"
    }));

    const adiantamentosFormatados = (resAdiantamentos.data || []).map(item => ({
      ...item,
      tipo_origem: "Adiantamento"
    }));

    // Une as duas listas e ordena por data decrescente
    const unificados = [...gastosFormatados, ...adiantamentosFormatados].sort(
      (a, b) => new Date(b.data) - new Date(a.data)
    );

    setLista(unificados);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      carregar();
    }
  }, [userId, carregar]);

  if (!usuarioLogado) {
    return (
      <div className="p-8 text-center text-slate-400">
        Nenhum usuário logado encontrado.
      </div>
    );
  }

  const limparFormulario = () => {
    setTipoSaida("Gasto");
    setDescricao("Alimentação");
    setDescricaoOutro("");
    setValor("");
    setObs("");
    setData(hoje);
    setEditandoId(null);
    setEditandoTipo(null);
  };

  const abrirModalNovaSaida = () => {
    limparFormulario();
    setShowFormModal(true);
  };

  const fecharModalForm = () => {
    setShowFormModal(false);
    limparFormulario();
  };

  const salvar = async () => {
    const descFinal = tipoSaida === "Gasto" 
      ? (descricao === "Outro" ? descricaoOutro : descricao)
      : descricao;

    if (!descFinal || !valor) {
      alert("Preencha a descrição/tipo e o valor");
      return;
    }

    const payload = {
      usuario_id: userId,
      descricao: `[${tipoSaida}] ${descFinal}`,
      valor: Number(valor),
      obs,
      data
    };

    const tabelaDestino = tipoSaida === "Gasto" ? "gastos" : "adiantamentos";

    if (editandoId) {
      // Se alterou o tipo durante a edição, remove da tabela antiga e insere na nova
      if (editandoTipo !== tipoSaida) {
        const tabelaAntiga = editandoTipo === "Gasto" ? "gastos" : "adiantamentos";
        await supabase.from(tabelaAntiga).delete().eq("id", editandoId);
        
        const { error } = await supabase.from(tabelaDestino).insert([payload]);
        if (error) {
          alert("Erro ao salvar saída: " + error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from(tabelaDestino)
          .update(payload)
          .eq("id", editandoId);

        if (error) {
          alert("Erro ao atualizar saída: " + error.message);
          return;
        }
      }
    } else {
      const { error } = await supabase.from(tabelaDestino).insert([payload]);

      if (error) {
        alert("Erro ao salvar saída: " + error.message);
        return;
      }
    }

    fecharModalForm();
    carregar();
  };

  const excluir = async (item) => {
    if (!window.confirm("Deseja excluir esta saída?")) return;

    const tabela = item.tipo_origem === "Gasto" ? "gastos" : "adiantamentos";
    const { error } = await supabase.from(tabela).delete().eq("id", item.id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }
    carregar();
  };

  const qtdSaidasParaExcluir = useMemo(() => {
    if (!deleteInicio || !deleteFim) return 0;
    return lista.filter(i => i.data >= deleteInicio && i.data <= deleteFim).length;
  }, [lista, deleteInicio, deleteFim]);

  const apagarPorPeriodo = async () => {
    if (!deleteInicio || !deleteFim) {
      alert("Selecione a data inicial e a data final.");
      return;
    }

    if (deleteInicio > deleteFim) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    if (qtdSaidasParaExcluir === 0) {
      alert("Nenhuma saída encontrada no período selecionado.");
      return;
    }

    const [y1, m1, d1] = deleteInicio.split("-");
    const [y2, m2, d2] = deleteFim.split("-");
    const confirmacao = window.confirm(
      `Tem certeza que deseja apagar permanentemente ${qtdSaidasParaExcluir} saída(s) de ${d1}/${m1}/${y1} até ${d2}/${m2}/${y2}?`
    );

    if (!confirmacao) return;

    setExcluindoPeriodo(true);
    const [resGastos, resAdiantamentos] = await Promise.all([
      supabase
        .from("gastos")
        .delete()
        .eq("usuario_id", userId)
        .gte("data", deleteInicio)
        .lte("data", deleteFim),
      supabase
        .from("adiantamentos")
        .delete()
        .eq("usuario_id", userId)
        .gte("data", deleteInicio)
        .lte("data", deleteFim)
    ]);

    setExcluindoPeriodo(false);

    if (resGastos.error || resAdiantamentos.error) {
      alert(
        "Erro ao apagar saídas do período: " +
        (resGastos.error?.message || resAdiantamentos.error?.message)
      );
      return;
    }

    setShowDeletePeriodModal(false);
    setGastosPeriodo([]);
    carregar();
  };

  const editar = (item) => {
    const descTratada = item.descricao || item.nome || item.gasto || "";
    const eAdiantamento = item.tipo_origem === "Adiantamento" || descTratada.startsWith("[Adiantamento]");

    if (eAdiantamento) {
      setTipoSaida("Adiantamento");
      setDescricao(descTratada.replace("[Adiantamento] ", ""));
    } else {
      setTipoSaida("Gasto");
      const limpa = descTratada.replace("[Gasto] ", "");
      if (["Alimentação", "Combustível", "Transporte"].includes(limpa)) {
        setDescricao(limpa);
        setDescricaoOutro("");
      } else {
        setDescricao("Outro");
        setDescricaoOutro(limpa);
      }
    }

    setValor(item.valor);
    setObs(item.obs || "");
    setData(item.data);
    setEditandoId(item.id);
    setEditandoTipo(eAdiantamento ? "Adiantamento" : "Gasto");
    setShowFormModal(true);
  };

  const calcularSubtotal = () => {
    const filtrados = lista.filter(
      i => (!inicio || i.data >= inicio) && (!fim || i.data <= fim)
    );

    setSubtotal(filtrados.reduce((s, i) => s + Number(i.valor || 0), 0));
    setGastosPeriodo(filtrados);
  };

  const gastosDoMes = useMemo(() => {
    return lista.filter(
      i => i.data >= primeiroDiaDoMes && i.data <= hoje
    );
  }, [lista, primeiroDiaDoMes, hoje]);

  const gastosFiltrados = gastosDoMes.filter(item => {
    const desc = item.descricao || item.nome || item.gasto || "";
    const observacao = item.obs || "";
    return desc.toLowerCase().includes(busca.toLowerCase()) ||
           observacao.toLowerCase().includes(busca.toLowerCase());
  });

  const totalGastosMes = gastosDoMes.reduce((s, i) => s + Number(i.valor || 0), 0);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col justify-between gap-3 py-2 px-3 text-slate-100 antialiased overflow-hidden">
      {/* Cabeçalho e Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Receipt size={18} />
            </div>
            Controle de Saídas
          </h1>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Registre suas despesas e controle as saídas financeiras
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={abrirModalNovaSaida}
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/30 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={15} />
            Nova Saída
          </button>

          <button
            onClick={() => setMostrarLista(!mostrarLista)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
          >
            {mostrarLista ? (
              <>
                <EyeOff size={14} className="text-rose-400" /> Ocultar Saídas
              </>
            ) : (
              <>
                <Eye size={14} className="text-rose-400" /> Ver Saídas do Mês
              </>
            )}
          </button>
        </div>
      </div>

      {/* Área Central Dinâmica (Ajustada para caber na tela) */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {mostrarLista && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-2xl flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Total de Saídas no Mês</p>
                <h2 className="text-base font-bold text-rose-400 font-mono">
                  R$ {totalGastosMes.toFixed(2).replace(".", ",")}
                </h2>
              </div>
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <Receipt size={18} />
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex flex-col gap-2.5">
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou observação..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-rose-500/50 transition"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {gastosFiltrados.map(item => {
                  const desc = item.descricao || item.nome || item.gasto || "Saída Sem Descrição";
                  return (
                    <div
                      key={`${item.tipo_origem}-${item.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition group"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-100">
                          {desc}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{item.data}</span>
                          <span>•</span>
                          <span className="text-rose-400 font-semibold font-mono">
                            R$ {Number(item.valor || 0).toFixed(2).replace(".", ",")}
                          </span>
                        </p>
                        {item.obs && (
                          <p className="text-[10px] text-slate-500 italic">"{item.obs}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editar(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => excluir(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {gastosFiltrados.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-500">Nenhuma saída encontrada neste mês.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Consulta por Período */}
        <div className={`bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-2.5 ${!mostrarLista ? "flex-1 flex flex-col min-h-0" : "shrink-0"}`}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Filter size={15} className="text-indigo-400" />
              <h2 className="text-xs font-semibold text-slate-200">Consultar Saídas por Período</h2>
            </div>

            <div className="flex items-end gap-2 flex-wrap">
              <div>
                <label className="text-[10px] font-medium text-slate-400 mb-0.5 block">Início</label>
                <input 
                  type="date" 
                  value={inicio} 
                  onChange={e => setInicio(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition" 
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-400 mb-0.5 block">Fim</label>
                <input 
                  type="date" 
                  value={fim} 
                  onChange={e => setFim(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition" 
                />
              </div>
              <button
                onClick={calcularSubtotal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-1.5 rounded-xl text-xs transition shadow-lg shadow-indigo-950/20 active:scale-[0.99] cursor-pointer h-[32px]"
              >
                Calcular Período
              </button>
            </div>
          </div>

          {gastosPeriodo.length > 0 && (
            <div className="space-y-2 pt-1 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                <span className="text-xs text-slate-400 font-medium">Subtotal de Saídas no Período</span>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-32 pr-1">
                {gastosPeriodo.map(item => {
                  const desc = item.descricao || item.nome || item.gasto || "Saída Sem Descrição";
                  return (
                    <div
                      key={`${item.tipo_origem}-${item.id}`}
                      className="bg-slate-950 border border-slate-800/80 p-2 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          {desc}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.data}
                        </p>
                      </div>
                      <p className="text-xs text-rose-400 font-bold font-mono">
                        R$ {Number(item.valor || 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button
            onClick={() => setShowDeletePeriodModal(true)}
            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Trash size={14} />
            Apagar por Período
          </button>
      </div>

      {/* Modal de Criação / Edição de Saída */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 md:p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={fecharModalForm}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <PlusCircle size={18} className="text-rose-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                {editandoId ? "Editar Saída" : "Nova Saída"}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Tipo de Saída</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 outline-none transition"
                  value={tipoSaida}
                  onChange={e => {
                    setTipoSaida(e.target.value);
                    if (e.target.value === "Gasto") {
                      setDescricao("Alimentação");
                    } else {
                      setDescricao("");
                    }
                  }}
                >
                  <option value="Gasto">Gasto</option>
                  <option value="Adiantamento">Adiantamento</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Descrição / Categoria</label>
                {tipoSaida === "Gasto" ? (
                  <div className="space-y-2">
                    <select
                      className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 outline-none transition"
                      value={descricao}
                      onChange={e => setDescricao(e.target.value)}
                    >
                      <option value="Alimentação">Alimentação</option>
                      <option value="Combustível">Combustível</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Outro">Outro</option>
                    </select>

                    {descricao === "Outro" && (
                      <input
                        className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
                        placeholder="Especifique a descrição..."
                        value={descricaoOutro}
                        onChange={e => setDescricaoOutro(e.target.value)}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
                    placeholder="Ex: Nome do funcionário ou finalidade"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Valor da Saída</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 pl-8 pr-3 py-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition font-mono"
                    placeholder="0,00"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Data da Saída</label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 outline-none transition"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Observações (opcional)</label>
                <input
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 p-2.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
                  placeholder="Ex: Compra parcelada, fornecedor X..."
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={fecharModalForm}
                className="w-1/3 bg-slate-950 hover:bg-slate-800 border border-slate-800 font-medium text-slate-300 py-2.5 rounded-xl transition text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                className="w-2/3 bg-rose-600 hover:bg-rose-500 font-medium text-white py-2.5 rounded-xl transition shadow-lg shadow-rose-950/20 text-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                {editandoId ? "Atualizar Saída" : "Salvar Saída"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Apagar por Período */}
      {showDeletePeriodModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowDeletePeriodModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Apagar por Período</h3>
                <p className="text-[11px] text-slate-400">Exclua gastos e adiantamentos do intervalo</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={deleteInicio}
                  onChange={(e) => setDeleteInicio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={deleteFim}
                  onChange={(e) => setDeleteFim(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-xs text-rose-300 font-medium">
                  {qtdSaidasParaExcluir === 0
                    ? "Nenhuma saída encontrada neste período."
                    : `${qtdSaidasParaExcluir} saída(s) encontrada(s) para exclusão.`}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowDeletePeriodModal(false)}
                  disabled={excluindoPeriodo}
                  className="w-1/2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs py-2 rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={apagarPorPeriodo}
                  disabled={excluindoPeriodo || qtdSaidasParaExcluir === 0}
                  className="w-1/2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash size={13} />
                  {excluindoPeriodo ? "Apagando..." : "Apagar Tudo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}