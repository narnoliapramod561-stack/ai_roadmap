import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UploadCloud, File, Network, PlayCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import { useStudyStore } from '@/stores/useStudyStore'
import { useUserStore } from '@/stores/useUserStore'

export const UploadPage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const setMaterial = useStudyStore(state => state.setMaterial)
  const setRoadmap = useStudyStore(state => state.setRoadmap)
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
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.')
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress(10)
    setStatus('Reading PDF content...')

    try {
      const result = await api.uploadMaterial(file, user?.id)
      setProgress(50)
      setStatus('AI analyzing syllabus...')
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90
          return prev + 1
        })
      }, 1000)

      setMaterial(result.material_id, result.analysis)
      setRoadmap(result.analysis.knowledge_graph.nodes)
      setUploadResult(result)
      
      clearInterval(interval)
      setProgress(100)
      setIsUploading(false)
      setIsComplete(true)
    } catch (err: any) {
      console.error("Upload Error:", err)
      setError(err.message || 'Failed to upload material. Please ensure your PDF is readable.')
      setStatus('Upload failed.')
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".pdf"
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📁 Upload Material</h1>
        <p className="text-muted-foreground mt-1">Drag and drop your syllabus or notes to generate a study system.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!isComplete ? (
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
                  <p className="text-sm text-muted-foreground mx-auto max-w-sm mt-2">
                    Drag and drop here, or browse your files. We support PDF (Max 50MB).
                  </p>
                </div>
                <Button size="lg" className="mt-4" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
              </div>
            ) : (
              <div className="text-center space-y-6 w-full max-w-md">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <File className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium animate-pulse">{status}</h3>
                  <Progress value={progress} className="h-3 shadow-inner" />
                </div>
                <p className="text-xs font-mono text-muted-foreground">{progress}% Complete</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-500/20">
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <File className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{uploadResult?.analysis?.total_topics} core topics extracted!</h3>
              <p className="text-sm">We've generated a full knowledge graph for your syllabus.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadResult?.analysis?.knowledge_graph?.nodes?.slice(0, 6).map((node: any) => (
              <Card key={node.id} className="shadow-md border-t-4 border-t-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded">
                      Difficulty: {node.difficulty}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{node.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                    <Link to="/map" className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Network className="w-3 h-3 mr-1" /> View Map
                      </Button>
                    </Link>
                    <Link to="/quiz" className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <PlayCircle className="w-3 h-3 mr-1" /> Quiz Me
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Link to="/map">
              <Button size="lg" className="gap-2">
                Explore Full Knowledge Map <Network className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

    </div>
  )
}
