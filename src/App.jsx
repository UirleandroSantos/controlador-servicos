// import { useEffect, useState } from "react";
// import "./App.css";

// export default function App() {
//   const hoje = new Date().toISOString().split("T")[0];

//   const ano = new Date().getFullYear();
//   const mes = String(new Date().getMonth() + 1).padStart(2, "0");
//   const primeiroDiaDoMes = `${ano}-${mes}-01`;

//   const [servico, setServico] = useState("");
//   const [nome, setNome] = useState("");
//   const [valor, setValor] = useState("");
//   const [obs, setObs] = useState("");
//   const [data, setData] = useState(hoje);

//   const [lista, setLista] = useState([]);
//   const [mostrarLista, setMostrarLista] = useState(false);

//   const [inicio, setInicio] = useState("");
//   const [fim, setFim] = useState("");
//   const [subtotal, setSubtotal] = useState(0);
//   const [servicosPeriodo, setServicosPeriodo] = useState([]);

//   const [editandoId, setEditandoId] = useState(null);

//   function handleSelectedChange(e) {
//     const opcaoSelecionada = e.target.value;
//     setServico(opcaoSelecionada);

//     switch(opcaoSelecionada){
      
//     }
//   }

//   useEffect(() => {
//     const dados = JSON.parse(localStorage.getItem("servicos")) || [];
//     setLista(dados);
//   }, []);

//   const limparFormulario = () => {
//     setServico("");
//     setNome("");
//     setValor("");
//     setObs("");
//     setData(hoje);
//   };

//   const salvar = () => {
//     if (!servico || !nome || !valor) {
//       alert("Preencha Serviço, Nome e Valor");
//       return;
//     }

//     if (editandoId) {
//       const listaAtualizada = lista.map(item =>
//         item.id === editandoId
//           ? { ...item, servico, nome, valor: Number(valor), obs, data }
//           : item
//       );
//       setLista(listaAtualizada);
//       localStorage.setItem("servicos", JSON.stringify(listaAtualizada));
//       setEditandoId(null);
//     } else {
//       const novoServico = {
//         id: Date.now(),
//         servico,
//         nome,
//         valor: Number(valor),
//         obs,
//         data,
//       };
//       const novaLista = [...lista, novoServico];
//       setLista(novaLista);
//       localStorage.setItem("servicos", JSON.stringify(novaLista));
//     }

//     limparFormulario();
//   };

//   const editarServico = (item) => {
//     setServico(item.servico);
//     setNome(item.nome);
//     setValor(item.valor);
//     setObs(item.obs || "");
//     setData(item.data);
//     setEditandoId(item.id);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   // const limparTodos = () => {
//   //   if (!window.confirm("Deseja apagar TODOS os serviços? Ação IRREVERSÍVEL!")) return;
//   //   localStorage.removeItem("servicos");
//   //   setLista([]);
//   //   setSubtotal(0);
//   //   setServicosPeriodo([]);
//   //   setMostrarLista(false);
//   // };

//   const calcularSubtotal = () => {
//     const filtrados = lista.filter(
//       item =>
//         (!inicio || item.data >= inicio) &&
//         (!fim || item.data <= fim)
//     );

//     const total = filtrados.reduce((s, i) => s + i.valor, 0);
//     setSubtotal(total);
//     setServicosPeriodo(filtrados);
//   };

//   // 👉 Trabalhos do mês atual
//   const trabalhosDoMes = lista.filter(
//     item => item.data >= primeiroDiaDoMes && item.data <= hoje
//   );

//   // 👉 Subtotal do mês atual
//   const subtotalMes = trabalhosDoMes.reduce(
//     (soma, item) => soma + item.valor,
//     0
//   );

//   // function handleChange(e){
//   //   setServico(e);
//   //   handleSelectedChange(e);
//   // }
//   return (
//     <div className="container">
//       <h1>Controle de Serviços</h1>

//       <div className="card">
//         <h2>{editandoId ? "Editar Serviço" : "Novo Serviço"}</h2>

//         <select value={servico} onChange={e => setServico(e.target.value)}>
//           <option value="" disabled>Selecione o serviço</option>
//           <option>Banho</option>
//           <option>Banho + Tosa Higiênica</option>
//           <option>Banho + Tosa Completa</option>
//           <option>Outro</option>
//         </select>

//         <input
//           type="text"
//           placeholder="Nome Animal / Cliente"
//           value={nome}
//           onChange={e => setNome(e.target.value)}
//         />

//         <input
//           type="number"
//           placeholder="Valor"
//           value={valor}
//           onChange={e => setValor(e.target.value)}
//         />

//         <input
//           type="date"
//           value={data}
//           onChange={e => setData(e.target.value)}
//         />

//         <textarea
//           placeholder="Observações (opcional)"
//           value={obs}
//           onChange={e => setObs(e.target.value)}
//         />

//         <button onClick={salvar}>
//           {editandoId ? "Atualizar" : "Salvar"}
//         </button>
//       </div>

//       <button className="toggle" onClick={() => setMostrarLista(!mostrarLista)}>
//         Trabalhos realizados (mês atual)
//       </button>

//       {mostrarLista && (
//         <div className="card">
//           <h3>Subtotal do mês: R$ {subtotalMes.toFixed(2).replace(".",",")}</h3>

//           {trabalhosDoMes.length === 0 && (
//             <p className="textServicoVazio">Nenhum serviço realizado neste mês</p>
//           )}

//           {trabalhosDoMes.map(item => (
//             <div key={item.id} className="item">
//               <strong>{item.servico}</strong> — {item.nome}<br />
//               R$ {item.valor.toFixed(2).replace(".",",")} | {item.data}<br />
//               {item.obs && <em>{item.obs}</em>}
//               <br />
//               <button className="edit" onClick={() => editarServico(item)}>
//                 Editar
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="card">
//         <h2>Subtotal por período</h2>

//         <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
//         <input type="date" value={fim} onChange={e => setFim(e.target.value)} />

//         <button onClick={calcularSubtotal}>Calcular</button>

//         <h3>Total: R$ {subtotal.toFixed(2)}</h3>

//         {servicosPeriodo.length > 0 && (
//           <>
//             <h4 className="textServicoPeriodo">Serviços do período</h4>
//             {servicosPeriodo.map(item => (
//               <div key={item.id} className="item">
//                 <strong>{item.servico}</strong> — {item.nome}<br />
//                 R$ {item.valor.toFixed(2)} | {item.data}<br />
//                 {item.obs && <em>{item.obs}</em>}
//               </div>
//             ))}
//           </>
//         )}
//       </div>

//       {/* <button className="danger" onClick={limparTodos}>
//         Limpar todos os serviços
//       </button> */}
//     </div>
//   );
// }

import { Routes, Route, Link } from "react-router-dom";
import Servicos from "./pages/Servicos";
import Gastos from "./pages/Gastos";
import "./App.css";

export default function App() {
  return (
    <div className="container">
      <header className="topo">
        <Link to="/" className="nav">Serviços</Link>
        <Link to="/gastos" className="nav">Gastos</Link>
      </header>

      <Routes>
        <Route path="/" element={<Servicos />} />
        <Route path="/gastos" element={<Gastos />} />
      </Routes>
    </div>
  );
}