import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, ArrowRight, Sparkles, Upload, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'
import { api } from '@/lib/api'

export const AuthPage = () => {
  const [formData, setFormData] = useState({
    firstName: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)
  const clearAllData = useUserStore((state) => state.clearAllData)
  const setMaterial = useStudyStore((state) => state.setMaterial)
  const setRoadmap = useStudyStore((state) => state.setRoadmap)
  const addMaterial = useStudyStore((state) => state.addMaterial)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
    } else if (file) {
      setError('Please upload a valid PDF file.')
    }
  }

  const handleSubmit = async () => {
    if (!formData.firstName) return
    
    // Clear old data first
    clearAllData()
    
    setIsLoading(true)
    setError(null)
    setStatus('Forging your academic identity...')

    try {
      const userId = 'user_' + Math.random().toString(36).substr(2, 9)
      const userObj = {
        id: userId,
        email: 'user@smartscholar.ai',
        firstName: formData.firstName
      }
      setUser(userObj)

      if (selectedFile) {
        setStatus('Neural network parsing your syllabus...')
        setStatus('Analyzing syllabus...')
        try {
          const result = await api.uploadMaterial(selectedFile, userId, 'Initial Syllabus')
          setMaterial(result.material_id, result.analysis)
          setRoadmap(result.analysis.knowledge_graph.nodes)
          
          addMaterial({
            id: result.material_id,
            filename: selectedFile.name,
            subject_name: 'Initial Syllabus',
            created_at: new Date().toISOString()
          })
        } catch (uploadError: any) {
          console.error("Optional upload failed:", uploadError)
          setError(`Profile created, but syllabus upload failed: ${uploadError.message || 'Unknown error'}. You can upload it later in the dashboard.`)
          setStatus('Syllabus upload failed.')
          
          setTimeout(() => {
            setIsLoading(false)
            navigate('/dashboard')
          }, 4000)
          return
        }
      }

      setStatus('Success! Opening dashboard...')
      setTimeout(() => {
        setIsLoading(false)
        navigate('/dashboard')
      }, 800)

    } catch (err: any) {
      setError(err.message || 'Something went wrong during setup.')
      setIsLoading(false)
    }
  }

  const stepContent = [
    {
      id: 1,
      title: "What's your name?",
      subtitle: "Let's personalize your AI experience.",
      icon: <UserIcon className="w-8 h-8 text-primary" />,
      field: (
        <div className="space-y-8 w-full">
          <Input
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="h-16 text-xl text-center bg-background/50 border-primary/20 focus-visible:ring-primary/30 rounded-2xl"
            autoFocus
          />
          
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-primary/10" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Optional Cognitive Link</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>

            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!selectedFile ? (
              <Button 
                variant="outline" 
                type="button"
                className="w-full h-14 border-dashed border-primary/10 hover:border-primary/40 hover:bg-primary/5 group rounded-[18px] transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Syllabus PDF</span>
                  </div>
                </div>
              </Button>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileIcon className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-tight truncate w-32">{selectedFile.name}</span>
                    <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">PDF Material Loaded</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <span className="text-[10px] font-black uppercase text-red-500/50 hover:text-red-500">Remove</span>
                </button>
              </div>
            )}
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
              Uploading a syllabus allows the AI to architect your personalized roadmap instantly.
            </p>
          </div>
        </div>
      ),
      isValid: formData.firstName.length > 1
    }
  ]

  const currentStep = stepContent[0]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background text-foreground text-glow-teal">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase italic">
            Smart<span className="text-primary">Scholar</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Setting up your AI educational brain</p>
        </div>

        <Card className="border-primary/10 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl rounded-[40px] overflow-hidden">
          <CardContent className="pt-12 pb-10 px-10 flex flex-col items-center">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center space-y-6 w-full">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black uppercase italic tracking-tight">{status}</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Cognitive Layer Construction in Progress...</p>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={1}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full space-y-8 text-center"
                  >
                    <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10 shadow-xl">
                      {currentStep.icon}
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic">{currentStep.title}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{currentStep.subtitle}</p>
                    </div>

                    <div className="w-full">
                      {currentStep.field}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <p className="mt-4 text-xs text-destructive font-bold bg-destructive/10 px-3 py-2 rounded-lg w-full text-center">
                    {error}
                  </p>
                )}

                <div className="w-full mt-10">
                  <Button 
                    size="lg" 
                    className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-[20px]"
                    onClick={handleSubmit}
                    disabled={!currentStep.isValid || isLoading}
                  >
                    {selectedFile ? 'Forging Roadmap' : 'Initialize Brain'} 
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
