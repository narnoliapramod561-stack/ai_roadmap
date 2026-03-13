import { useRef, useState } from 'react'
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const UploadPage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setMaterial, setRoadmap, setReadinessScore } = useStudyStore()
  const user = useUserStore(state => state.user)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) startRealUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) startRealUpload(file)
  }

  const startRealUpload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)
    setStatus('Uploading PDF...')

    // Start the progress animation BEFORE the await — Fix #3
    let currentProgress = 10
    setProgress(10)
    const ticker = setInterval(() => {
      currentProgress += Math.random() * 8
      if (currentProgress > 85) currentProgress = 85
      setProgress(Math.round(currentProgress))
      
      if (currentProgress < 30) setStatus('Uploading PDF...')
      else if (currentProgress < 50) setStatus('AI analyzing syllabus...')
      else if (currentProgress < 70) setStatus('Building knowledge graph...')
      else setStatus('Mapping topic dependencies...')
    }, 800)

    try {
      const result = await api.uploadMaterial(file, user?.id)

      // Clear the ticker AFTER the API call returns — Fix #3
      clearInterval(ticker)

      setProgress(100)
      setStatus('Analysis complete!')
      
      if (result.material_id && result.analysis) {
        setMaterial(result.material_id, result.analysis)
        
        const nodes = result.analysis?.knowledge_graph?.nodes || []
        setRoadmap(nodes) // This also auto-derives weakTopics and revisionQueue
        
        const avgMastery = nodes.length > 0 
          ? nodes.reduce((sum: number, n: any) => sum + (n.mastery || 0), 0) / nodes.length
          : 0
        setReadinessScore(Math.round(avgMastery))
      }
      
      setIsComplete(true)
    } catch (err: any) {
      clearInterval(ticker)
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed. Please try again.')
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📁 Upload Material</h1>
        <p className="text-muted-foreground mt-1">Drag and drop your syllabus or notes to generate a study system.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors bg-muted/10">
        <CardContent 
          className="flex flex-col items-center justify-center py-20 min-h-[400px]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!isUploading ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Upload PDF / Notes</h3>
                <p className="text-sm text-muted-foreground mx-auto max-w-sm mt-1">
                  Drag and drop here, or browse your files. We support PDF (Max 50MB).
                </p>
              </div>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" />
              <Button onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
            </div>
          ) : !isComplete ? (
            <div className="text-center space-y-6 w-full max-w-md">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium animate-pulse">{status}</h3>
                <Progress value={progress} className="h-3 shadow-inner" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">{progress}% Complete</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-600">Analysis Complete!</h3>
              <p className="text-sm text-muted-foreground">Your knowledge map has been generated. Visit the Map page to explore.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.href = '/map'}>View Knowledge Map</Button>
                <Button variant="outline" onClick={() => {
                  setIsComplete(false)
                  setIsUploading(false)
                  setProgress(0)
                }}>Upload Another</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
