import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, AlertCircle, Trash2, Calendar, BookOpen, Loader2, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'
import { useAppSync } from '@/stores/useAppSync'

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
  const { notifyMaterialChange } = useAppSync()
  const navigate = useNavigate()

  const handleOpenMap = async (m: any) => {
    try {
      // Standardize the object (result.material_id vs material.id)
      const matId = m.id || m.material_id
      const roadmapData = m.ai_roadmap || m.analysis
      
      setMaterial(matId, m)
      
      if (!roadmapData) {
        const data = await api.getRoadmap(matId, user?.id)
        setRoadmap(data.nodes || [])
      } else {
        setRoadmap(roadmapData.knowledge_graph?.nodes || roadmapData.nodes || [])
      }
      navigate('/map')
    } catch (err) {
      console.error("Failed to sync roadmap for map navigation:", err)
      navigate('/map') 
    }
  }

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
      notifyMaterialChange() // Sync dashboard material count
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

      const result = await api.uploadMaterial(selectedFile, user?.id, subjectName, examDate, user?.email)
      
      clearInterval(interval)
      setProgress(100)
      setStatus('Success! Knowledge graph generated.')
      
      setMaterial(result.material_id, result.analysis)
      setRoadmap(result.analysis.knowledge_graph.nodes)
      setUploadResult(result)

      // Add to local cache for persistence resilience — include ai_roadmap for planner topic extraction
      addMaterial({
        id: result.material_id,
        filename: selectedFile.name,
        subject_name: subjectName,
        subject: subjectName,
        exam_date: examDate,
        ai_roadmap: result.analysis,
        created_at: new Date().toISOString()
      })
      
      setIsUploading(false)
      setIsComplete(true)
      notifyMaterialChange() // Sync dashboard material count
      
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
    <div className="max-w-6xl mx-auto space-y-16 pb-20">
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass p-10 rounded-[40px] border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-glow-teal leading-none">Knowledge <span className="text-white">Forge</span> <span className="text-[10px] align-top bg-primary/20 text-primary px-2 py-1 rounded-full not-italic ml-2 font-black">v3.3</span></h1>
          <p className="text-white/40 mt-4 font-bold uppercase tracking-[0.5em] text-[10px] flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" /> Groq Real-time Neural Analysis
          </p>
        </div>
      </div>

      {/* Existing Materials List */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
           <div className="h-px w-8 bg-primary/20 shadow-[0_0_10px_rgba(0,245,212,0.2)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Active Neural Arrays</span>
           <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
          <AnimatePresence mode="popLayout">
            {materials.map((m) => (
              <motion.div 
                key={m.id} 
                layout
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="glass-card p-6 rounded-[32px] border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,245,212,0.05)] space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 glass border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform text-primary shadow-inner">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-white/90 truncate capitalize text-lg">{m.subject_name || m.filename}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase tracking-widest text-primary/60 italic bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                      <Calendar className="w-3 h-3" /> {new Date(m.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) || m.exam_date || 'No Date'}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full glass border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all h-11 rounded-xl group/btn"
                      onClick={() => handleOpenMap(m)}
                    >
                      Open Knowledge Map <Plus className="w-3 h-3 ml-2 group-hover:rotate-90 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {materials.length === 0 && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-2 border-white/5 italic text-white/20 font-bold uppercase tracking-[0.5em] text-xs">
                Neural buffers empty. No materials forged yet.
             </motion.div>
          )}
        </div>
      </div>

      {/* Upload Forge Section (Unified Layout) */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 px-4">
           <div className="h-px w-8 bg-primary/20 shadow-[0_0_10px_rgba(0,245,212,0.2)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Initiate New Deconstruction</span>
           <div className="h-px flex-1 bg-white/5" />
        </div>

        {!isComplete ? (
          <div className="max-w-4xl mx-auto w-full">
            <div className="glass p-1 md:p-12 rounded-[60px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent relative shadow-3xl">
              <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-20" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 p-8 md:p-0">
                {/* Form Elements */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 ml-2 flex items-center gap-2">
                      <BookOpen className="w-3 h-3" /> Subject Identity
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Computer Science" 
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl px-8 font-bold text-white placeholder:text-white/10 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 ml-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Exam Timestamp (Mandatory)
                    </label>
                    <input 
                      type="date" 
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-3xl px-8 font-bold text-white focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none [color-scheme:dark]"
                    />
                  </div>

                  {error && (
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-5 glass border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-red-500/5">
                        <AlertCircle className="w-5 h-5" /> {error}
                     </motion.div>
                  )}
                </div>

                {/* Drop Zone */}
                <div className="space-y-8">
                  <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`relative h-64 md:h-full rounded-[48px] border-dashed border-2 transition-all duration-700 flex flex-col items-center justify-center cursor-pointer group overflow-hidden ${
                      selectedFile ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/10 hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    {isUploading ? (
                       <div className="text-center space-y-8 w-full max-w-[240px] px-4">
                          <div className="w-20 h-20 glass border-primary/40 rounded-full flex items-center justify-center mx-auto shadow-2xl relative">
                             <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                             <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                          <div className="space-y-4">
                             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">{status}</div>
                             <Progress value={progress} className="h-1 bg-white/10" />
                             <div className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{progress}% Analysis</div>
                          </div>
                       </div>
                    ) : (
                      <div className="text-center space-y-6 px-10 relative z-10 transition-transform duration-500 group-hover:translate-y-[-4px]">
                        <div className={`w-20 h-20 glass border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 ${selectedFile ? 'text-emerald-400 border-emerald-500/30' : 'text-primary'}`}>
                          <UploadCloud className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-white">
                            {selectedFile ? 'Manifest Selected' : 'Neural PDF Link'}
                          </h3>
                          <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-[8px]">
                            {selectedFile ? selectedFile.name : 'Drag or Browse to Upload'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 relative z-10 px-8 md:px-0">
                <Button 
                  className="w-full h-24 rounded-[32px] bg-primary text-black font-black uppercase tracking-[0.5em] text-sm italic hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-10 border-t border-white/20 mb-8 md:mb-0"
                  onClick={handleStartUpload}
                  disabled={!selectedFile || !subjectName || !examDate || isUploading}
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : 'Execute Neural Forge'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 max-w-4xl mx-auto">
            <div className="glass p-16 rounded-[60px] border-emerald-500/20 relative overflow-hidden text-center space-y-10 shadow-3xl bg-emerald-500/[0.02]">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
               <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20 rotate-3 animate-bounce-slow">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
               </div>
               <div className="space-y-4">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-glow-teal leading-tight">Neural Sync Complete</h2>
                  <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] max-w-sm mx-auto leading-relaxed">
                    Successfully forged {uploadResult?.analysis?.total_topics} core entities into your Knowledge Map.
                  </p>
               </div>
                <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6 px-10">
                    <Button 
                      size="lg" 
                      className="flex-1 rounded-[24px] px-12 h-20 bg-primary text-black font-black uppercase tracking-[0.3em] hover:scale-[1.03] transition-all shadow-xl shadow-primary/20"
                      onClick={() => handleOpenMap(uploadResult)}
                    >
                      View Results
                    </Button>
                  <Button size="lg" variant="ghost" className="flex-1 rounded-[24px] px-12 h-20 glass border-white/10 text-white font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all" onClick={() => setIsComplete(false)}>
                    New Entry
                  </Button>
                </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
