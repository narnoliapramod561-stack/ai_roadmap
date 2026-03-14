import { useState, useCallback, useEffect } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  BackgroundVariant,
  Handle, 
  Position, 
  BaseEdge, 
  getBezierPath 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { MessageSquare, PlayCircle, Repeat2, PenTool, Sparkles, Loader2, Brain, Zap } from 'lucide-react'
import { useStudyStore } from '@/stores/useStudyStore'
import { useAppSync } from '@/stores/useAppSync'
import { usePlannerStore } from '@/stores/usePlannerStore'
import { useUserStore } from '@/stores/useUserStore'
import { api } from '@/lib/api'

const getMasteryColor = (mastery: number) => {
  if (mastery >= 80) return { bg: 'rgba(0, 245, 212, 0.15)', text: '#00F5D4', border: '#00F5D4', shadow: 'rgba(0, 245, 212, 0.4)' }
  if (mastery >= 40) return { bg: 'rgba(185, 167, 255, 0.15)', text: '#B9A7FF', border: '#B9A7FF', shadow: 'rgba(185, 167, 255, 0.4)' }
  if (mastery > 0) return { bg: 'rgba(255, 0, 229, 0.1)', text: '#FF00E5', border: '#FF00E5', shadow: 'rgba(255, 0, 229, 0.3)' }
  return { bg: 'rgba(255, 255, 255, 0.03)', text: 'rgba(255, 255, 255, 0.4)', border: 'rgba(255, 255, 255, 0.1)', shadow: 'transparent' }
}

// --- Custom Node Component ---
const KnowledgeNode = ({ data, selected }: any) => {
  const colors = getMasteryColor(data.mastery || 0)
  const radius = 65 // Increased radius
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (data.mastery / 100) * circumference

  // 3D Tilt Effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div 
      className={`relative group transition-all duration-300 w-56 h-56 flex items-center justify-center`}
      style={{ perspective: 1000, zIndex: selected ? 50 : 1 }}
      animate={{ 
        scale: selected ? 1.15 : 1,
        y: [0, -10, 0] // Breathing animation
      }}
      transition={{
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        scale: { duration: 0.3 }
      }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-0 overflow-visible drop-shadow-2xl">
          <circle
            cx="112" // Half of w-56 (224px / 2)
            cy="112"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="6"
          />
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="transparent"
            stroke={colors.border}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 12px ${colors.shadow})` }}
          />
        </svg>

        <div 
          className="relative z-10 glass-card px-8 py-6 rounded-[32px] border border-white/10 flex flex-col items-center justify-center min-w-[180px] min-h-[140px] text-center shadow-2xl overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.01))`,
            backdropFilter: 'blur(24px)',
            transform: "translateZ(30px)" // Pop out effect
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-20">
            <div className="flex items-center gap-2 mb-2 justify-center">
               {data.mastery >= 80 ? (
                 <Zap className="w-4 h-4 text-primary animate-pulse" />
               ) : (
                 <Brain className="w-4 h-4 text-white/20" />
               )}
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Topic Node</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-white mb-3 max-w-[150px] leading-tight italic drop-shadow-lg">
              {data.label}
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <div 
                   className="h-full bg-primary" 
                   style={{ width: `${data.mastery}%`, transition: 'width 1s ease', boxShadow: '0 0 10px #00F5D4' }} 
                 />
              </div>
              <span className="text-[10px] font-black text-primary">{data.mastery}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      <Handle type="target" position={Position.Top} className="opacity-0 w-8 h-8 -top-4" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-8 h-8 -bottom-4" />
    </motion.div>
  )
}

// --- Custom Edge Component ---
const NeuralEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
}: any) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
      <circle r="3" fill="#00F5D4" className="neural-pulse">
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
    </>
  )
}

const nodeTypes = {
  knowledge: KnowledgeNode
}

const edgeTypes = {
  neural: NeuralEdge
}

