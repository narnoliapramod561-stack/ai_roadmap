import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Network, Sparkles, ChevronRight, Play, Cpu, Globe, BrainCircuit, ShieldCheck, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import * as THREE from 'three'

// 3D Iridescent Constellation
const Constellation = () => {
  const pointsRef = useRef<THREE.Points>(null!)
  const linesRef = useRef<THREE.LineSegments>(null!)
  const { mouse } = useThree()
  const count = 400
  
  const [positions, linePositions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const linePos = []
    const cols = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20

      // Iridescent color palette
      const mix = Math.random()
      if (mix > 0.6) {
        cols[i * 3] = 0 // R (Cyan-ish)
        cols[i * 3 + 1] = 0.96 // G
        cols[i * 3 + 2] = 0.83 // B
      } else {
        cols[i * 3] = 0.44 // R (Purple-ish)
        cols[i * 3 + 1] = 0 // G
        cols[i * 3 + 2] = 1 // B
      }
    }

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pos[i*3] - pos[j*3]
        const dy = pos[i*3+1] - pos[j*3+1]
        const dz = pos[i*3+2] - pos[j*3+2]
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz)
        if (dist < 3) {
          linePos.push(pos[i*3], pos[i*3+1], pos[i*3+2])
          linePos.push(pos[j*3], pos[j*3+1], pos[j*3+2])
        }
      }
    }

    return [pos, new Float32Array(linePos), cols]
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * 0.03
    pointsRef.current.rotation.z = Math.sin(time * 0.2) * 0.05
    
    linesRef.current.rotation.y = time * 0.03
    linesRef.current.rotation.z = Math.sin(time * 0.2) * 0.05

    pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, mouse.x * 3, 0.05)
    pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, mouse.y * 3, 0.05)
    linesRef.current.position.x = pointsRef.current.position.x
    linesRef.current.position.y = pointsRef.current.position.y
  })

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-position" count={linePositions.length / 3} array={linePositions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#00F5D4" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  )
}

