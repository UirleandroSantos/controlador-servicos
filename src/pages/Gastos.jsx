import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Gastos() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuarioLogado) return null;

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
    carregar();
  }, []);

  const carregar = async () => {
    const { data } = await supabase
      .from("gastos")
      .select("*")
      .eq("usuario_id", usuarioLogado.id)
      .order("data", { ascending: false });

    setLista(data || []);
  };

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setObs("");
    setData(hoje);
  };

  const salvar = async () => {
    if (!descricao || !valor) {
      alert("Preencha tipo e valor");
      return;
    }

    if (editandoId) {
      await supabase
        .from("gastos")
        .update({
          descricao,
          valor: Number(valor),
          obs,
          data
        })
        .eq("id", editandoId);
    } else {
      await supabase.from("gastos").insert([
        {
          usuario_id: usuarioLogado.id,
          descricao,
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
    if (!window.confirm("Deseja excluir este gasto?")) return;

    await supabase.from("gastos").delete().eq("id", id);
    carregar();
  };

  const editar = (item) => {
    setDescricao(item.descricao);
    setValor(item.valor);
    setObs(item.obs || "");
    setData(item.data);
    setEditandoId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const totais = {
    "Almoço": 0,
    "Combustível": 0,
    "Outro": 0
  };

  gastosDoMes.forEach(item => {
    if (totais[item.descricao] !== undefined) {
      totais[item.descricao] += item.valor;
    }
  });

  return (
    <div className="space-y-6">

      {/* TÍTULO */}
      <div>
        <h1 className="text-3xl font-bold text-white">Controle de Gastos</h1>
        <p className="text-gray-400 text-sm">
          Registre e acompanhe suas despesas
        </p>
      </div>

      {/* FORM */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">

        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="" disabled>Selecione o tipo</option>
            <option>Almoço</option>
            <option>Combustível</option>
            <option>Outro</option>
          </select>

          <input
            type="number"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Valor (R$)"
            value={valor}
            onChange={e => setValor(e.target.value)}
          />

          <input
            type="date"
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={data}
            onChange={e => setData(e.target.value)}
          />

        </div>

        <textarea
          className="w-full bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Observações (opcional)"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button
          onClick={salvar}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition py-3 rounded-xl font-semibold shadow-md"
        >
          {editandoId ? "Atualizar Gasto" : "Salvar Gasto"}
        </button>
      </div>

      {/* BOTÃO */}
      <button
        onClick={() => setMostrarLista(!mostrarLista)}
        className="bg-slate-700 hover:bg-slate-600 transition px-5 py-2 rounded-xl font-medium"
      >
        {mostrarLista ? "Ocultar Gastos" : "Ver Gastos do Mês"}
      </button>

      {mostrarLista && (
        <div className="space-y-6">

          {/* RESUMO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center shadow">
              <p className="text-gray-400 text-sm">Total</p>
              <h2 className="text-red-400 font-bold text-lg">
                R$ {subtotalMes.toFixed(2)}
              </h2>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center shadow">
              <p className="text-gray-400 text-sm">Almoço</p>
              <h2 className="text-yellow-400 font-bold text-lg">
                R$ {totais["Almoço"].toFixed(2)}
              </h2>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center shadow">
              <p className="text-gray-400 text-sm">Combustível</p>
              <h2 className="text-blue-400 font-bold text-lg">
                R$ {totais["Combustível"].toFixed(2)}
              </h2>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center shadow">
              <p className="text-gray-400 text-sm">Outros</p>
              <h2 className="text-purple-400 font-bold text-lg">
                R$ {totais["Outro"].toFixed(2)}
              </h2>
            </div>

          </div>

          {/* LISTA */}
          <div className="bg-slate-800/70 backdrop-blur border border-slate-700 p-5 rounded-2xl shadow space-y-3">
            {gastosDoMes.map(item => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 border-b border-slate-700 pb-3 hover:bg-slate-700/30 px-3 py-2 rounded-lg transition"
              >
                <div>
                  <p className="text-white font-semibold">{item.descricao}</p>
                  <p className="text-sm text-gray-400">
                    R$ {item.valor} • {item.data}
                  </p>
                  {item.obs && (
                    <p className="text-xs text-gray-500">{item.obs}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editar(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-lg text-black font-semibold transition"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluir(item.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {gastosDoMes.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                Nenhum gasto encontrado neste mês.
              </p>
            )}
          </div>

        </div>
      )}

      {/* CONSULTA */}
      <div className="bg-slate-800/70 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">

        <h2 className="text-xl font-semibold text-white">
          Consultar por período
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="date"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <input
            type="date"
            value={fim}
            onChange={e => setFim(e.target.value)}
            className="bg-slate-900 border border-slate-600 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          onClick={calcularSubtotal}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-xl font-medium"
        >
          Calcular período
        </button>

        <h3 className="text-lg">
          Total: <span className="text-green-400 font-semibold">R$ {subtotal.toFixed(2)}</span>
        </h3>

        <div className="space-y-2">
          {gastosPeriodo.map(item => (
            <div
              key={item.id}
              className="text-sm border-b border-slate-700 pb-1"
            >
              {item.descricao} — R$ {item.valor} • {item.data}
            </div>
          ))}

          {gastosPeriodo.length === 0 && (
            <p className="text-gray-400 text-sm">
              Nenhum gasto no período selecionado.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}