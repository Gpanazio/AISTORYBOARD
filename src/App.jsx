import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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
  ChevronRight,
  LayoutGrid,
  Calendar,
  Download,
  Play,
  GripVertical,
  LayoutTemplate,
  Wifi,
  WifiOff,
  RefreshCw,
  UploadCloud,
  Zap,
  ArrowRight
} from 'lucide-react';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://ujpvyslrosmismgbcczl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcHZ5c2xyb3NtaXNtZ2JjY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzU5MDgsImV4cCI6MjA2NjM1MTkwOH0.XkgwQ4VF7_7plt8-cw9VsatX4WwLolZEO6a6YtovUFs';

// --- UTILITÁRIOS ---

// Gera um arquivo Base64 do original (apenas para preview local rápido ou upload de capa)
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// NOVA FUNÇÃO: Gera uma miniatura leve (max 300px) para o Grid
const generateThumbnail = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 350; // Tamanho ideal para o card do grid
        let width = img.width;
        let height = img.height;

        // Calcula proporção
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        // Desenha redimensionado
        ctx.drawImage(img, 0, 0, width, height);
        // Retorna JPEG otimizado (qualidade 0.7)
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.readAsDataURL(file);
  });
};


const copyToClipboard = (text) => {
  if (!text) return; 
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

// --- COMPONENTES ---

const CarouselModal = ({ frames, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % frames.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  const currentFrame = frames[currentIndex];

  if (!currentFrame) return null;

  // No Carrossel (Tela Cheia), usamos a URL original (Alta Resolução)
  const imageSource = currentFrame.image_url || currentFrame.image_base64;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      <div className="flex justify-between items-center p-6 text-zinc-500">
        <div className="text-xs font-mono tracking-widest uppercase">
          FRAME {String(currentIndex + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}
        </div>
        <button onClick={onClose} className="hover:text-red-600 p-2 transition">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-black">
        <img 
          src={imageSource} 
          alt={currentFrame.title} 
          className="max-w-full max-h-full object-contain"
        />
        <button 
          onClick={handlePrev}
          className="absolute left-4 p-4 text-zinc-500 hover:text-red-600 transition"
        >
          <ChevronLeft size={48} strokeWidth={1} />
        </button>
        <button 
          onClick={handleNext}
          className="absolute right-4 p-4 text-zinc-500 hover:text-red-600 transition"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>

      <div className="bg-black p-8 pb-10 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{currentFrame.title || "SEM TÍTULO"}</h2>
          {currentFrame.camera_move && (
            <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-1 mb-4 uppercase tracking-widest">
              {currentFrame.camera_move}
            </span>
          )}
          <p className="text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed">{currentFrame.description}</p>
        </div>
      </div>
    </div>
  );
};

const ProjectList = ({ projects, onSelect, onCreate, onDelete, onUpdate, loading, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle('');
    setDesc('');
    setCoverImage(null);
    setCoverPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setTitle(project.title);
    setDesc(project.description || '');
    setCoverPreview(project.cover_image || null);
    setCoverImage(null);
    setIsModalOpen(true);
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let coverBase64 = editingProject?.cover_image;

    if (coverImage) {
      // Para capa de projeto, usamos uma compressão média pois não precisa ser 4K
      coverBase64 = await generateThumbnail(coverImage); 
    }

    const projectData = { 
        title, 
        description: desc,
        cover_image: coverBase64
    };
    
    if (editingProject) {
      onUpdate(editingProject.id, projectData);
    } else {
      onCreate(projectData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tighter">BRICK<span className="text-red-600">BOARD</span></h1>
          <p className="text-zinc-500 text-xs tracking-widest uppercase">Storyboard System</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onRefresh}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-4 py-3 font-bold flex items-center gap-2 transition text-sm tracking-wide uppercase border border-zinc-800"
                title="Recarregar Projetos"
            >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
            onClick={openCreateModal}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-bold flex items-center gap-2 transition text-sm tracking-wide uppercase shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
            >
            <Plus size={18} /> Novo Projeto
            </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900"></div>
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
              {editingProject ? 'EDITAR PROJETO' : 'NOVO PROJETO'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                 <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">CAPA DO PROJETO</label>
                 <div className="relative w-full h-32 bg-black border border-zinc-800 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-red-600 transition-colors">
                    {coverPreview ? (
                        <>
                            <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">Trocar Imagem</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-zinc-700 group-hover:text-red-600 transition-colors">
                            <ImageIcon size={24} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Upload Capa</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">TÍTULO</label>
                <input 
                  autoFocus
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-red-600 outline-none transition-colors placeholder:text-zinc-700"
                  placeholder="DIGITE O NOME DO PROJETO"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">DESCRIÇÃO (OPCIONAL)</label>
                <textarea 
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-4 text-white focus:border-red-600 outline-none h-24 transition-colors placeholder:text-zinc-700 resize-none"
                  placeholder="Detalhes sobre o filme..."
                />
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition">Cancelar</button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest transition">
                  {editingProject ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-900 bg-zinc-950/50">
          <div className="w-16 h-16 bg-zinc-900 flex items-center justify-center mb-6 rounded-full">
             <Film size={32} className="text-zinc-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">NENHUM PROJETO ENCONTRADO</h3>
          <p className="text-zinc-600 text-sm max-w-md text-center">O Monolito está vazio. Inicie sua jornada criativa agora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => {
            if (!project || !project.id) return null;

            return (
            <div 
              key={project.id}
              onClick={() => onSelect(project)}
              className="group bg-zinc-950 border border-zinc-900 hover:border-red-600/50 cursor-pointer transition-all duration-300 relative overflow-hidden min-h-[250px] flex flex-col"
            >
              {project.cover_image && (
                  <div className="absolute inset-0 z-0">
                      <img 
                        src={project.cover_image} 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500 grayscale group-hover:grayscale-0" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
                  </div>
              )}

              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 transform -translate-x-1 group-hover:translate-x-0 transition-transform duration-300 z-20"></div>
              
              <div className="relative z-10 p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-auto">
                    <div className={`transition-colors duration-300 ${project.cover_image ? 'text-white' : 'text-zinc-700 group-hover:text-red-500'}`}>
                      <Film size={24} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => openEditModal(project, e)}
                        className="text-zinc-400 hover:text-white transition bg-black/50 p-2 rounded-full backdrop-blur-sm"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className="text-zinc-400 hover:text-red-500 transition bg-black/50 p-2 rounded-full backdrop-blur-sm"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors duration-300 drop-shadow-md">{project.title}</h3>
                      <p className="text-zinc-400 text-sm line-clamp-2 h-10 mb-6 font-light">{project.description || "Sem descrição."}</p>
                      
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-t border-zinc-800/50 pt-4">
                        <Calendar size={12} />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                  </div>
              </div>
            </div>
            );
          })}
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
      // No editor, sempre preferimos a URL de alta resolução para ver os detalhes
      const highRes = initialData.image_url || initialData.image_base64;
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        prompt: initialData.prompt || '',
        cameraMove: initialData.camera_move || '',
        imagePreview: highRes, 
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Widescreen */}
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900 z-10"></div>
        
        {/* Coluna Visual (Imagem) - 75% da largura */}
        <div className="w-full md:w-3/4 bg-black flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-900 relative group">
          {formData.imagePreview ? (
            <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-contain p-4 md:p-8" />
          ) : (
            <div className="text-zinc-700 flex flex-col items-center">
              <ImageIcon size={64} strokeWidth={1} className="mb-4" />
              <p className="text-xs uppercase tracking-widest">Nenhuma imagem selecionada</p>
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <div className="border border-red-600 px-6 py-3 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition">
              {formData.imagePreview ? 'Trocar Imagem' : 'Selecionar Frame'}
            </div>
          </label>
        </div>

        {/* Coluna Dados (Formulário) - 25% da largura */}
        <div className="w-full md:w-1/4 p-6 flex flex-col bg-zinc-950 overflow-y-auto border-l border-zinc-900">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-4">
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">
              {initialData ? 'EDITAR FRAME' : 'NOVO FRAME'}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X size={20} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">CENA / TÍTULO</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 text-white focus:border-red-600 outline-none transition-colors text-sm" placeholder="Cena 1 - O Monolito" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">DESCRIÇÃO</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 text-white focus:border-red-600 outline-none h-24 resize-none transition-colors text-sm" />
            </div>
            
            <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">MOVIMENTO</label>
                <input type="text" value={formData.cameraMove} onChange={e => setFormData({...formData, cameraMove: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 text-white focus:border-red-600 outline-none transition-colors text-sm" placeholder="ZOOM IN" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">PROMPT ORIGINAL (IA)</label>
              <textarea value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} className="w-full bg-black border border-zinc-800 p-3 text-zinc-300 font-mono text-xs focus:border-red-600 outline-none h-32 resize-none transition-colors" />
            </div>
            
            <div className="pt-6 flex justify-end gap-3 border-t border-zinc-900 mt-auto">
              <button type="button" onClick={onClose} className="px-4 py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition">Cancelar</button>
              <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center gap-2">
                {isSaving && <Loader2 className="animate-spin" size={14} />}
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE CARD OTIMIZADO ---
const FrameCard = memo(({ 
    data, onDelete, onEdit, index, 
    onDragStart, onDragEnter, onDragEnd, onDragOver, onSetCover,
    onInsert, onManualOrderChange // Props mantidas para reordenação
}) => {
  const [copied, setCopied] = useState(false);
  const [tempOrder, setTempOrder] = useState(index + 1);

  useEffect(() => {
    setTempOrder(index + 1);
  }, [index]);
  
  const handleCopyPrompt = () => {
    if (!data.prompt) return;
    copyToClipboard(data.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrderSubmit = (e) => {
    if (e.key === 'Enter') {
        const newPos = parseInt(tempOrder);
        if (!isNaN(newPos) && newPos > 0) {
            onManualOrderChange(index, newPos - 1);
        } else {
            setTempOrder(index + 1);
        }
        e.target.blur();
    }
  };

  const handleOrderBlur = () => {
    const newPos = parseInt(tempOrder);
    if (!isNaN(newPos) && newPos > 0) {
        onManualOrderChange(index, newPos - 1);
    } else {
        setTempOrder(index + 1);
    }
  };

  const downloadName = `brickboard_${data.title ? data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'frame'}_${index}.png`;
  
  // AQUI A MÁGICA: Prioriza a thumbnail (base64) para o card, se existir. 
  // Se não, usa a URL completa (fallback). Isso deixa o grid leve.
  const imageSource = data.image_base64 || data.image_url;
  // Link de download sempre aponta para a URL original (alta qualidade)
  const originalSource = data.image_url || data.image_base64;

  return (
    <div 
      className="group relative bg-zinc-950 border border-zinc-900 hover:border-red-600 transition-all duration-300 flex flex-col h-full"
    >
        {/* ZONA DE INSERÇÃO ("GUTTER") ESQUERDA */}
        <div className="absolute -left-5 top-0 bottom-0 w-6 z-30 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer group/insert"
             onClick={() => onInsert(index)}>
            <div className="h-full w-0.5 bg-red-600 shadow-[0_0_10px_#ef4444] group-hover/insert:h-full transition-all"></div>
            <div className="absolute bg-red-600 text-white rounded-full p-1 shadow-lg transform scale-0 group-hover/insert:scale-100 transition-transform">
                <Plus size={12} />
            </div>
        </div>

      <div 
        className="relative aspect-video bg-black overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={() => onEdit(data)}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnter={(e) => onDragEnter(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => { e.preventDefault(); if(onDragOver) onDragOver(e); }}
      >
        {imageSource ? (
          <img 
            src={imageSource} 
            alt={data.title} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 select-none pointer-events-none" 
            loading="lazy" 
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-700">Sem Imagem</span>
          </div>
        )}
        
        {/* BADGE NUMÉRICO EDITÁVEL */}
        <div className="absolute top-0 left-0 bg-red-600 text-white z-20 shadow-lg flex items-center"
             onClick={(e) => e.stopPropagation()} 
        >
          <span className="pl-2 pr-1 text-[10px] font-bold">#</span>
          <input 
            type="text"
            value={tempOrder}
            onChange={(e) => setTempOrder(e.target.value)}
            onKeyDown={handleOrderSubmit}
            onBlur={handleOrderBlur}
            className="w-8 bg-transparent text-white text-[10px] font-bold focus:outline-none focus:bg-red-700 text-center py-1 pr-1"
          />
        </div>
        
        <div className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 drop-shadow-md pointer-events-none">
            <GripVertical size={20} />
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20 backdrop-blur-sm">
            <button onClick={(e) => { e.stopPropagation(); onEdit(data); }} className="p-3 border border-white text-white hover:bg-white hover:text-black transition rounded-full" title="Editar"><Edit3 size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onSetCover(data); }} className="p-3 border border-zinc-500 text-zinc-500 hover:border-white hover:text-white transition rounded-full" title="Definir como Capa"><LayoutTemplate size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="p-3 border border-zinc-500 text-zinc-500 hover:border-red-500 hover:text-red-500 transition rounded-full" title="Excluir"><Trash2 size={18} /></button>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3 min-h-[24px]">
            <h3 className={`font-bold truncate pr-2 uppercase tracking-tight ${data.title ? 'text-white' : 'text-zinc-700'}`}>
              {data.title || "SEM TÍTULO"}
            </h3>
            {data.camera_move && <span className="text-[9px] font-bold uppercase tracking-widest bg-zinc-900 text-red-500 px-2 py-0.5 border border-zinc-800 whitespace-nowrap">{data.camera_move}</span>}
        </div>
        
        <p className="text-zinc-500 text-xs line-clamp-2 mb-4 h-8 font-light">{data.description || ""}</p>
        
        <div className="mt-auto pt-4 border-t border-zinc-900">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   {originalSource && <a href={originalSource} download={downloadName} className="text-zinc-600 hover:text-red-500 transition flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold" title="Baixar Original" onClick={(e) => e.stopPropagation()}><Download size={12} /> <span className="hidden sm:inline">Download</span></a>}
                </div>

                {data.prompt && (
                  <button onClick={handleCopyPrompt} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${copied ? 'text-red-500' : 'text-zinc-600 hover:text-white'} transition`}>
                      {copied ? 'COPIADO' : <><Copy size={12} /> PROMPT</>}
                  </button>
                )}
             </div>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [isLibLoaded, setIsLibLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false); 
  
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null); 
  const [frames, setFrames] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [errorMsg, setErrorMsg] = useState(null);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  const [insertAtIndex, setInsertAtIndex] = useState(null);

  const dragItem = useRef();
  const dragOverItem = useRef();
  const scrollInterval = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const saveOrderTimeoutRef = useRef(null);

  const uploadToStorage = async (file) => {
      if(!supabase) return null;
      try {
          const fileExt = file.name ? file.name.split('.').pop() : 'png';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;
          const { error: uploadError } = await supabase.storage.from('sbbrick').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('sbbrick').getPublicUrl(filePath);
          return data.publicUrl;
      } catch (error) {
          console.error("Erro no upload:", error);
          throw error;
      }
  };

  const fetchWithRetry = async (fn, retries = 5, delay = 1000) => {
    try { await fn(false); } catch (err) {
      if (retries > 0) { setTimeout(() => fetchWithRetry(fn, retries - 1, delay * 2), delay); } 
      else { setErrorMsg("O servidor demorou a responder (Timeout). Tente recarregar."); }
    }
  };

  useEffect(() => {
    if (window.supabase) { setIsLibLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => setIsLibLoaded(true);
    script.onerror = () => { setErrorMsg("Falha ao carregar a biblioteca Supabase."); setLoading(false); };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (isLibLoaded && !supabase && SUPABASE_URL !== 'SUA_URL_AQUI') {
      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(client);
        setIsConnected(true);
      } catch (e) { console.error(e); setErrorMsg("Erro nas chaves de API."); }
    } else if (isLibLoaded && !supabase) { setLoading(false); }
  }, [isLibLoaded]);

  useEffect(() => {
    if (!supabase) return;
    fetchWithRetry(fetchProjects);
    const channel = supabase.channel('sbprojects_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sbprojects' }, () => {
            fetchProjects(false);
        })
        .subscribe((status) => { if (status === 'SUBSCRIBED') setIsConnected(true); else setIsConnected(false); });
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const fetchProjects = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase.from('sbprojects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
      setErrorMsg(null); 
      setIsConnected(true); 
    } catch (error) {
      if (!error.message.includes('relation "sbprojects" does not exist')) setErrorMsg(error.message);
      setIsConnected(false);
      throw error; 
    } finally {
        setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sbprojects').insert([projectData]);
      if (error) throw error;
      fetchProjects();
    } catch (error) { alert("Erro ao criar projeto: " + error.message); }
  };

  const handleUpdateProject = async (id, projectData) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('sbprojects').update(projectData).eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      alert("Erro ao atualizar projeto: " + error.message);
    }
  };

  const handleSetCover = async (frame) => {
    if (!supabase || !currentProject) return;
    if (window.confirm("Definir este frame como capa do projeto?")) {
        try {
            // Usa thumbnail para capa (mais leve) ou a original se não tiver thumb
            const cover = frame.image_base64 || frame.image_url;
            const { error } = await supabase.from('sbprojects').update({ cover_image: cover }).eq('id', currentProject.id);
            if (error) throw error;
            alert("Capa atualizada com sucesso!");
        } catch (error) {
            alert("Erro ao definir capa: " + error.message);
        }
    }
  };

  const handleDeleteProject = async (id) => {
    if (!supabase) return;
    if (!window.confirm("ATENÇÃO: Excluir o projeto apagará TODOS os frames dentro dele. Continuar?")) return;
    const password = window.prompt("Digite a senha de administrador para confirmar a exclusão:");
    if (password === "Brick$2016") {
        const { error } = await supabase.from('sbprojects').delete().eq('id', id);
        if (error) alert("Erro: " + error.message);
        else fetchProjects();
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
  };

  useEffect(() => {
    if (!supabase || !currentProject) return;
    
    fetchFrames(true);

    const channel = supabase.channel(`sbframes_${currentProject.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sbframes', filter: `project_id=eq.${currentProject.id}` }, (payload) => {
            // Se eu mesmo estou arrastando ou salvando, ignoro updates externos temporariamente
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = setTimeout(() => {
                if (!isSaving && dragItem.current === null) {
                   fetchFrames(false);
                }
            }, 1000); 
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') setIsConnected(true);
        });

    return () => { 
        supabase.removeChannel(channel); 
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [currentProject, supabase]);

  const fetchFrames = async (showLoading = true) => {
    if (!currentProject) return;
    if (showLoading) setLoading(true); 
    
    try {
      const { data, error } = await supabase
        .from('sbframes')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('order_index')) {
             const { data: fallbackData, error: fallbackError } = await supabase
                .from('sbframes')
                .select('*')
                .eq('project_id', currentProject.id)
                .order('created_at', { ascending: true });
             if (fallbackError) throw fallbackError;
             setFrames(fallbackData || []);
             setErrorMsg(null);
             setIsConnected(true);
             return;
        }
        throw error;
      }
      setFrames(data || []);
      setErrorMsg(null);
      setIsConnected(true);
    } catch (error) {
      console.error("Erro Supabase:", error);
      setErrorMsg(error.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOverFile = (e) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) setIsDraggingFile(true); };
  const handleDragLeaveFile = (e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingFile(false); };
  
  const handleDropFile = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) { alert("Apenas arquivos de imagem são permitidos."); return; }
    await uploadFilesBatch(files);
  };

  const handleOverlayDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) { alert("Apenas arquivos de imagem são permitidos."); return; }
    await uploadFilesBatch(files);
  }

  const uploadFilesBatch = async (files) => {
    if (!supabase || !currentProject) return;
    
    let successCount = 0;
    let failCount = 0;
    let currentOrderIndex = frames.length; 

    // Se estiver inserindo no meio, usamos esse index
    if (insertAtIndex !== null) {
        currentOrderIndex = insertAtIndex;
    }

    for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];

        try {
            const publicUrl = await uploadToStorage(file);
            const thumbBase64 = await generateThumbnail(file); // Gera Thumb

            const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

            const frameData = {
                title: '',
                description: '',
                prompt: '',
                camera_move: '',
                image_url: publicUrl, // Original
                image_base64: thumbBase64, // Thumbnail
                project_id: currentProject.id,
                order_index: currentOrderIndex + i, // Insere em ordem
                updated_at: new Date()
            };

            const { error } = await supabase.from('sbframes').insert([frameData]);
            
            if (error) {
                console.error(`Erro BD:`, error);
                failCount++;
            } else {
                successCount++;
            }

        } catch (err) {
            console.error("Erro Geral Upload:", err);
            failCount++;
        }
    }

    setUploadProgress(null);
    setInsertAtIndex(null); 
    
    if (successCount > 0) {
        // Se inseriu no meio, melhor recarregar para garantir ordem
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => fetchFrames(true), 500);
    }
    if (failCount > 0) {
        alert(`${failCount} imagens falharam. Verifique se o Bucket 'sbbrick' existe.`);
    }
  };

  const handleAutoScroll = (e) => {
    const { clientY } = e;
    const height = window.innerHeight;
    const threshold = 150; 
    const maxScrollSpeed = 20;

    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }

    if (clientY < threshold) {
       const intensity = (threshold - clientY) / threshold;
       const speed = -maxScrollSpeed * intensity;
       scrollInterval.current = setInterval(() => {
         window.scrollBy(0, speed);
       }, 16);
    } else if (clientY > (height - threshold)) {
       const intensity = (clientY - (height - threshold)) / threshold;
       const speed = maxScrollSpeed * intensity;
       scrollInterval.current = setInterval(() => {
         window.scrollBy(0, speed);
       }, 16);
    }
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  // --- NOVA LÓGICA DE REORDENAÇÃO MANUAL E POR DRAG ---
  const saveNewOrder = useCallback(async (newFrames) => {
     if (!supabase) return;
     
     // Debounce para não matar o banco com updates a cada pixel
     if (saveOrderTimeoutRef.current) clearTimeout(saveOrderTimeoutRef.current);

     saveOrderTimeoutRef.current = setTimeout(async () => {
        const updates = newFrames.map((frame, index) => ({
            id: frame.id,
            order_index: index,
            project_id: currentProject.id, 
            updated_at: new Date()
        }));

        try {
            const { error } = await supabase.from('sbframes').upsert(updates, { onConflict: 'id' });
            if (error) throw error;
            console.log("Ordem salva com sucesso.");
        } catch (error) {
            console.error("Erro ao salvar ordem:", error);
        }
     }, 2000); 
  }, [currentProject, supabase]);


  const handleManualOrderChange = (currentIndex, newIndex) => {
      const updatedFrames = [...frames];
      const [movedFrame] = updatedFrames.splice(currentIndex, 1);
      const targetIndex = Math.max(0, Math.min(newIndex, updatedFrames.length));
      updatedFrames.splice(targetIndex, 0, movedFrame);
      setFrames(updatedFrames);
      saveNewOrder(updatedFrames);
  };

  const handleDragStart = (e, position) => { dragItem.current = position; };
  
  const handleDragEnter = (e, position) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === undefined) return;
    
    dragOverItem.current = position;
    
    if (position < 0 || position >= frames.length || dragItem.current < 0 || dragItem.current >= frames.length) return;

    const copyListItems = [...frames];
    const dragItemContent = copyListItems[dragItem.current];
    
    if (!dragItemContent) return;

    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = position;
    setFrames(copyListItems);
  };
  
  const handleDragOver = (e) => {
     e.preventDefault();
     handleAutoScroll(e);
  };
  
  const handleDragEnd = async () => { 
    stopAutoScroll();
    dragItem.current = null; 
    dragOverItem.current = null; 
    saveNewOrder(frames);
  };
  
  const handleInsertAt = (index) => {
      setInsertAtIndex(index);
      setEditingFrame(null);
      setIsEditorOpen(true);
  };

  const handleSaveFrame = async (formData) => {
    if (!supabase || !currentProject) return;
    if (!formData.image && !formData.imagePreview) { alert("A imagem é obrigatória."); return; }

    setIsSaving(true);
    try {
      let imageUrl = formData.imagePreview;
      let imageBase64 = null;

      // Se imagem nova
      if (formData.image) {
         imageUrl = await uploadToStorage(formData.image);
         // Gera thumbnail
         imageBase64 = await generateThumbnail(formData.image);
      } else if (formData.imagePreview && formData.imagePreview.startsWith('data:')) {
         imageBase64 = formData.imagePreview; 
      }

      // Lógica de Índice
      let targetOrderIndex = frames.length; 
      if (editingFrame) {
          targetOrderIndex = editingFrame.order_index;
      } else if (insertAtIndex !== null) {
          targetOrderIndex = insertAtIndex;
      }

      const frameData = {
        title: formData.title || '',
        description: formData.description || '',
        prompt: formData.prompt || '',
        camera_move: formData.cameraMove || '', 
        image_url: imageUrl,
        image_base64: imageBase64, 
        project_id: currentProject.id, 
        order_index: targetOrderIndex,
        updated_at: new Date()
      };

      if (editingFrame) {
        const { error } = await supabase.from('sbframes').update(frameData).eq('id', editingFrame.id);
        if (error) throw error;
      } else {
        // Para garantir que insira na posição certa, vamos fazer o insert e depois reordenar todo o array se necessario
        // Mas a estratégia mais simples é: Inserir com o index desejado. Se for conflito, o reorder subsequente corrige
        const { error } = await supabase.from('sbframes').insert([frameData]);
        if (error) throw error;
      }

      setIsEditorOpen(false);
      setEditingFrame(null);
      setInsertAtIndex(null);
      
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => fetchFrames(false), 500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFrame = async (id) => { if (!supabase) return; if (window.confirm("Excluir este frame?")) { const { error } = await supabase.from('sbframes').delete().eq('id', id); if (error) alert("Erro ao deletar: " + error.message); fetchFrames(); } };

  if (!isLibLoaded || (loading && !projects.length && !currentProject)) {
    return <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-zinc-500"><div className="relative"><div className="absolute inset-0 bg-red-600 blur-xl opacity-20 rounded-full animate-pulse"></div><Loader2 className="animate-spin text-red-600 relative z-10" size={64} /></div><p className="text-xs uppercase tracking-widest text-red-600">Carregando BrickBoard...</p>{errorMsg && <p className="text-red-500 text-xs text-center px-4 max-w-md">{errorMsg}</p>}</div>;
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white relative">
        <div className="absolute top-6 right-8 z-30 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} transition-colors`}></div><span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{isConnected ? 'Online' : 'Offline'}</span></div>
        <ProjectList projects={projects} onSelect={(project) => { setLoading(true); setCurrentProject(project); }} onCreate={handleCreateProject} onDelete={handleDeleteProject} onUpdate={handleUpdateProject} loading={loading} onRefresh={() => fetchProjects(true)} />
      </div>
    );
  }

  return (
    <div 
        className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white relative" 
        onDragOver={handleDragOverFile} 
        onDragLeave={handleDragLeaveFile}
        onDrop={handleDropFile}
    >
      
      {isDraggingFile && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 border-4 border-red-600 border-dashed m-4 rounded-xl flex flex-col items-center justify-center"
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleOverlayDrop}
          >
              <UploadCloud size={80} className="text-red-600 mb-4 animate-bounce pointer-events-none" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-widest pointer-events-none">Soltar Frames Aqui</h2>
              <p className="text-zinc-500 mt-2 pointer-events-none">Upload direto para o Storage</p>
          </div>
      )}

      {uploadProgress && (<div className="fixed bottom-8 right-8 z-50 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up"><Loader2 className="animate-spin text-red-600" size={24} /><div><p className="text-xs font-bold text-white uppercase tracking-widest">Enviando...</p><p className="text-xs text-zinc-500">{uploadProgress.current}/{uploadProgress.total} arquivos</p></div></div>)}
      <header className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-900 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-6"><button onClick={() => setCurrentProject(null)} className="p-2 text-zinc-500 hover:text-white transition" title="Voltar"><ChevronLeft size={24} /></button><div className="flex flex-col"><h1 className="text-2xl font-bold tracking-tight text-white leading-none uppercase">{currentProject.title}</h1><span className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">BrickBoard Story System</span></div></div>
        <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} mr-2`} title={isConnected ? "Conectado" : "Offline"}></div><button onClick={() => { setCarouselStartIndex(0); setCarouselOpen(true); }} className="hidden md:flex bg-zinc-900 hover:bg-white hover:text-black text-zinc-400 px-6 py-3 font-bold items-center gap-2 transition text-xs uppercase tracking-widest border border-zinc-800 hover:border-white"><Play size={14} /> Apresentar</button><div className="hidden md:flex bg-zinc-950 border border-zinc-800"><button onClick={() => setViewMode('grid')} className={`p-3 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}><Maximize2 size={18} /></button><button onClick={() => setViewMode('list')} className={`p-3 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}><Move size={18} /></button></div><button onClick={() => { setEditingFrame(null); setInsertAtIndex(null); setIsEditorOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-bold flex items-center gap-2 transition text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.4)]"><Plus size={16} /> <span className="hidden md:inline">Novo Frame</span></button></div>
      </header>
      <main className="p-8 max-w-[1800px] mx-auto min-h-[calc(100vh-100px)]">
        {loading ? (<div className="flex flex-col items-center justify-center h-[60vh] gap-6"><div className="relative"><div className="absolute inset-0 bg-red-600 blur-xl opacity-20 rounded-full animate-pulse"></div><Loader2 className="animate-spin text-red-600 relative z-10" size={64} /></div><p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Carregando Storyboard...</p></div>) : frames.length === 0 ? (<div className="flex flex-col items-center justify-center py-40 border border-dashed border-zinc-900 bg-zinc-950"><div className="w-20 h-20 bg-zinc-900 flex items-center justify-center mb-6"><Film size={40} className="text-zinc-700" strokeWidth={1} /></div><h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Projeto Vazio</h2><p className="text-zinc-600 text-sm mb-4 text-center max-w-md">Arraste seus frames para cá ou adicione manualmente.</p>{errorMsg && (<div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-xs font-mono max-w-md text-center">{errorMsg}</div>)}<div className="flex gap-4"><button onClick={() => fetchFrames(true)} className="bg-zinc-800 text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-zinc-700 transition flex items-center gap-2"><RefreshCw size={16} /> Recarregar</button><button onClick={() => { setEditingFrame(null); setIsEditorOpen(true); }} className="bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition">Adicionar Frame Inicial</button></div></div>) : (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1'}`}>
            {frames.map((frame, index) => {
                if (!frame) return null; // Safe check for undefined frames
                return (
                    <FrameCard 
                        key={frame.id} 
                        index={index} 
                        data={frame} 
                        onDelete={handleDeleteFrame} 
                        onEdit={(f) => { setEditingFrame(f); setIsEditorOpen(true); }} 
                        onSetCover={handleSetCover} 
                        onDragStart={handleDragStart} 
                        onDragEnter={handleDragEnter} 
                        onDragEnd={handleDragEnd} 
                        onDragOver={handleDragOver} 
                        onInsert={handleInsertAt} // Passa a função de inserção
                        onManualOrderChange={handleManualOrderChange} // Passa a função de troca manual
                    />
                );
            })}
            <button onClick={() => { setEditingFrame(null); setInsertAtIndex(null); setIsEditorOpen(true); }} className="group relative bg-zinc-950 border border-dashed border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900 transition-all flex flex-col h-full text-left min-h-[350px]"><div className="w-full h-full flex flex-col items-center justify-center"><div className="w-16 h-16 bg-zinc-900 group-hover:bg-red-600 flex items-center justify-center transition-colors mb-6 rounded-full group-hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]"><Plus className="text-zinc-500 group-hover:text-white" size={32} /></div><span className="text-zinc-500 font-bold text-xs uppercase tracking-widest group-hover:text-red-500 transition-colors">Adicionar Frame</span></div></button>
          </div>
        )}
      </main>
      <FrameEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveFrame} initialData={editingFrame} isSaving={isSaving} />
      {carouselOpen && (<CarouselModal frames={frames} initialIndex={carouselStartIndex} onClose={() => setCarouselOpen(false)} />)}
    </div>
  );
}