export const LandingPage = () => {
  const { scrollY } = useScroll()
  const yHero = useTransform(scrollY, [0, 500], [0, -150])
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-x-hidden selection:bg-primary/40 flex flex-col items-center">
      {/* 3D THEATER BACKDROP */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020205]/80 to-[#020205] z-10" />
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <color attach="background" args={['#020205']} />
          <fog attach="fog" args={['#020205', 5, 25]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} color="#00F5D4" intensity={2} />
          <Constellation />
        </Canvas>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes iridescent-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .text-iridescent {
          background: linear-gradient(90deg, #00F5D4, #7000FF, #FF00E5, #00F5D4);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: iridescent-shimmer 8s linear infinite;
        }
        .glass-theater {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
        }
        .digital-border {
          position: relative;
        }
        .digital-border::after {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,212,0.5), transparent);
          z-index: -1;
          border-radius: inherit;
        }
      `}} />

      {/* NAVIGATION */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-6">
        <div className="glass-theater py-4 px-10 rounded-full flex items-center justify-between digital-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary rounded-lg rotate-45 group-hover:rotate-0 transition-transform duration-500 shadow-[0_0_20px_#00F5D4]" />
            <span className="font-black text-xl tracking-[0.2em] italic">SMARTSCHOLAR</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">
            <a href="#features" className="hover:text-primary transition-all hover:tracking-[0.6em]">Features</a>
            <a href="#theater" className="hover:text-primary transition-all hover:tracking-[0.6em]">Digital Theater</a>
            <Link to="/auth" className="text-primary hover:opacity-80 transition-all underline decoration-primary/30 underline-offset-8">Login Portal</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-64 pb-32 px-6 w-full max-w-7xl">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="text-center space-y-20">
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full glass-theater border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.5em] mb-4 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Ultra-Speed Groq Engine Active
          </div>

          <h1 className="text-6xl md:text-[140px] font-black tracking-tighter leading-[0.8] uppercase italic">
            STUDY AT THE <br />
            <span className="text-iridescent">SPEED OF THOUGHT</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/40 max-w-4xl mx-auto leading-relaxed font-black uppercase tracking-widest opacity-80 italic">
            Transform static syllabi into interactive 3D knowledge graphs. <br />
            Powered by <span className="text-white">Groq</span>, delivered in sub-second inference. <br />
            <span className="text-white/60">The future of learning is iridescent.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
            <Link to="/auth" className="group relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/40 transition duration-700" />
              <Button className="relative w-full sm:w-80 h-20 bg-primary text-black hover:scale-105 transition-all rounded-2xl font-black text-xl uppercase tracking-widest border border-white/20">
                START SCANNING <ChevronRight className="ml-2 w-7 h-7" />
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full sm:w-72 h-20 text-white/40 hover:text-white hover:bg-transparent rounded-2xl font-black text-xl tracking-[0.3em] uppercase transition-all">
              <Play className="mr-3 w-6 h-6 fill-current" /> WATCH DEMO
            </Button>
          </div>
        </motion.div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="features" className="relative z-10 py-48 px-8 w-full max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Network, title: '3D Knowledge Map', desc: 'Your entire curriculum visualized as a glowing constellation of interconnected nodes.' },
            { icon: Cpu, title: 'Groq-Speed AI', desc: 'Sub-second response times for syllabus analysis and quiz generation. Zero lag.' },
            { icon: BrainCircuit, title: 'Vision Grader', desc: 'Grade handwritten long-form answers instantly with Llama 4 Scout multimodal vision.' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              className="glass-theater p-12 rounded-[50px] transition-all group hover:bg-primary/5 hover:border-primary/20"
            >
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-10 border border-white/5 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_#00F5D420]">
                <feature.icon className="w-10 h-10 text-primary group-hover:animate-pulse" />
              </div>
              <h3 className="text-3xl font-black mb-6 tracking-tighter uppercase italic">{feature.title}</h3>
              <p className="text-white/30 text-lg font-bold leading-relaxed uppercase tracking-tighter">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* THEATER EXPERIENCE */}
      <section id="theater" className="relative z-10 py-64 px-8 w-full flex justify-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-7xl w-full">
            <div className="glass-theater rounded-[80px] p-1 border-white/5">
                <div className="bg-[#020205]/60 rounded-[79px] p-12 md:p-32 relative overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/10 blur-[180px] rounded-full animate-pulse" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center relative z-10">
                        <div className="space-y-12">
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-theater border-primary/30 text-primary text-[10px] font-black tracking-[0.5em] uppercase">
                                Digital Theater Experience
                            </div>
                            <h2 className="text-6xl md:text-9xl font-black italic uppercase leading-[0.85] tracking-tighter">
                                The <span className="text-iridescent">Intelligence</span> <br /> Layer
                            </h2>
                            <p className="text-2xl text-white/30 leading-relaxed font-black uppercase tracking-widest italic pr-10">
                                SmartScholar doesn't just store data; it projects it. Our 3D theater interface creates a spatial memory environment that makes complex topics stick 4x faster.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8">
                                {[
                                    { label: 'Latency', val: '400ms' },
                                    { label: 'Model', val: 'Llama 3.3' },
                                    { label: 'Context', val: '128k' },
                                    { label: 'Precision', val: 'High-Fi' }
                                ].map((stat, i) => (
                                    <div key={i} className="glass-theater p-8 rounded-3xl border-white/5 group hover:border-primary/20 transition-all">
                                        <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2">{stat.label}</div>
                                        <div className="text-3xl font-black text-primary italic tracking-tighter">{stat.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full" />
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                              className="relative w-full aspect-square max-w-[500px] border-2 border-dashed border-primary/20 rounded-full flex items-center justify-center p-10"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary shadow-[0_0_20px_#00F5D4] rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-[#7000FF] shadow-[0_0_20px_#7000FF] rounded-full" />
                                
                                <div className="w-full h-full glass-theater rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                                    <Sparkles className="w-32 h-32 text-primary animate-pulse" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* FOOTER METADATA */}
      <footer className="relative z-10 w-full py-32 px-12 border-t border-white/5 bg-[#020205] backdrop-blur-3xl overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-20">
          <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-primary rounded-xl rotate-45 flex items-center justify-center shadow-[0_0_30px_#00F5D4]">
                <Globe className="w-6 h-6 text-black" />
              </div>
              <span className="font-black text-4xl tracking-[0.3em] uppercase italic">SMARTSCHOLAR.AI</span>
            </div>
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.8em]">The High-Frequency Study Platform</p>
          </div>
          
          <div className="w-full h-[1px] bg-white/5" />
          
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-10">
            <div className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] italic text-center md:text-left">
              Digital Theater v4.0 // [GROQ_ENABLED] // [3D_SYLLABUS_ENGINE]
            </div>

            <div className="flex gap-16 opacity-20 hover:opacity-100 transition-all duration-700 grayscale hover:grayscale-0">
               <Rocket className="w-7 h-7 hover:text-primary cursor-pointer transition-transform hover:-translate-y-2" />
               <ShieldCheck className="w-7 h-7 hover:text-primary cursor-pointer transition-transform hover:-translate-y-2" />
               <Globe className="w-7 h-7 hover:text-primary cursor-pointer transition-transform hover:-translate-y-2" />
            </div>
            
            <div className="text-[10px] text-white/10 font-black uppercase tracking-widest leading-loose">
              © 2026 COGNITIVE SYSTEMS <br />
              NEURAL INTERFACE: ACTIVE
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
