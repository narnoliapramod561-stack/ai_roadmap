import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'

export const GraderPage = () => {
  const { topicId } = useParams()
  const roadmap = useStudyStore(state => state.roadmap)
  const topic = topicId ? roadmap.find(t => t.id === topicId) : null

  const [isGrading, setIsGrading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [gradeResult, setGradeResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [userContext, setUserContext] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) startRealGrading(file)
  }

  const startRealGrading = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, etc.)')
      return
    }

    setIsGrading(true)
    setError(null)
    setProgress(20)
    setStatus('Analyzing handwriting...')
    
    try {
      const result = await api.gradeHandwritten(
        file, 
        userContext || "Analyze the image and grade the answer.", 
        topic?.label || "General"
      )
      
      setProgress(60)
      setStatus('Evaluating logic structure...')
      
      setProgress(100)
      setStatus('Finalizing score...')
      
      setGradeResult(result)
      if (result.error) {
        setError(result.error);
        setIsGrading(false);
        return;
      }
      setIsGrading(false)
      setIsComplete(true)
    } catch (err: any) {
      console.error('Grading error:', err)
      setError(err.message || 'Failed to grade your answer. Please ensure the image is clear and try again.')
      setIsGrading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass p-10 rounded-[40px] border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-glow-teal">Handwritten <span className="text-white">Grader</span></h1>
          <p className="text-white/40 mt-3 font-bold uppercase tracking-widest text-[10px]">Llama-3.2-Vision Powered Cognitive Evaluation</p>
        </div>
        <div className="relative z-10 flex gap-4">
            <div className="px-4 py-2 glass border-white/10 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#00F5D4]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Link Active</span>
            </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-6 glass border-red-500/20 text-red-500 rounded-[24px]">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest leading-none">Grading Failed</p>
            <p className="text-[10px] mt-2 opacity-70 font-bold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-white/20 hover:text-white transition-colors">✕</button>
        </motion.div>
      )}

      {!isComplete ? (
        <div className="space-y-10">
          {/* Action Context Box */}
          {!isGrading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[32px] border-white/5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Question Description (Optional)</h3>
              </div>
              <textarea 
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="Describe the question or specific points you want the AI to look for... (e.g., Solve for x, explain historical context, etc.)"
                className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all resize-none font-medium"
              />
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest pl-2">
                Providing context helps the AI link your handwriting to the specific problem.
              </p>
            </motion.div>
          )}

          <Card className="glass-card rounded-[48px] border-dashed border-2 border-white/5 hover:border-primary/20 transition-all bg-white/[0.01] group relative overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-24 min-h-[500px]">
            {!isGrading ? (
              <div className="text-center space-y-10 relative z-10">
                <div className="flex justify-center gap-8">
                  <div className="w-24 h-24 glass border-white/10 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <UploadCloud className="w-10 h-10 text-primary animate-bounce-slow" />
                  </div>
                  <div className="w-24 h-24 glass border-white/10 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                    <Camera className="w-10 h-10 text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Upload Script for <span className="text-primary text-glow-teal">Processing</span></h3>
                  <p className="text-sm text-white/30 mx-auto max-w-sm mt-4 font-bold uppercase tracking-widest leading-relaxed">
                    Higher resolution images improve neural OCR accuracy.
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" className="bg-primary text-black font-black uppercase tracking-widest px-10 h-16 rounded-[24px] hover:scale-105 transition-all shadow-xl shadow-primary/20" onClick={() => fileInputRef.current?.click()}>Browse Drive</Button>
                  <Button size="lg" variant="ghost" className="glass border-white/10 text-white font-black uppercase tracking-widest px-10 h-16 rounded-[24px] hover:bg-white/5 transition-all" onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.capture = 'environment'
                    input.onchange = (e: any) => {
                      const file = e.target?.files?.[0]
                      if (file) startRealGrading(file)
                    }
                    input.click()
                  }}><Camera className="w-5 h-5 mr-3" /> Camera</Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-10 w-full max-w-lg relative z-10">
                <div className="mx-auto w-24 h-24 glass border-primary/20 rounded-full flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">{status}</h3>
                  <Progress value={progress} className="h-1 bg-white/5" />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{progress}% Neural Reconstruction</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8"
        >
          {/* Score Card */}
          <Card className="lg:col-span-1 glass-card rounded-[40px] border-white/10 bg-primary/5 flex flex-col items-center justify-center py-10 px-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary/40" />
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Cognitive Score</div>
            <div className="text-8xl font-black tracking-tighter text-primary relative">
                {gradeResult?.score}
                <span className="text-xl text-white/20 absolute -top-2 -right-6 font-bold">/10</span>
            </div>
            <div className="mt-8 text-[10px] font-black px-6 py-2 bg-primary text-black rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">Index: {gradeResult?.grade}</div>
            <Button className="w-full mt-10 h-14 rounded-2xl glass border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all" variant="ghost" onClick={() => setIsComplete(false)}>Repeat Cycle</Button>
          </Card>

          {/* Feedback Column */}
          <div className="lg:col-span-3 space-y-8">
            <Card className="glass-card rounded-[32px] border-white/5 shadow-xl relative group">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 py-8 px-8 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-emerald-500 italic">
                  <CheckCircle2 className="w-4 h-4" /> Strongest Signal
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 px-10">
                <div className="text-lg font-bold text-white/80 leading-relaxed tracking-tight select-none">
                  {gradeResult?.strengths}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-[32px] border-white/5 shadow-xl relative group">
              <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-4 py-8 px-8 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-orange-500 italic">
                  <AlertCircle className="w-4 h-4" /> Optimization Required
                </CardTitle>
              </CardHeader>
              <CardContent className="py-10 px-10">
                <div className="text-lg font-bold text-white/80 leading-relaxed tracking-tight select-none">
                  {gradeResult?.improvements}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">Validation Sequence</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gradeResult?.ai_reasoning?.map((step: string, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        whileInView={{ opacity: 1, scale: 1 }}
                        key={i} 
                        className="flex gap-4 p-6 glass rounded-[24px] border-white/5 hover:border-white/20 transition-all group"
                      >
                        <span className="font-black text-[10px] text-primary/40 bg-white/5 w-8 h-8 flex items-center justify-center rounded-xl shrink-0 tracking-tighter group-hover:text-primary transition-colors">0{i+1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/70 transition-colors leading-relaxed">{step}</span>
                      </motion.div>
                    ))}
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
