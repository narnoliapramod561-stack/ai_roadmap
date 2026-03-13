import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, AlertCircle, Trash2, Calendar, BookOpen, Loader2, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const UploadPage = () => {
  const [materials, setMaterials] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  const [subjectName, setSubjectName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const setMaterial = useStudyStore(state => state.setMaterial)
  const setRoadmap = useStudyStore(state => state.setRoadmap)
  const localMaterials = useStudyStore(state => state.materials)
  const addMaterial = useStudyStore(state => state.addMaterial)
  const user = useUserStore(state => state.user)

  // Fix: Refresh materials when user ID changes (hydration or login)
  useEffect(() => {
    loadMaterials()
  }, [user?.id, localMaterials.length])

  const loadMaterials = async () => {
    try {
      const data = await api.listMaterials(user?.id)
      // Merge: Unique by ID, prioritizing API data but keeping local-only ones
      const merged = [...data]
      const apiIds = new Set(data.map((m: any) => m.id))
      
      localMaterials.forEach(lm => {
        if (!apiIds.has(lm.id)) {
          merged.push(lm)
        }
      })
      
      setMaterials(merged)
    } catch (err) {
      console.error("Failed to load materials:", err)
      setMaterials(localMaterials) // Fallback to local only on error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return
    try {
      await api.deleteMaterial(id)
      setMaterials(prev => prev.filter(m => m.id !== id))
      useStudyStore.getState().removeMaterial(id)
    } catch (err) {
      console.error("Delete failed:", err)
      setError("Failed to delete material")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported.')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleStartUpload = async () => {
    // New: Date is mandatory
    if (!selectedFile || !subjectName || !examDate) {
      setError('Required: Subject Name, Exam Date, and PDF File.')
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(10)
    setStatus('Deconstructing Syllabus...')

    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 2))
      }, 400)

      const result = await api.uploadMaterial(selectedFile, user?.id, subjectName, examDate)
      
      clearInterval(interval)
      setProgress(100)
      setStatus('Success! Knowledge graph generated.')
      
      setMaterial(result.material_id, result.analysis)
      setRoadmap(result.analysis.knowledge_graph.nodes)
      setUploadResult(result)

      // Add to local cache for persistence resilience
      addMaterial({
        id: result.material_id,
        filename: selectedFile.name,
        subject_name: subjectName,
        exam_date: examDate,
        created_at: new Date().toISOString()
      })
      
      setIsUploading(false)
      setIsComplete(true)
      
      // Clear inputs for next time
      setSubjectName('')
      setExamDate('')
      setSelectedFile(null)
      
      loadMaterials() 
    } catch (err: any) {
      console.error("Upload Error:", err)
      setError(err.message || 'Analysis failed. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-4">
           DATA <span className="text-primary drop-shadow-[0_0_20px_#00F5D480]">INGESTION</span>
           <div className="px-3 py-1 rounded bg-primary/20 border border-primary/50 text-primary text-[10px] font-mono animate-pulse">
              AWAITING_INPUT
           </div>
        </h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] mt-2">
          Upload syllabi & materials to synchronize the core map
        </p>
      </motion.div>

      {/* 3D Scanner Dropzone */}
      <motion.div 
        initial={{ opacity: 0, rotateX: 30, scale: 0.9 }}
        animate={{ opacity: 1, rotateX: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ perspective: '1000px' }}
      >
         <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`refracted-glass border-highlight rounded-[40px] p-16 transition-all relative overflow-hidden group ${
              isDragging ? 'border-primary shadow-[0_0_50px_rgba(0,245,212,0.4)] bg-primary/5' : 'border-white/10'
            }`}
          >
             {/* Scanner Line */}
             <div className="absolute left-0 right-0 h-1 bg-primary/50 blur-[2px] opacity-0 group-hover:opacity-100 animate-[scan_3s_ease-in-out_infinite]" />
             <div className="absolute left-0 right-0 h-[100px] bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 animate-[scan_3s_ease-in-out_infinite] transform -translate-y-[100px]" />

            <div className="text-center space-y-6 relative z-10">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all shadow-[0_0_30px_rgba(0,245,212,0.2)] relative">
                <ScanLine className="w-12 h-12 text-primary absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                <Upload className="w-12 h-12 text-primary group-hover:opacity-0 transition-opacity" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">INITIALIZE TRANSFER</h3>
                 <p className="text-sm font-bold uppercase tracking-widest text-white/50 leading-relaxed">
                  Drag and drop modules here or <br />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-white underline decoration-primary/50 underline-offset-4 transition-colors"
                  >
                    BROWSE LOCAL SYSTEM
                  </button>
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
      </motion.div>

      {/* Holographic Uploads List */}
      {files.length > 0 && (
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.4 }}
           className="space-y-6"
        >
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Active Transfers
             </h3>
             <div className="text-[10px] font-mono text-primary animate-pulse">{files.filter(f => f.status === 'processing').length} PROCESSING</div>
          </div>
          
          <div className="space-y-4">
            {files.map((file) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={file.id}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:bg-white/10 hover:border-primary/50 transition-all relative overflow-hidden"
              >
                {/* Processing glow */}
                 {file.status === 'processing' && (
                    <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                 )}
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-[#B9A7FF] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-6 relative z-10 w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,245,212,0.2)]">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate max-w-[80%]">{file.file.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/5 px-2 py-0.5 rounded">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {file.status === 'processing' && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin inline" /> Analyzing Nodes...
                        </span>
                      )}
                      {file.status === 'completed' && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 inline" /> Map Sycned
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 inline" /> Transfer Failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {file.status === 'idle' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-3 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors relative z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                 {file.status === 'error' && file.error && (
                    <div className="absolute right-6 text-[10px] text-red-400 font-mono tracking-widest">{file.error}</div>
                 )}
              </motion.div>
            ))}
          </div>

          {files.some(f => f.status === 'idle') && (
            <div className="pt-8">
               <button
                  onClick={processFiles}
                  disabled={processing}
                  className="w-full py-5 bg-primary text-black hover:bg-white transition-all rounded-[20px] font-black text-xl uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,245,212,0.3)] disabled:opacity-50 flex flex-col items-center justify-center gap-1 relative overflow-hidden group"
               >
                 <span className="relative z-10 flex items-center gap-3">
                    {processing ? (
                       <>
                         <Cpu className="w-6 h-6 animate-pulse" /> SYNTHESIZING ROADMAP...
                       </>
                    ) : (
                       <>
                         <BrainCircuit className="w-6 h-6" /> INITIATE L3.3 KNOWLEDGE GRAPH
                       </>
                    )}
                 </span>
                 {!processing && <span className="text-[10px] font-bold text-black/50 tracking-[0.4em] block relative z-10">Consume metadata to build physical node clusters</span>}
                 <div className="absolute inset-0 bg-gradient-to-r from-primary via-white to-primary opacity-0 group-hover:opacity-20 animate-pulse pointer-events-none" />
               </button>
            </div>
          )}
        </motion.div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .refracted-glass {
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(25px) saturate(160%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        }
        .border-highlight {
          border: 1px solid transparent;
          background: linear-gradient(#07070A, #07070A) padding-box,
                      linear-gradient(135deg, rgba(0, 245, 212, 0.5) 0%, transparent 40%) border-box;
        }
        @keyframes scan {
          0% { top: -100px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
};
