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
  Search, Instagram, Plus, X, Lock, Unlock, Edit3, AlertTriangle
} from 'lucide-react';

// --- CONFIGURAÇÃO REAL DO FIREBASE ---
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

// Inicialização do Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const HOBBIES_LIST = ["Todos", "Moda", "Gastronomia", "Arte", "Esportes", "Empreendedorismo", "Comunicação", "Beleza", "Viagens", "Música", "Educação", "Política", "Jornalismo", "Tecnologia", "Humor", "Yoga", "Direito", "Cinema", "Finanças", "Variado"];

// Lista de perfis para a carga inicial
const INITIAL_DATA = [
  { nome: "Daniel Dante", username: "danieldante", hobbie: "Tecnologia", descricao: "Entusiasta de tecnologia e desenvolvimento de software.", fotoUrl: "" },
  { nome: "Alice Silva", username: "alicesilva", hobbie: "Moda", descricao: "Designer de moda apaixonada por tendências sustentáveis.", fotoUrl: "" },
  { nome: "Bruno Costa", username: "brunocosta", hobbie: "Esportes", descricao: "Atleta amador e fã de maratonas.", fotoUrl: "" },
  { nome: "Carla Souza", username: "carlasouza", hobbie: "Gastronomia", descricao: "Chef especializada em cozinha mediterrânea.", fotoUrl: "" },
  { nome: "Diogo Martins", username: "diogomartins", hobbie: "Música", descricao: "Produtor musical e colecionador de vinis.", fotoUrl: "" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [dbParticipants, setDbParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHobbie, setSelectedHobbie] = useState('Todos');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newPart, setNewPart] = useState({ nome: '', username: '', descricao: '', fotoUrl: '', hobbie: 'Variado' });

  // Autenticação Anónima
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Erro Auth:", err);
          setErrorMessage("Erro de autenticação no Firebase.");
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Função para Carga Inicial (Seed)
  const seedDatabase = async () => {
    try {
      const colRef = collection(db, 'participantes');
      const snapshot = await getDocs(colRef);
      
      // Só insere se a coleção estiver vazia
      if (snapshot.empty) {
        console.log("A base de dados está vazia. A iniciar carga inicial...");
        for (const item of INITIAL_DATA) {
          const docId = item.username.toLowerCase();
          await setDoc(doc(db, 'participantes', docId), {
            ...item,
            updatedAt: Timestamp.now()
          });
        }
        console.log("Carga inicial concluída com sucesso!");
      }
    } catch (err) {
      console.error("Erro na carga inicial:", err);
    }
  };

  // Escuta os dados do Firestore em tempo real
  useEffect(() => {
    if (!user) return;
    
    // Executa a tentativa de carga inicial uma vez quando o user loga
    seedDatabase();

    const col = collection(db, 'participantes');
    const unsubscribe = onSnapshot(col, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbParticipants(data);
      setIsLoading(false);
    }, (err) => {
      console.error("Erro Firestore:", err);
      setErrorMessage("Erro ao carregar dados. Verifique as 'Rules' do Firestore.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Ordenação
  const allParticipants = useMemo(() => {
    return [...dbParticipants].sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [dbParticipants]);

  // Filtros
  const filtered = useMemo(() => {
    return allParticipants.filter(p => {
      const nameMatch = (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const userMatch = (p.username || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchSearch = nameMatch || userMatch;
      const matchHobbie = selectedHobbie === 'Todos' || p.hobbie === selectedHobbie;
      return matchSearch && matchHobbie;
    });
  }, [allParticipants, searchTerm, selectedHobbie]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    const data = editingPart || newPart;
    const docId = data.username.replace('@', '').trim().toLowerCase();
    
    try {
      await setDoc(doc(db, 'participantes', docId), {
        ...data,
        username: docId,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      setShowAddModal(false);
      setEditingPart(null);
      setNewPart({ nome: '', username: '', descricao: '', fotoUrl: '', hobbie: 'Variado' });
    } catch (e) {
      console.error(e);
      setErrorMessage("Erro ao gravar. Verifique as regras de segurança.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-orange-500 font-black italic text-xl uppercase tracking-tighter">BBB HUB</h1>
        <button 
          onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)}
          className={`p-2 rounded-full border transition-all ${isAdmin ? 'bg-orange-500 text-black border-orange-500' : 'border-white/10 text-gray-500'}`}
        >
          {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-500 text-xs font-bold flex gap-2">
            <AlertTriangle size={16} /> {errorMessage}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Pesquisar participante ou instagram..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {HOBBIES_LIST.map(h => (
            <button
              key={h}
              onClick={() => setSelectedHobbie(h)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
                selectedHobbie === h ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors">
            <Plus /> ADICIONAR NOVO PERFIL
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-gray-500 animate-pulse font-bold uppercase italic">Conectando ao Firebase...</div>
          ) : filtered.length > 0 ? (
            filtered.map(p => (
              <div key={p.id} className="aspect-[3/4] bg-white/5 rounded-3xl overflow-hidden border border-white/10 relative group">
                <img 
                  src={p.fotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  alt={p.nome} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">{p.hobbie}</p>
                  <h3 className="font-bold uppercase italic text-sm truncate leading-none">{p.nome}</h3>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Instagram size={10}/> @{p.username}</p>
                  
                  {isAdmin && (
                    <button 
                      onClick={() => { setEditingPart(p); setShowAddModal(true); }} 
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase italic">Nenhum participante encontrado.</div>
          )}
        </div>
      </main>

      {/* Modais omitidos aqui por brevidade, mas mantidos no código original que deves copiar */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-xs text-center shadow-2xl">
            <h2 className="font-black italic mb-6 text-xl text-white">ADMIN ACCESS</h2>
            <input 
              type="password" 
              placeholder="Senha"
              autoFocus 
              className="w-full bg-black border border-white/10 p-4 rounded-xl mb-4 text-center text-white outline-none focus:border-orange-500 transition-colors" 
              value={passInput} 
              onChange={e=>setPassInput(e.target.value)} 
            />
            <div className="flex gap-2">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-bold text-white">CANCELAR</button>
              <button 
                onClick={() => passInput === ADMIN_PASSWORD ? (setIsAdmin(true), setShowLoginModal(false), setPassInput('')) : alert('Senha incorreta!')} 
                className="flex-[2] bg-orange-500 text-black font-black py-4 rounded-xl"
              >
                ENTRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-md relative my-auto">
            <button onClick={() => {setShowAddModal(false); setEditingPart(null);}} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-black italic text-orange-500 mb-6 uppercase text-xl">{editingPart ? 'Editar' : 'Novo'} Participante</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Nome Completo" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none" value={editingPart ? editingPart.nome : newPart.nome} onChange={e => editingPart ? setEditingPart({...editingPart, nome: e.target.value}) : setNewPart({...newPart, nome: e.target.value})} />
              <input required placeholder="Instagram (sem @)" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none" value={editingPart ? editingPart.username : newPart.username} onChange={e => editingPart ? setEditingPart({...editingPart, username: e.target.value}) : setNewPart({...newPart, username: e.target.value})} />
              <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none" value={editingPart ? editingPart.hobbie : newPart.hobbie} onChange={e => editingPart ? setEditingPart({...editingPart, hobbie: e.target.value}) : setNewPart({...newPart, hobbie: e.target.value})}>
                {HOBBIES_LIST.filter(h=>h!=="Todos").map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <textarea placeholder="Biografia" className="w-full bg-black border border-white/10 p-4 rounded-xl h-24 text-white outline-none" value={editingPart ? editingPart.descricao : newPart.descricao} onChange={e => editingPart ? setEditingPart({...editingPart, descricao: e.target.value}) : setNewPart({...newPart, descricao: e.target.value})} />
              <input placeholder="Link da Foto" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white text-xs outline-none" value={editingPart ? (editingPart.fotoUrl || '') : newPart.fotoUrl} onChange={e => editingPart ? setEditingPart({...editingPart, fotoUrl: e.target.value}) : setNewPart({...newPart, fotoUrl: e.target.value})} />
              <button className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl">SALVAR NO FIREBASE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
