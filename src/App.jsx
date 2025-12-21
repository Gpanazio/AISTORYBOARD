import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Image as ImageIcon, 
  Move, 
  Film, 
  Copy, 
  X, 
  Loader2,
  Maximize2,
  LogOut,
  AlertTriangle,
  UserX
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
// COLOQUE SUAS CHAVES AQUI
const SUPABASE_URL = 'https://ujpvyslrosmismgbcczl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcHZ5c2xyb3NtaXNtZ2JjY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzU5MDgsImV4cCI6MjA2NjM1MTkwOH0.XkgwQ4VF7_7plt8-cw9VsatX4WwLolZEO6a6YtovUFs';


// --- UTILITÁRIOS ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const copyToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

// --- COMPONENTES ---

const AuthScreen = ({ client, onGuestLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!client) return;
    setLoading(true);
    const { error } = await client.auth.signInWithOtp({ email });
    if (error) setMessage('Erro: ' + error.message);
    else setMessage('Cheque seu email para o link mágico!');
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Film className="text-white" size={24} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">CineBoard AI</h2>
        <p className="text-zinc-500 text-center mb-8">Login via Supabase</p>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">EMAIL (OPCIONAL)</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Entrar com Magic Link'}
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-zinc-500">ou</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={onGuestLogin}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <UserX size={18} />
            Continuar sem Login
          </button>
          
          {message && <p className="text-center text-sm text-emerald-400 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
};

const FrameEditor = ({ isOpen, onClose, onSave, initialData, isSaving }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt: '',
    cameraMove: '',
    image: null,
    imagePreview: null
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        prompt: initialData.prompt || '',
        cameraMove: initialData.camera_move || '',
        imagePreview: initialData.image_base64 || null,
        image: null
      });
    } else {
      setFormData({ title: '', description: '', prompt: '', cameraMove: '', image: null, imagePreview: null });
    }
  }, [initialData, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 bg-black flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 relative">
          {formData.imagePreview ? (
            <img src={formData.imagePreview} alt="Preview" className="max-h-[300px] md:max-h-[500px] object-contain rounded-lg shadow-lg border border-zinc-800" />
          ) : (
            <div className="text-zinc-500 flex flex-col items-center">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <p>Nenhuma imagem</p>
            </div>
          )}
          <label className="mt-6 cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg border border-zinc-600 transition flex items-center gap-2">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <ImageIcon size={18} />
            Escolher Frame
          </label>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white font-mono">{initialData ? 'EDITAR' : 'NOVO FRAME'}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={24} /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">CENA / TÍTULO</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-emerald-500 outline-none" placeholder="Cena 1" required />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">DESCRIÇÃO</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-emerald-500 outline-none h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">MOVIMENTO</label>
                <input type="text" value={formData.cameraMove} onChange={e => setFormData({...formData, cameraMove: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-300 focus:border-emerald-500 outline-none text-sm" placeholder="Zoom In" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-emerald-400 mb-1">PROMPT (IA)</label>
              <textarea value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="w-full bg-zinc-950 border border-emerald-900/50 rounded p-2 text-emerald-100 focus:border-emerald-500 outline-none h-24 text-sm font-mono" />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
              <button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FrameCard = ({ data, onDelete, onEdit, index }) => {
  const [copied, setCopied] = useState(false);
  const handleCopyPrompt = () => {
    copyToClipboard(data.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-300 hover:shadow-xl flex flex-col h-full">
      <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => onEdit(data)}>
        {data.image_base64 ? (
          <img src={data.image_base64} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700"><Film size={48} /></div>
        )}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur text-white text-xs font-mono px-2 py-1 rounded">#{index + 1}</div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); onEdit(data); }} className="p-2 bg-white text-black rounded-full hover:bg-emerald-500 hover:text-white transition"><Edit3 size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"><Trash2 size={20} /></button>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-zinc-100 truncate pr-2">{data.title}</h3>
            {data.camera_move && <span className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">{data.camera_move}</span>}
        </div>
        <p className="text-zinc-400 text-xs line-clamp-2 mb-3 h-8">{data.description || "Sem descrição."}</p>
        <div className="mt-auto pt-3 border-t border-zinc-800">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase">Prompt IA</span>
                <button onClick={handleCopyPrompt} className={`text-xs flex items-center gap-1 ${copied ? 'text-green-400' : 'text-zinc-500 hover:text-white'} transition`}>
                    {copied ? 'Copiado!' : <><Copy size={12} /> Copiar</>}
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLibLoaded, setIsLibLoaded] = useState(false);

  // --- CARREGAMENTO SEGURO DA BIBLIOTECA (FUNCIONA NA PRÉVIA E GITHUB) ---
  useEffect(() => {
    // Verifica se já existe globalmente
    if (window.supabase) {
      setIsLibLoaded(true);
      return;
    }
    
    // Injeta o script do Supabase via CDN
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => setIsLibLoaded(true);
    script.onerror = () => {
      setErrorMsg("Falha ao carregar a biblioteca Supabase.");
      setLoading(false);
    };
    document.body.appendChild(script);
  }, []);

  // Inicializa o cliente Supabase assim que a lib carregar
  useEffect(() => {
    if (isLibLoaded && !supabase && SUPABASE_URL !== 'SUA_URL_AQUI') {
      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(client);
      } catch (e) {
        console.error("Erro inicialização Supabase:", e);
        setErrorMsg("Erro nas chaves de API. Verifique o código.");
      }
    } else if (isLibLoaded && !supabase) {
      // Lib carregada mas sem chaves configuradas
      setLoading(false);
    }
  }, [isLibLoaded]);

  // 1. Gerenciar Sessão
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 2. Buscar Frames
  useEffect(() => {
    if (!supabase) return;
    if (!session && !isGuest) return; 
    
    fetchFrames();

    const channel = supabase
      .channel('frames_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frames' }, () => {
        fetchFrames();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, isGuest, supabase]);

  const fetchFrames = async () => {
    try {
      const { data, error } = await supabase
        .from('frames')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setFrames(data || []);
    } catch (error) {
      console.error("Erro Supabase:", error);
      setErrorMsg(error.message);
    }
  };

  const handleSave = async (formData) => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      let imageBase64 = formData.imagePreview;
      if (formData.image) {
        imageBase64 = await compressImage(formData.image);
      }

      const userId = session?.user?.id || 'guest_user';

      const frameData = {
        title: formData.title,
        description: formData.description,
        prompt: formData.prompt,
        camera_move: formData.cameraMove, 
        image_base64: imageBase64,
        user_id: userId,
        updated_at: new Date()
      };

      if (editingFrame) {
        const { error } = await supabase
          .from('frames')
          .update(frameData)
          .eq('id', editingFrame.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('frames')
          .insert([frameData]);
        if (error) throw error;
      }

      setIsEditorOpen(false);
      setEditingFrame(null);
      fetchFrames(); 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message + "\n\nDICA: Se não estiver logado, verifique se o RLS está desativado no Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    if (window.confirm("Excluir este frame?")) {
      const { error } = await supabase.from('frames').delete().eq('id', id);
      if (error) alert("Erro ao deletar: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (supabase && session) await supabase.auth.signOut();
    setIsGuest(false);
    setFrames([]);
  };

  if (!isLibLoaded) {
    return <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <p>Carregando sistema...</p>
    </div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  }

  // Auth Screen se não tiver sessão e não for convidado
  if ((!session && !isGuest) || !supabase) {
    return <AuthScreen client={supabase} onGuestLogin={() => setIsGuest(true)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Film className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CineBoard <span className="text-emerald-500">Supabase</span></h1>
        </div>

        <div className="flex items-center gap-4">
           {errorMsg && <span className="text-red-500 text-xs hidden md:inline">{errorMsg}</span>}
           
           <div className="hidden md:flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Maximize2 size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}><Move size={18} /></button>
           </div>
           
           <button onClick={() => { setEditingFrame(null); setIsEditorOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow-lg shadow-emerald-900/20">
             <Plus size={18} /> <span className="hidden md:inline">Novo Frame</span>
           </button>
           <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-white" title="Sair"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto">
        {frames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
            <Film size={64} className="text-zinc-700 mb-4" />
            <h2 className="text-2xl font-bold text-zinc-500 mb-2">Seu storyboard está vazio</h2>
            <p className="text-zinc-600 mb-8 max-w-md text-center">
              {isGuest ? 'Modo Visitante Ativo (Dados Públicos).' : 'Banco de dados Supabase conectado.'} Comece a criar.
            </p>
            <button onClick={() => { setEditingFrame(null); setIsEditorOpen(true); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition">Criar Primeiro Frame</button>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {frames.map((frame, index) => (
              <FrameCard key={frame.id} index={index} data={frame} onDelete={handleDelete} onEdit={(f) => { setEditingFrame(f); setIsEditorOpen(true); }} />
            ))}
          </div>
        )}
      </main>

      <FrameEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSave} initialData={editingFrame} isSaving={isSaving} />
    </div>
  );
}