export const MapPage = () => {
  const storeRoadmap = useStudyStore(state => state.roadmap)
  const currentMaterial = useStudyStore(state => state.currentMaterial)
  const materials = useStudyStore(state => state.materials)
  const setMaterial = useStudyStore(state => state.setMaterial)
  const setRoadmap = useStudyStore(state => state.setRoadmap)
  const currentUser = useUserStore((state: any) => state.user)
  
  const { strongAreas } = useAppSync()
  const tasks = usePlannerStore(state => state.tasks)
  const learnedTopics = usePlannerStore(state => state.learnedTopics)
  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch materials if not present
  useEffect(() => {
    const loadMaterials = async () => {
      if (currentUser?.id && materials.length === 0) {
        try {
          const list = await api.listMaterials(currentUser.id)
          useStudyStore.getState().setMaterials(list || [])
        } catch (e) {
          console.error("Failed to fetch materials for map:", e)
        }
      }
    }
    loadMaterials()
  }, [currentUser?.id, materials.length])

  // Auto-select first material if none selected
  useEffect(() => {
    const autoSelect = async () => {
      if (currentMaterial || materials.length === 0) {
        if (!currentMaterial && materials.length === 0) {
            setIsLoading(false)
        }
        return
      }

      const first = materials[0]
      setIsLoading(true)
      try {
        const data = await api.getRoadmap(first.id, currentUser?.id)
        setMaterial(first.id, { ...first, edges: data.edges }) // Store edges in material
        setRoadmap(data.nodes || [])
      } catch (err) {
        console.error("Auto-select map failed:", err)
      } finally {
        setIsLoading(false)
      }
    }
    autoSelect()
  }, [currentMaterial, materials, currentUser?.id])

  useEffect(() => {
    if (storeRoadmap.length > 0) {
      const flowNodes = storeRoadmap.map((node: any, index: number) => {
        let dynamicMastery = node.mastery || 0
        const isStrong = strongAreas.includes(node.label)
        const isLearned = learnedTopics.some(t => t.topic_label === node.label)
        
        if (isStrong || isLearned) {
          dynamicMastery = 100
        } else {
          const activeTask = tasks.find(t => t.title.includes(node.label))
          if (activeTask) {
            if (activeTask.is_completed) {
              dynamicMastery = 100
            } else if (activeTask.subtopics && activeTask.subtopics.length > 0) {
              const doneSubtopics = activeTask.subtopics.filter(s => s.is_completed).length
              dynamicMastery = Math.max(dynamicMastery, Math.round((doneSubtopics / activeTask.subtopics.length) * 100))
            }
          }
        }

        // Increase the spacing between nodes for the larger sizes
        return {
          id: node.id,
          type: 'knowledge',
          position: node.position ? { x: node.position.x * 1.5, y: node.position.y * 1.5 } : { x: 300, y: index * 240 + 100 },
          data: { 
            label: node.label, 
            mastery: dynamicMastery, 
            difficulty: node.difficulty || 'medium' 
          },
        }
      })

      const flowEdges = (currentMaterial?.knowledge_graph?.edges || currentMaterial?.edges || []).map((edge: any) => ({
        ...edge,
        type: 'neural',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00F5D440' }
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [storeRoadmap, currentMaterial, strongAreas, tasks, learnedTopics])

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

  const showEmptyState = nodes.length === 0 && !isLoading

  return (
    <div className="h-[calc(100vh-140px)] w-full relative">
      <div className="absolute top-6 left-6 z-20 space-y-4 max-w-[300px]">
        <div className="glass p-6 rounded-[24px] border-white/5 shadow-2xl">
          <h2 className="font-black flex items-center gap-3 text-primary uppercase text-xs tracking-widest">
            <Sparkles className="w-4 h-4 text-glow-teal" /> Knowledge Map
          </h2>
          <p className="text-[9px] text-white/30 mt-3 font-bold uppercase tracking-widest leading-relaxed">
            Spatial concept visualization. Node intensity represents AI-validated mastery.
          </p>
        </div>

        {/* Subject Selector */}
        <div className="glass p-4 rounded-[20px] border-white/5 shadow-xl max-h-[400px] overflow-y-auto custom-scrollbar">
          <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-3 block px-1 sticky top-0 bg-transparent backdrop-blur-md pb-2">Your Subjects</label>
          <div className="grid grid-cols-1 gap-2">
            {materials.map((m: any) => (
              <button
                key={m.id}
                onClick={async () => {
                  if (currentMaterial?.id === m.id) return
                  setIsLoading(true)
                  try {
                    const data = await api.getRoadmap(m.id, currentUser?.id)
                    setMaterial(m.id, { ...m, edges: data.edges }) // Sync edges
                    setRoadmap(data.nodes || [])
                  } catch (err) {
                    console.error("Map subject switch failed:", err)
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className={`text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all text-left truncate group flex items-center justify-between ${
                  currentMaterial?.id === m.id 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-white/40 hover:bg-white/5 border border-transparent hover:text-white'
                }`}
              >
                <span className="truncate pr-2">
                  {m.subject_name || m.subject || m.file_name?.split('.')[0] || 'Untitled Concept'}
                </span>
                {currentMaterial?.id === m.id && <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00F5D4]" />}
              </button>
            ))}
            {materials.length === 0 && (
              <Link to="/upload" className="w-full">
                <Button variant="ghost" className="w-full py-6 border-dashed border border-white/10 text-[8px] font-black uppercase">Upload Syllabus</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {showEmptyState ? (
         <div className="flex flex-col items-center justify-center h-full text-center px-6 relative z-0">
          <Sparkles className="w-16 h-16 text-primary mb-6 animate-pulse" />
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">No Syllabus <br /><span className="text-primary">Detected</span></h2>
          <p className="text-white/40 max-w-sm mt-4 mb-10 text-sm font-light">
            Upload your curriculum or select a subject from the sidebar to generate the high-fidelity Knowledge Map.
          </p>
          <Link to="/upload">
            <Button size="lg" className="bg-primary text-black font-black uppercase tracking-widest px-10 rounded-2xl h-16 hover:scale-105 transition-transform">Forge New Material</Button>
          </Link>
        </div>
      ) : (
        <>
          <style>{`
            .neural-pulse { filter: drop-shadow(0 0 4px #00F5D4); }
            .text-glow-teal { text-shadow: 0 0 10px rgba(0, 245, 212, 0.5); }
          `}</style>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={1.5}
            className="bg-transparent"
          >
            <Background gap={60} size={1} color="rgba(0, 245, 212, 0.05)" variant={BackgroundVariant.Lines} />
            <Controls className="glass !border-white/10 !bg-transparent rounded-lg overflow-hidden" />
          </ReactFlow>
        </>
      )}

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
              <Link to={`/tutor?topicId=${selectedNode.id}&explain=${encodeURIComponent(selectedNode.data.label)}`} className="w-full">
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
