import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User as UserIcon, BookOpen, GraduationCap, ArrowRight, Sparkles, Upload, File as FileIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useUserStore } from '@/stores/useUserStore'
import { useStudyStore } from '@/stores/useStudyStore'
import { api } from '@/lib/api'

const steps = [
  { id: 1, label: 'Your Name', icon: UserIcon, placeholder: 'e.g. Subham' },
  { id: 2, label: 'Your Class', icon: GraduationCap, placeholder: 'e.g. Class 12, BTech 2nd Year' },
  { id: 3, label: 'Primary Subject', icon: BookOpen, placeholder: 'e.g. Physics, Data Structures' },
]

export const AuthPage = () => {
  const navigate = useNavigate()
  const setUser = useUserStore(state => state.setUser)
  const { setMaterial, setRoadmap, setReadinessScore } = useStudyStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ firstName: '', className: '', subject: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentValue = currentStep === 0 ? formData.firstName : currentStep === 1 ? formData.className : formData.subject

  const handleNext = () => {
    if (!currentValue.trim()) return
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.pdf')) {
      setSelectedFile(file)
      setError(null)
    } else if (file) {
      setError('Please select a PDF file.')
    }
  }

  const handleSubmit = async () => {
    if (!formData.subject.trim()) return
    setIsLoading(true)
    setError(null)

    // Save user data FIRST — Fix: persist immediately before long AI task
    const userId = crypto.randomUUID()
    setUser({
      id: userId,
      email: '',
      firstName: formData.firstName,
      className: formData.className,
      subject: formData.subject,
    })

    // If a file is selected, try uploading it
    if (selectedFile) {
      try {
        const result = await api.uploadMaterial(selectedFile, userId)
        
        if (result.material_id && result.analysis) {
          setMaterial(result.material_id, result.analysis)
          const nodes = result.analysis?.knowledge_graph?.nodes || []
          setRoadmap(nodes)
          const avgMastery = nodes.length > 0 
            ? nodes.reduce((sum: number, n: any) => sum + (n.mastery || 0), 0) / nodes.length
            : 0
          setReadinessScore(Math.round(avgMastery))
        }
        
        navigate('/dashboard')
      } catch (err: any) {
        // Fix #9: Show error message instead of silent failure
        console.error('Upload failed during onboarding:', err)
        setError(err.message || 'Syllabus upload failed, but your profile is saved.')
        // Wait 3 seconds so user sees the error, then redirect
        setTimeout(() => navigate('/dashboard'), 3000)
      }
    } else {
      // No file selected — just go to dashboard
      navigate('/dashboard')
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Setting up your AI study system...</h2>
            <p className="text-muted-foreground mt-2">
              {selectedFile ? 'Analyzing your syllabus with Gemini AI...' : 'Configuring your dashboard...'}
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-600 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error} Redirecting to dashboard...</span>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg space-y-8">
        
        {/* Progress */}
        <div className="flex justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
              i <= currentStep ? 'text-primary' : 'text-muted-foreground/40'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                i < currentStep ? 'bg-primary text-primary-foreground border-primary' :
                i === currentStep ? 'border-primary text-primary' : 'border-muted-foreground/20'
              }`}>
                {i < currentStep ? '✓' : s.id}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        <Card className="shadow-2xl border-primary/10 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center space-y-2">
                  {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-10 h-10 text-primary mx-auto" /> })()}
                  <h2 className="text-2xl font-bold">{steps[currentStep].label}</h2>
                </div>
                
                <Input 
                  placeholder={steps[currentStep].placeholder}
                  value={currentValue}
                  onChange={(e) => {
                    const val = e.target.value
                    if (currentStep === 0) setFormData({ ...formData, firstName: val })
                    else if (currentStep === 1) setFormData({ ...formData, className: val })
                    else setFormData({ ...formData, subject: val })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (currentStep < steps.length - 1) handleNext()
                      else handleSubmit()
                    }
                  }}
                  className="h-14 text-lg text-center bg-background/50 border-primary/20 focus-visible:ring-primary/30"
                  autoFocus
                />
                
                {/* Step 3: Optional file upload */}
                {currentStep === 2 && (
                  <div className="pt-2">
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
                        className="w-full h-12 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                        Add Syllabus PDF (Optional)
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIcon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{selectedFile.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-xs shrink-0">Remove</Button>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <Button 
              className="w-full h-14 text-lg gap-2 shadow-lg shadow-primary/20" 
              onClick={currentStep < steps.length - 1 ? handleNext : handleSubmit}
              disabled={!currentValue.trim()}
            >
              {currentStep < steps.length - 1 ? (
                <>Continue <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>{selectedFile ? 'Analyze & Finish' : 'Finish Setup'} <Sparkles className="w-5 h-5" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
