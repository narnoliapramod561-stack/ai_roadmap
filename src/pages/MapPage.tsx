import { useState, useCallback } from 'react'
import { ReactFlow, Background, Controls, MarkerType, useNodesState, useEdgesState } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Link } from 'react-router-dom'
import { MessageSquare, PlayCircle, Repeat2, PenTool, Sparkles } from 'lucide-react'

const initialNodes = [
  { id: '1', position: { x: 300, y: 20 },  data: { label: 'Electromagnetic Theory', mastery: 65, difficulty: 'hard' },   style: { background: '#fef08a', color: '#854d0e', border: '2px solid #eab308', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '2', position: { x: 80, y: 160 },  data: { label: 'Maxwell Equations', mastery: 42, difficulty: 'hard' },         style: { background: '#fecaca', color: '#991b1b', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '3', position: { x: 520, y: 160 }, data: { label: 'Gauss Law', mastery: 85, difficulty: 'medium' },               style: { background: '#bbf7d0', color: '#166534', border: '2px solid #22c55e', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '4', position: { x: 80, y: 310 },  data: { label: 'Ampere Law', mastery: 30, difficulty: 'hard' },                style: { background: '#fecaca', color: '#991b1b', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '5', position: { x: 300, y: 310 }, data: { label: 'Faraday\'s Law', mastery: 0, difficulty: 'hard' },             style: { background: '#f3f4f6', color: '#374151', border: '2px solid #9ca3af', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '6', position: { x: 520, y: 310 }, data: { label: 'Electric Potential', mastery: 72, difficulty: 'medium' },      style: { background: '#bbf7d0', color: '#166534', border: '2px solid #22c55e', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '7', position: { x: 80, y: 460 },  data: { label: 'Biot-Savart Law', mastery: 15, difficulty: 'hard' },           style: { background: '#fecaca', color: '#991b1b', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '8', position: { x: 300, y: 460 }, data: { label: 'Wave Equations', mastery: 0, difficulty: 'hard' },             style: { background: '#f3f4f6', color: '#374151', border: '2px solid #9ca3af', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
  { id: '9', position: { x: 520, y: 460 }, data: { label: 'Capacitance', mastery: 88, difficulty: 'easy' },               style: { background: '#bbf7d0', color: '#166534', border: '2px solid #22c55e', borderRadius: '12px', fontWeight: 'bold', padding: '12px 20px', fontSize: '14px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }},
]

const initialEdges = [
  { id:'e1-2', source:'1', target:'2', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e1-3', source:'1', target:'3', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e2-4', source:'2', target:'4', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e2-5', source:'2', target:'5', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e3-6', source:'3', target:'6', animated: true },
  { id:'e4-7', source:'4', target:'7', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e5-8', source:'5', target:'8', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e6-9', source:'6', target:'9', markerEnd:{type:MarkerType.ArrowClosed} },
  { id:'e3-5', source:'3', target:'5', markerEnd:{type:MarkerType.ArrowClosed}, strokeDasharray: '5,5' },
]

export const MapPage = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<any>(null)

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node)
  }, [])

  return (
    <div className="h-[calc(100vh-100px)] w-full relative">
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-primary/20 shadow-lg max-w-[240px]">
        <h2 className="font-bold flex items-center gap-2 text-primary">
          <Sparkles className="w-4 h-4" /> Smart Knowledge Map
        </h2>
        <p className="text-[10px] text-muted-foreground mt-1">
          Each node is a concept extracted from your syllabus. Color shows current AI mastery.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        className="bg-muted/10"
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <Card className="absolute top-4 right-4 z-10 w-80 shadow-2xl border-primary/20 animate-in slide-in-from-right duration-300">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex justify-between items-start">
              <Badge variant={selectedNode.data.difficulty === 'hard' ? 'destructive' : 'secondary'}>
                {selectedNode.data.difficulty.toUpperCase()}
              </Badge>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <CardTitle className="text-lg pt-2">{selectedNode.data.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>AI Mastery</span>
                <span className="text-primary">{selectedNode.data.mastery}%</span>
              </div>
              <Progress value={selectedNode.data.mastery} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/tutor" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <MessageSquare className="w-3 h-3 mr-2" /> Explain
                </Button>
              </Link>
              <Link to="/quiz" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <PlayCircle className="w-3 h-3 mr-2" /> Quiz
                </Button>
              </Link>
              <Link to="/revision" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <Repeat2 className="w-3 h-3 mr-2" /> Review
                </Button>
              </Link>
              <Link to="/grader" className="w-full">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs font-bold border-primary/20 hover:bg-primary/5">
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
