import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UploadCloud, File, Network, PlayCircle, Calendar, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export const UploadPage = () => {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    startUploadMock()
  }

  const startUploadMock = () => {
    setIsUploading(true)
    let p = 0
    const interval = setInterval(() => {
      p += 2
      setProgress(p)

      if (p < 30) setStatus('Extracting topics from PDF...')
      else if (p < 60) setStatus('Mapping syllabus structure...')
      else if (p < 90) setStatus('Building knowledge graph...')
      else setStatus('Finalizing adaptive roadmap...')

      if (p >= 100) {
        clearInterval(interval)
        setIsUploading(false)
        setIsComplete(true)
      }
    }, 50)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📁 Upload Material</h1>
        <p className="text-muted-foreground mt-1">Drag and drop your syllabus or notes to generate a study system.</p>
      </div>

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
                    Drag and drop here, or browse your files. We support PDF, DOCX, and TXT (Max 50MB).
                  </p>
                </div>
                <Button size="lg" className="mt-4" onClick={startUploadMock}>Browse Files</Button>
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
              <h3 className="font-semibold">Electromagnetic Theory.pdf processed!</h3>
              <p className="text-sm">We generated 3 core topics and 12 subtopics.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Generated Topic Card */}
            <Card className="shadow-md border-t-4 border-t-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded dark:bg-orange-500/20 dark:text-orange-400">
                    Difficulty: Hard
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">3 Subtopics</div>
                </div>
                <CardTitle className="text-lg">Electromagnetic Theory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Maxwell Equations</li>
                  <li>Gauss Law</li>
                  <li>Ampere Law</li>
                </ul>
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
                  <Link to="/planner" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Calendar className="w-3 h-3 mr-1" /> Add Plan
                    </Button>
                  </Link>
                  <Link to="/grader" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <PenTool className="w-3 h-3 mr-1" /> Practice
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
