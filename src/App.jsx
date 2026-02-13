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
  Search, Instagram, Plus, X, Lock, Unlock, Edit3, ExternalLink, Upload, User, Image as ImageIcon, Check
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

const AVATAR_STYLES = [
  "Felix", "Aneka", "Max", "Loki", "Luna", "Buddy", "Coco", "Milo", "Toby", "Sassy", "Jack", "Ginger"
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
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState('upload');
  
  const [newPart, setNewPart] = useState({ 
    nome: '', 
    username: '', 
    descricao: '', 
    fotoUrl: '', 
    hobbie: 'Variado' 
  });

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
    const col = collection(db, 'participantes');
    const unsubscribe = onSnapshot(col, (snap) => {
      const uniqueData = [];
      const seenIds = new Set();
      
      snap.docs.forEach(d => {
        if (!seenIds.has(d.id)) {
          uniqueData.push({ id: d.id, ...d.data() });
          seenIds.add(d.id);
        }
      });

      setDbParticipants(uniqueData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao carregar participantes:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
        else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        updatePhotoUrl(base64);
        setUploading(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updatePhotoUrl = (url) => {
    if (editingPart) setEditingPart(prev => ({ ...prev, fotoUrl: url }));
    else setNewPart(prev => ({ ...prev, fotoUrl: url }));
  };

  const selectAvatar = (style) => {
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${style}`;
    updatePhotoUrl(url);
  };

  const filtered = useMemo(() => {
    return dbParticipants
      .filter(p => {
        const search = searchTerm.toLowerCase();
        const nomeMatch = (p.nome || "").toLowerCase().includes(search);
        const userMatch = (p.username || "").toLowerCase().includes(search);
        const hobbieMatch = selectedHobbie === 'Todos' || p.hobbie === selectedHobbie;
        
        return (nomeMatch || userMatch) && hobbieMatch;
      })
      .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
  }, [dbParticipants, searchTerm, selectedHobbie]);

  const handleSave = async (e) => {
    e.preventDefault();
    const data = editingPart || newPart;
    const cleanUsername = data.username.replace('@', '').trim().toLowerCase();
    
    if (!cleanUsername) {
      alert("O Instagram é obrigatório.");
      return;
    }

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
      console.error("Erro ao salvar:", err); 
    }
  };

  const currentFoto = editingPart ? editingPart.fotoUrl : newPart.fotoUrl;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20 selection:bg-orange-500/30">
      <header className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col">
          <h1 className="text-orange-500 font-black italic text-xl uppercase tracking-tighter leading-none">BBB HUB</h1>
          <span className="text-[8px] text-gray-500 font-bold tracking-[0.2em] uppercase">Comunidade de Afinidades</span>
        </div>
        <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} className={`p-2 rounded-full border transition-all ${isAdmin ? 'bg-orange-500 text-black border-orange-500' : 'border-white/10 text-gray-500'}`}>
          {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
          <input type="text" placeholder="Pesquisar..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {HOBBIES_LIST.map(h => (
            <button key={`hobbie-${h}`} onClick={() => setSelectedHobbie(h)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedHobbie === h ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-gray-400'}`}>{h}</button>
          ))}
        </div>

        {isAdmin && (
          <button onClick={() => { setEditingPart(null); setShowAddModal(true); }} className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-500 transition-all">
            <Plus size={20} /> ADICIONAR NOVO PERFIL
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((p, idx) => (
            <div key={`part-${p.id}-${idx}`} onClick={() => setSelectedPart(p)} className="aspect-[3/4] bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 relative group cursor-pointer hover:border-orange-500/50 transition-all shadow-xl">
              <img src={p.fotoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.nome} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent p-5 flex flex-col justify-end">
                <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">{p.hobbie}</p>
                <h3 className="font-bold uppercase italic text-sm truncate text-white">{p.nome || p.username}</h3>
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); setEditingPart(p); setShowAddModal(true); }} className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 text-white"><Edit3 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DETALHES */}
      {selectedPart && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPart(null)}>
          <div className="bg-[#121212] rounded-[2.5rem] border border-white/10 w-full max-w-2xl relative shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPart(null)} className="absolute top-6 right-6 z-20 bg-black/40 p-2 rounded-full text-white/50 border border-white/5 transition-colors"><X size={20} /></button>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[45%] bg-black relative aspect-square md:aspect-auto">
                <img src={selectedPart.fotoUrl} className="w-full h-full object-cover" alt={selectedPart.nome} />
              </div>
              <div className="p-8 md:p-10 flex flex-col flex-1">
                <div className="mb-6">
                  <span className="text-orange-500 font-black uppercase text-[10px] italic">{selectedPart.hobbie}</span>
                  <h2 className="text-4xl font-black italic uppercase leading-[0.9] mt-3 tracking-tighter">{selectedPart.nome}</h2>
                  <div className="flex items-center gap-2 mt-4 text-gray-400"><Instagram size={16} className="text-orange-500" /> <span className="text-sm font-bold">@{selectedPart.username}</span></div>
                </div>
                <p className="text-gray-400 text-sm flex-1 leading-relaxed">{selectedPart.descricao}</p>
                <div className="mt-8">
                  <a href={`https://instagram.com/${selectedPart.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-orange-500 hover:bg-orange-400 text-black px-7 py-5 rounded-2xl font-black uppercase italic text-sm transition-all transform active:scale-95">
                    <span>Seguir no Instagram</span>
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/10 w-full max-w-md relative my-auto shadow-2xl">
            <button onClick={() => {setShowAddModal(false); setEditingPart(null);}} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X /></button>
            <h2 className="font-black italic text-orange-500 mb-6 uppercase text-2xl text-center">Configurar Perfil</h2>
            
            <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
              <button 
                type="button"
                onClick={() => setPhotoType('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${photoType === 'upload' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
              >
                <Upload size={14} /> Subir Foto
              </button>
              <button 
                type="button"
                onClick={() => setPhotoType('avatar')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${photoType === 'avatar' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500'}`}
              >
                <User size={14} /> Personagem
              </button>
            </div>

            <div className="mb-8 flex flex-col items-center">
              <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative mb-4">
                <img src={currentFoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} className="w-full h-full object-cover" alt="Preview" />
                {uploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>

              {photoType === 'upload' ? (
                <label className="bg-orange-500 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-orange-400 transition-colors">
                  Escolher do Dispositivo
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="grid grid-cols-6 gap-2 w-full max-h-24 overflow-y-auto no-scrollbar">
                  {AVATAR_STYLES.map((style, idx) => (
                    <button 
                      key={`av-style-${style}-${idx}`}
                      type="button"
                      onClick={() => selectAvatar(style)}
                      className={`aspect-square rounded-lg border-2 transition-all overflow-hidden ${currentFoto?.includes(style) ? 'border-orange-500 scale-95' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    >
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${style}`} className="w-full h-full" alt={style} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Nome Completo" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" value={editingPart ? editingPart.nome : newPart.nome} onChange={e => editingPart ? setEditingPart({...editingPart, nome: e.target.value}) : setNewPart({...newPart, nome: e.target.value})} />
              <input required placeholder="Instagram (sem @)" className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" value={editingPart ? editingPart.username : newPart.username} onChange={e => editingPart ? setEditingPart({...editingPart, username: e.target.value}) : setNewPart({...newPart, username: e.target.value})} />
              <select className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-orange-500" value={editingPart ? editingPart.hobbie : newPart.hobbie} onChange={e => editingPart ? setEditingPart({...editingPart, hobbie: e.target.value}) : setNewPart({...newPart, hobbie: e.target.value})}>
                {HOBBIES_LIST.filter(h=>h!=="Todos").map(h => <option key={`opt-${h}`} value={h}>{h}</option>)}
              </select>
              <textarea placeholder="Descrição curta" className="w-full bg-black border border-white/10 p-4 rounded-xl h-20 text-white outline-none focus:border-orange-500 resize-none" value={editingPart ? editingPart.descricao : newPart.descricao} onChange={e => editingPart ? setEditingPart({...editingPart, descricao: e.target.value}) : setNewPart({...newPart, descricao: e.target.value})} />
              <button disabled={uploading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase italic tracking-tighter hover:bg-orange-500 transition-all shadow-xl disabled:opacity-50">Guardar Perfil</button>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111] p-10 rounded-[2rem] border border-white/10 w-full max-w-xs text-center shadow-2xl">
            <h2 className="font-black italic mb-8 text-xl uppercase tracking-tighter">ACESSO PRIVADO</h2>
            <input type="password" placeholder="Código" className="w-full bg-black border border-white/10 p-5 rounded-2xl mb-5 text-center text-white outline-none focus:border-orange-500 transition-all font-bold" value={passInput} onChange={e=>setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (passInput === ADMIN_PASSWORD ? (setIsAdmin(true), setShowLoginModal(false), setPassInput('')) : alert('Erro'))} />
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-bold uppercase text-[10px] hover:bg-white/10 transition-colors">Sair</button>
              <button onClick={() => passInput === ADMIN_PASSWORD ? (setIsAdmin(true), setShowLoginModal(false), setPassInput('')) : alert('Erro')} className="flex-[2] bg-orange-500 text-black font-black py-4 rounded-xl uppercase text-[10px] hover:bg-orange-400 transition-colors">Entrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
