import { useState, useCallback, useEffect } from 'react'
import { ReactFlow, Background, Controls, MarkerType, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { MessageSquare, PlayCircle, Repeat2, PenTool, Sparkles, Loader2 } from 'lucide-react'
import { useStudyStore } from '@/stores/useStudyStore'

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return { bg: 'rgba(0, 245, 212, 0.15)', text: '#00F5D4', border: '#00F5D4' }
  if (mastery >= 40) return { bg: 'rgba(185, 167, 255, 0.15)', text: '#B9A7FF', border: '#B9A7FF' }
  if (mastery > 0) return { bg: 'rgba(255, 0, 229, 0.1)', text: '#FF00E5', border: '#FF00E5' }
  return { bg: 'rgba(255, 255, 255, 0.03)', text: 'rgba(255, 255, 255, 0.4)', border: 'rgba(255, 255, 255, 0.1)' }
}

export const MapPage = () => {
  const storeRoadmap = useStudyStore(state => state.roadmap)
  const currentMaterial = useStudyStore(state => state.currentMaterial)
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (storeRoadmap.length > 0) {
      // Map store data to ReactFlow format
      const flowNodes = storeRoadmap.map((node: any, index: number) => {
        const colors = getMasteryColor(node.mastery || 0)
        return {
          id: node.id,
          position: node.position || { x: 300, y: index * 100 + 50 },
          data: { 
            label: node.label, 
            mastery: node.mastery || 0, 
            difficulty: node.difficulty || 'medium' 
          },
          style: { 
            background: colors.bg, 
            color: colors.text, 
            border: `1px solid ${colors.border}40`, 
            borderRadius: '16px', 
            fontWeight: '900', 
            padding: '14px 24px', 
            fontSize: '12px', 
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: `0 0 20px ${colors.border}20`,
            backdropFilter: 'blur(10px)'
          }
        }
      })

      const flowEdges = currentMaterial?.knowledge_graph?.edges?.map((edge: any) => ({
        ...edge,
        style: { stroke: '#ffffff20', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff20' }
      })) || []

      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [storeRoadmap, currentMaterial])

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Quantizing Knowledge Layers...</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Sparkles className="w-16 h-16 text-primary mb-6 animate-pulse" />
        <h2 className="text-4xl font-black uppercase italic tracking-tighter">No Syllabus <br /><span className="text-primary">Detected</span></h2>
        <p className="text-white/40 max-w-sm mt-4 mb-10 text-sm font-light">
          Upload your curriculum to generate the high-fidelity 3D Knowledge Map.
        </p>
        <Link to="/upload">
          <Button size="lg" className="bg-primary text-black font-black uppercase tracking-widest px-10 rounded-2xl h-16 hover:scale-105 transition-transform">Initialize Analysis</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] w-full relative">
      <div className="absolute top-6 left-6 z-10 glass p-6 rounded-[24px] border-white/5 shadow-2xl max-w-[280px]">
        <h2 className="font-black flex items-center gap-3 text-primary uppercase text-xs tracking-widest">
          <Sparkles className="w-4 h-4 text-glow-teal" /> Knowledge Map
        </h2>
        <p className="text-[9px] text-white/30 mt-3 font-bold uppercase tracking-widest leading-relaxed">
          Spatial concept visualization. Node intensity represents AI-validated mastery.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        className="bg-transparent"
      >
        <Background gap={30} size={1} color="rgba(0, 245, 212, 0.05)" />
        <Controls className="glass !border-white/10 !bg-transparent rounded-lg overflow-hidden" />
      </ReactFlow>

      {selectedNode && (
        <Card className="absolute top-6 right-6 z-10 w-80 glass-card rounded-[32px] border-white/10 animate-in slide-in-from-right duration-500 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
          <CardHeader className="pb-4 bg-white/[0.02] border-b border-white/5">
            <div className="flex justify-between items-start">
              <Badge className={`${selectedNode.data.difficulty === 'hard' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'} border-none text-[8px] font-black uppercase tracking-widest`}>
                {selectedNode.data.difficulty}
              </Badge>
              <button onClick={() => setSelectedNode(null)} className="text-white/20 hover:text-white transition-colors">✕</button>
            </div>
            <CardTitle className="text-xl pt-2 font-black tracking-tight">{selectedNode.data.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                <span>AI Mastery</span>
                <span className="text-primary">{selectedNode.data.mastery}%</span>
              </div>
              <Progress value={selectedNode.data.mastery} className="h-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link to={`/tutor/${selectedNode.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full h-10 text-[9px] font-black uppercase tracking-widest border-white/5 hover:bg-primary hover:text-black transition-all rounded-xl">
                  <MessageSquare className="w-3 h-3 mr-2" /> Explain
                </Button>
              </Link>
              <Link to={`/quiz/${selectedNode.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full h-10 text-[9px] font-black uppercase tracking-widest border-white/5 hover:bg-primary hover:text-black transition-all rounded-xl">
                  <PlayCircle className="w-3 h-3 mr-2" /> Quiz
                </Button>
              </Link>
              <Link to={`/planner/${selectedNode.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full h-10 text-[9px] font-black uppercase tracking-widest border-white/5 hover:bg-primary hover:text-black transition-all rounded-xl">
                  <Repeat2 className="w-3 h-3 mr-2" /> Guide
                </Button>
              </Link>
              <Link to={`/grader/${selectedNode.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full h-10 text-[9px] font-black uppercase tracking-widest border-white/5 hover:bg-primary hover:text-black transition-all rounded-xl">
                  <PenTool className="w-3 h-3 mr-2" /> Practice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
