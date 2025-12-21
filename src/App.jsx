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
  FolderPlus,
  FolderOpen,
  ChevronLeft,
  LayoutGrid,
  Calendar
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
// COLOQUE SUAS CHAVES AQUI
const SUPABASE_URL = 'https://ujpvyslrosmismgbcczl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcHZ5c2xyb3NtaXNtZ2JjY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzU5MDgsImV4cCI6MjA2NjM1MTkwOH0.XkgwQ4VF7_7plt8-cw9VsatX4WwLolZEO6a6YtovUFs';

// --- SQL NECESSÁRIO NO SUPABASE ---
/*
  -- Tabela de Projetos (Já criada por você)
  create table sbprojects (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text
  );

  -- Tabela de Frames (Com prefixo sb)
  create table sbframes (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text,
    description text,
    prompt text,
    camera_move text,
    image_base64 text,
    user_id uuid, -- Opcional se não usar auth estrito
    project_id uuid references sbprojects(id) on delete cascade
  );
  
  -- Liberar acesso (Se não usar Auth RLS)
  alter table sbprojects disable row level security;
  alter table sbframes disable row level security;
*/

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

const ProjectList = ({ projects, onSelect, onCreate, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreate({ title: newTitle, description: newDesc });
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meus Projetos</h1>
          <p className="text-zinc-400">Gerencie seus filmes e storyboards</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/20"
        >
          <FolderPlus size={20} /> Novo Projeto
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Criar Novo Projeto</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">NOME DO PROJETO</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
                  placeholder="Ex: Curta Metragem Sci-Fi"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">DESCRIÇÃO (Opcional)</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
                  placeholder="Sinopse ou notas gerais..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-zinc-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
          <FolderOpen size={64} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-500">Nenhum projeto encontrado</h3>
          <p className="text-zinc-600 mt-2">Crie seu primeiro projeto para começar a adicionar frames.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => onSelect(project)}
              className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-900/10 relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
                  <Film className="text-zinc-400 group-hover:text-emerald-400" size={24} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                  className="text-zinc-600 hover:text-red-500 p-2 rounded-full hover:bg-zinc-800 transition"
                  title="Excluir Projeto"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{project.title}</h3>
              <p className="text-zinc-500 text-sm line-clamp-2 h-10 mb-4">{project.description || "Sem descrição definida."}</p>
              
              <div className="flex items-center gap-2 text-xs text-zinc-600 border-t border-zinc-800 pt-4 mt-auto">
                <Calendar size={14} />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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
  
  // Estado para Projetos
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null); // Se null, mostra lista de projetos. Se objeto, mostra board.

  // Estado para Frames (Board)
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
    if (window.supabase) {
      setIsLibLoaded(true);
      return;
    }
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
      setLoading(false);
    }
  }, [isLibLoaded]);

  // --- GERENCIAMENTO DE PROJETOS ---
  
  useEffect(() => {
    if (!supabase) return;
    fetchProjects();

    // Listener para novos projetos
    const channel = supabase
      .channel('sbprojects_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sbprojects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('sbprojects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      // Não mostra erro na UI se for só tabela inexistente, para não assustar no primeiro uso
      if (!error.message.includes('relation "sbprojects" does not exist')) {
        setErrorMsg(error.message);
      }
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sbprojects').insert([projectData]);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      alert("Erro ao criar projeto: " + error.message + "\n\nVerifique se criou a tabela 'sbprojects' no Supabase.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!supabase) return;
    if (window.confirm("ATENÇÃO: Excluir o projeto apagará TODOS os frames dentro dele. Continuar?")) {
      const { error } = await supabase.from('sbprojects').delete().eq('id', id);
      if (error) alert("Erro: " + error.message);
      else fetchProjects();
    }
  };

  // --- GERENCIAMENTO DE FRAMES (BOARD) ---

  useEffect(() => {
    if (!supabase || !currentProject) return;
    
    fetchFrames();

    const channel = supabase
      .channel(`sbframes_${currentProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sbframes', filter: `project_id=eq.${currentProject.id}` }, () => {
        fetchFrames();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentProject, supabase]);

  const fetchFrames = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sbframes')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setFrames(data || []);
    } catch (error) {
      console.error("Erro Supabase:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFrame = async (formData) => {
    if (!supabase || !currentProject) return;
    setIsSaving(true);
    try {
      let imageBase64 = formData.imagePreview;
      if (formData.image) {
        imageBase64 = await compressImage(formData.image);
      }

      const frameData = {
        title: formData.title,
        description: formData.description,
        prompt: formData.prompt,
        camera_move: formData.cameraMove, 
        image_base64: imageBase64,
        project_id: currentProject.id, // VINCULA AO PROJETO ATUAL
        updated_at: new Date()
      };

      if (editingFrame) {
        const { error } = await supabase.from('sbframes').update(frameData).eq('id', editingFrame.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sbframes').insert([frameData]);
        if (error) throw error;
      }

      setIsEditorOpen(false);
      setEditingFrame(null);
      fetchFrames(); 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFrame = async (id) => {
    if (!supabase) return;
    if (window.confirm("Excluir este frame?")) {
      const { error } = await supabase.from('sbframes').delete().eq('id', id);
      if (error) alert("Erro ao deletar: " + error.message);
      fetchFrames();
    }
  };

  // --- RENDERIZAÇÃO ---

  if (!isLibLoaded || loading && !projects.length && !currentProject) {
    return <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <p>Carregando sistema...</p>
    </div>;
  }

  // MODO 1: Lista de Projetos (Home)
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Film className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CineBoard <span className="text-emerald-500">Projetos</span></h1>
          </div>
        </header>
        
        <ProjectList 
          projects={projects} 
          onSelect={setCurrentProject} 
          onCreate={handleCreateProject}
          onDelete={handleDeleteProject}
        />
      </div>
    );
  }

  // MODO 2: Board do Projeto (Frames)
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentProject(null)}
            className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Voltar aos Projetos"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">{currentProject.title}</h1>
            <span className="text-xs text-zinc-500 mt-1">Modo Storyboard</span>
          </div>
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
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto">
        {frames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
            <Film size={64} className="text-zinc-700 mb-4" />
            <h2 className="text-2xl font-bold text-zinc-500 mb-2">Projeto Vazio</h2>
            <p className="text-zinc-600 mb-8 max-w-md text-center">
              Adicione os frames gerados pela IA para montar sua cena.
            </p>
            <button onClick={() => { setEditingFrame(null); setIsEditorOpen(true); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition">Criar Primeiro Frame</button>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {frames.map((frame, index) => (
              <FrameCard key={frame.id} index={index} data={frame} onDelete={handleDeleteFrame} onEdit={(f) => { setEditingFrame(f); setIsEditorOpen(true); }} />
            ))}
          </div>
        )}
      </main>

      <FrameEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveFrame} initialData={editingFrame} isSaving={isSaving} />
    </div>
  );
}
