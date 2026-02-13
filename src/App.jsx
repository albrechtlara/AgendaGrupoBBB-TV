import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  Timestamp, 
  doc, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { 
  Search, Instagram, Plus, X, Lock, Unlock, Edit3, ExternalLink
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBo2l4i44t-Pse178yuADlqvtGX3LeMDaY",
  authDomain: "agendagrupo-a8fd7.firebaseapp.com",
  projectId: "agendagrupo-a8fd7",
  storageBucket: "agendagrupo-a8fd7.firebasestorage.app",
  messagingSenderId: "568596149577",
  appId: "1:568596149577:web:b954a6910769b7e7dd1698",
  measurementId: "G-G3HFW2YW5R"
};

const ADMIN_PASSWORD = "BBB2026!";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const HOBBIES_LIST = ["Todos", "Moda", "Gastronomia", "Arte", "Esportes", "Empreendedorismo", "Comunicação", "Beleza", "Viagens", "Música", "Educação", "Política", "Jornalismo", "Tecnologia", "Humor", "Yoga", "Direito", "Cinema", "Finanças", "Variado"];

const INITIAL_DATA = [
  { username: "albrechtlara", nome: "Daniel Albrecht", hobbie: "Variado", descricao: "Perfil oficial da comunidade." },
  { username: "analavinas", nome: "Ana Lavinas", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "anaslika", nome: "Ana Slika", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "anap.guardiola", nome: "Ana P. Guardiola", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "arianersantos", nome: "Ariane Santos", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "astridfontenelle", nome: "Astrid Fontenelle", hobbie: "Comunicação", descricao: "Apresentadora e Jornalista experiente." },
  { username: "barbaraalbernaz", nome: "Barbara Albernaz", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "bhdicas", nome: "BH Dicas", hobbie: "Gastronomia", descricao: "Dicas incríveis de Belo Horizonte." },
  { username: "carvalier_", nome: "Carvalier", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "cladiba", nome: "Cladiba", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "criscrisquis", nome: "Cris Crisquis", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "criancascriancaspretas", nome: "Crianças Pretas", hobbie: "Educação", descricao: "Conteúdo educativo sobre infância." },
  { username: "direitoshumanosprageral", nome: "DH pra Geral", hobbie: "Direito", descricao: "Direitos Humanos explicados para todos." },
  { username: "eudehbastos", nome: "Deh Bastos", hobbie: "Educação", descricao: "Comunicadora e educadora de impacto." },
  { username: "eugabicoelho", nome: "Gabi Coelho", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "euandrezamaia", nome: "Andreza Maia", hobbie: "Tecnologia", descricao: "Foco em Inovação e Tecnologia." },
  { username: "falecomtony", nome: "Tony", hobbie: "Comunicação", descricao: "Especialista em oratória e comunicação." },
  { username: "fofacruel", nome: "Fofa Cruel", hobbie: "Humor", descricao: "O melhor do humor ácido e variado." },
  { username: "giulianaparapoucos", nome: "Giuliana", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "gracianoamanda", nome: "Amanda Graciano", hobbie: "Finanças", descricao: "Economia Criativa e Inovação." },
  { username: "irinabacci", nome: "Irina Bacci", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "israelcamposedh", nome: "Israel Campos", hobbie: "Direito", descricao: "Defensor dos Direitos Humanos." },
  { username: "janaleite__", nome: "Jana Leite", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "janamooficial", nome: "Jana Mo", hobbie: "Música", descricao: "Artista e Cantora em ascensão." },
  { username: "jowestrela", nome: "Jow Estrela", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "laismadhu", nome: "Lais Madhu", hobbie: "Yoga", descricao: "Bem-estar, saúde e práticas de Yoga." },
  { username: "lelectorres", nome: "Leleco Torres", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "lucasandrades_", nome: "Lucas Andrades", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "luizguimaraee", nome: "Luiz Guimarães", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "mari__rachid", nome: "Mari Rachid", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "nascimento_9186", nome: "Nascimento", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "nelsinhosantos", nome: "Nelsinho Santos", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "opa.simoes", nome: "Opa Simões", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "pedrostudart", nome: "Pedro Studart", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "pedro.paulo.aguiar", nome: "Pedro Paulo Aguiar", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "rizziafroes", nome: "Rizzia Froes", hobbie: "Variado", descricao: "Participante BBB Hub" },
  { username: "taina.aguiar.junquilho", nome: "Taina Junquilho", hobbie: "Direito", descricao: "Expert em Tecnologia e Direito." },
  { username: "uai.villa", nome: "Uai Villa", hobbie: "Humor", descricao: "Entretenimento mineiro." },
  { username: "ofelipemiranda_", nome: "Felipe Miranda", hobbie: "Finanças", descricao: "Estrategista de Investimentos." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [dbParticipants, setDbParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHobbie, setSelectedHobbie] = useState('Todos');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newPart, setNewPart] = useState({ nome: '', username: '', descricao: '', fotoUrl: '', hobbie: 'Variado' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkAndSeed = async () => {
      const colRef = collection(db, 'participantes');
      const snap = await getDocs(colRef);
      if (snap.empty) { 
        for (const item of INITIAL_DATA) {
          const id = item.username.toLowerCase().trim();
          await setDoc(doc(db, 'participantes', id), {
            ...item,
            username: id,
            fotoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
            updatedAt: Timestamp.now()
          }, { merge: true });
        }
      }
    };

    checkAndSeed();

    const col = collection(db, 'participantes');
    const unsubscribe = onSnapshot(col, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      const uniqueMap = new Map();
      data.forEach(item => uniqueMap.set(item.id, item));
      setDbParticipants(Array.from(uniqueMap.values()));
      setIsLoading(false);
    }, (error) => {
      console.error("Erro no Snapshot:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = useMemo(() => {
    return dbParticipants
      .filter(p => {
        const search = searchTerm.toLowerCase();
        const nomeStr = String(p.nome || '').toLowerCase();
        const userStr = String(p.username || '').toLowerCase();
        const matchSearch = nomeStr.includes(search) || userStr.includes(search);
        const matchHobbie = selectedHobbie === 'Todos' || p.hobbie === selectedHobbie;
        return matchSearch && matchHobbie;
      })
      .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  }, [dbParticipants, searchTerm, selectedHobbie]);

  const handleSave = async (e) => {
    e.preventDefault();
    const data = editingPart || newPart;
    const cleanUsername = data.username.replace('@', '').trim().toLowerCase();
    if (!cleanUsername) return;

    try {
      await setDoc(doc(db, 'participantes', cleanUsername), { 
        ...data, 
        username: cleanUsername, 
        updatedAt: Timestamp.now(),
        fotoUrl: data.fotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`
      }, { merge: true });
      
      setShowAddModal(false);
      setEditingPart(null);
      setNewPart({ nome: '', username: '', descricao: '', fotoUrl: '', hobbie: 'Variado' });
    } catch (err) {
      console.error("Erro ao guardar participante:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      {/* Header */}
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col">
          <h1 className="text-orange-500 font-black italic text-xl uppercase tracking-tighter leading-none">BBB HUB</h1>
          <span className="text-[8px] text-gray-500 font-bold tracking-[0.2em] uppercase">Comunidade de Afinidades</span>
        </div>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} 
          className={`p-2 rounded-full border transition-all ${isAdmin ? 'bg-orange-500 text-black border-orange-500' : 'border-white/10 text-gray-500'}`}
        >
          {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Pesquisa */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou @username..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 transition-all placeholder:text-gray-600" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {HOBBIES_LIST.map(h => (
            <button 
              key={`filter-${h}`} 
              onClick={() => setSelectedHobbie(h)} 
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${selectedHobbie === h ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
            >
              {h}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button 
            onClick={() => { setEditingPart(null); setShowAddModal(true); }} 
            className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors"
          >
            <Plus /> ADICIONAR NOVO PERFIL
          </button>
        )}

        {/* Grelha */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-gray-500 animate-pulse font-bold uppercase italic tracking-widest">
              A sincronizar perfis...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(p => (
              <div 
                key={`card-${p.id}`} 
                onClick={() => setSelectedPart(p)}
                className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden border border-white/10 relative group shadow-lg cursor-pointer hover:border-orange-500/50 transition-colors"
              >
                <img 
                  src={p.fotoUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  alt={p.nome} 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">{p.hobbie}</p>
                  <h3 className="font-bold uppercase italic text-sm truncate leading-none mb-1 text-white">{p.nome || p.username}</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 font-medium"><Instagram size={10}/> @{p.username}</p>
                  
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingPart(p); setShowAddModal(true); }} 
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 text-white z-10"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase italic border border-dashed border-white/5 rounded-3xl">
              Nenhum perfil encontrado.
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Perfil */}
      {selectedPart && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111] rounded-[2.5rem] border border-white/10 w-full max-w-lg relative shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedPart(null)} 
              className="absolute top-6 right-6 z-10 bg-black/50 backdrop-blur-xl p-3 rounded-full text-white/70 hover:text-white transition-colors border border-white/10"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col md:flex-row h-full">
              {/* Imagem no Modal */}
              <div className="w-full md:w-1/2 aspect-square md:aspect-auto">
                <img src={selectedPart.fotoUrl} className="w-full h-full object-cover" alt={selectedPart.nome} />
              </div>
              
              {/* Conteúdo no Modal */}
              <div className="p-8 flex flex-col justify-center flex-1 space-y-6">
                <div>
                  <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {selectedPart.hobbie}
                  </span>
                  <h2 className="text-3xl font-black italic uppercase leading-none mt-4">{selectedPart.nome || selectedPart.username}</h2>
                  <p className="text-gray-400 flex items-center gap-2 mt-2 font-medium">
                    <Instagram size={16} className="text-orange-500" /> @{selectedPart.username}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Sobre</h4>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {selectedPart.descricao || "Este participante ainda não possui uma descrição detalhada."}
                  </p>
                </div>

                <a 
                  href={`https://instagram.com/${selectedPart.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase italic tracking-tighter hover:bg-orange-500 transition-all group"
                >
                  Ver Perfil Completo <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Admin Login */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-xs text-center">
            <h2 className="font-black italic mb-6 text-xl">ACESSO ADMIN</h2>
            <input 
              type="password" 
              placeholder="Código" 
              className="w-full bg-black border border-white/10 p-4 rounded-xl mb-4 text-center text-white outline-none focus:border-orange-500" 
              value={passInput} 
              onChange={e=>setPassInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && (passInput === ADMIN_PASSWORD ? (setIsAdmin(true), setShowLoginModal(false), setPassInput('')) : alert('Incorreto'))}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-bold uppercase text-[10px]">Sair</button>
              <button 
                onClick={() => passInput === ADMIN_PASSWORD ? (setIsAdmin(true), setShowLoginModal(false), setPassInput('')) : alert('Incorreto')} 
                className="flex-[2] bg-orange-500 text-black font-black py-4 rounded-xl uppercase text-[10px]"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-md relative my-auto">
            <button onClick={() => {setShowAddModal(false); setEditingPart(null);}} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
            <h2 className="font-black italic text-orange-500 mb-6 uppercase text-xl">{editingPart ? 'Editar' : 'Novo'} Perfil</h2>
            <form onSubmit={handleSave} className="space-y-4 text-left">
              <input required placeholder="Nome Completo" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" value={editingPart ? editingPart.nome : newPart.nome} onChange={e => editingPart ? setEditingPart({...editingPart, nome: e.target.value}) : setNewPart({...newPart, nome: e.target.value})} />
              <input required placeholder="Instagram (@username)" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" value={editingPart ? editingPart.username : newPart.username} onChange={e => editingPart ? setEditingPart({...editingPart, username: e.target.value}) : setNewPart({...newPart, username: e.target.value})} />
              <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500 appearance-none" value={editingPart ? editingPart.hobbie : newPart.hobbie} onChange={e => editingPart ? setEditingPart({...editingPart, hobbie: e.target.value}) : setNewPart({...newPart, hobbie: e.target.value})}>
                {HOBBIES_LIST.filter(h=>h!=="Todos").map(h => <option key={`opt-${h}`} value={h}>{h}</option>)}
              </select>
              <textarea placeholder="Descrição (Aparecerá nos detalhes)" className="w-full bg-black border border-white/10 p-4 rounded-xl h-24 text-white outline-none focus:border-orange-500 resize-none" value={editingPart ? editingPart.descricao : newPart.descricao} onChange={e => editingPart ? setEditingPart({...editingPart, descricao: e.target.value}) : setNewPart({...newPart, descricao: e.target.value})} />
              <button className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl uppercase italic">Guardar Dados</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
