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
  Filter 
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

  const [inicio, setInicio] = useState(primeiroDiaDoMes);
  const [fim, setFim] = useState(hoje);
  const [subtotal, setSubtotal] = useState(0);
  const [gastosPeriodo, setGastosPeriodo] = useState([]);

  const [editandoId, setEditandoId] = useState(null);
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [busca, setBusca] = useState("");

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

    limparFormulario();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-100 antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Receipt size={20} />
            </div>
            Controle de Saídas
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Registre suas despesas e controle as saídas financeiras
          </p>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 md:p-6 rounded-2xl shadow-xl space-y-4">
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

        <button
          onClick={salvar}
          className="w-full bg-rose-600 hover:bg-rose-500 font-medium text-white py-2.5 rounded-xl transition shadow-lg shadow-rose-950/20 text-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 size={16} />
          {editandoId ? "Atualizar Saída" : "Salvar Saída"}
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setMostrarLista(!mostrarLista)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 active:scale-95 shadow-sm cursor-pointer"
        >
          {mostrarLista ? (
            <>
              <EyeOff size={15} className="text-rose-400" /> Ocultar Saídas
            </>
          ) : (
            <>
              <Eye size={15} className="text-rose-400" /> Ver Saídas do Mês
            </>
          )}
        </button>
      </div>

      {mostrarLista && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total de Saídas no Mês</p>
              <h2 className="text-lg font-bold text-rose-400 font-mono mt-0.5">
                R$ {totalGastosMes.toFixed(2).replace(".", ",")}
              </h2>
            </div>
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Receipt size={20} />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por descrição ou observação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-2 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-rose-500/50 transition"
              />
            </div>

            <div className="space-y-2 pt-1">
              {gastosFiltrados.map(item => {
                const desc = item.descricao || item.nome || item.gasto || "Saída Sem Descrição";
                return (
                  <div
                    key={`${item.tipo_origem}-${item.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition group"
                  >
                    <div className="space-y-1">
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
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => excluir(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash size={15} />
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

      <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">Consultar Saídas por Período</h2>
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

        <button
          onClick={calcularSubtotal}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs transition shadow-lg shadow-indigo-950/20 active:scale-[0.99] cursor-pointer"
        >
          Calcular Período
        </button>

        {gastosPeriodo.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Subtotal de Saídas no Período</span>
              <span className="text-sm font-bold text-rose-400 font-mono">
                R$ {subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="space-y-2">
              {gastosPeriodo.map(item => {
                const desc = item.descricao || item.nome || item.gasto || "Saída Sem Descrição";
                return (
                  <div
                    key={`${item.tipo_origem}-${item.id}`}
                    className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {desc}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
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
    </div>
  );
}