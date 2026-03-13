import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Network, Sparkles, ChevronRight, Cpu, Globe, BrainCircuit, ShieldCheck, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import * as THREE from 'three'

// --- 1. 3D Iridescent Crystal Core ---
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  uniform float uTime;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float fresnelTerm = dot(viewDir, normal);
    fresnelTerm = clamp(1.0 - fresnelTerm, 0.0, 1.0);
    fresnelTerm = pow(fresnelTerm, 2.0);

    vec3 color1 = vec3(0.0, 0.96, 0.83); // Teal
    vec3 color2 = vec3(0.44, 0.0, 1.0); // Violet
    vec3 color3 = vec3(1.0, 0.0, 0.9);   // Pink

    float noise = sin(vPosition.x * 5.0 + uTime) * sin(vPosition.y * 5.0 + uTime * 0.5) * sin(vPosition.z * 5.0 + uTime * 0.8);
    vec3 baseColor = mix(color1, color2, sin(uTime * 0.5 + noise) * 0.5 + 0.5);
    baseColor = mix(baseColor, color3, cos(uTime * 0.3 - noise) * 0.5 + 0.5);

    vec3 finalColor = baseColor + (color1 * fresnelTerm * 2.0);
    float wire = smoothstep(0.0, 0.02, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    finalColor += mix(vec3(1.0), vec3(0.0), wire) * 0.5;

    gl_FragColor = vec4(finalColor, 0.85 + fresnelTerm * 0.15);
  }
`

const IridescentCore = () => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.2
      meshRef.current.rotation.x = time * 0.1
      const pulse = Math.sin(time * 15.7) * 0.05 + 1
      meshRef.current.scale.setScalar(pulse)
    }
    if (materialRef.current) materialRef.current.uniforms.uTime.value = time
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2.5, 3]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={true}
        transparent={true}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// --- 2. 3D Tilt Feature Card ---
const TiltCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 30, stiffness: 200 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 200 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseXPos = e.clientX - rect.left
    const mouseYPos = e.clientY - rect.top
    const xPct = mouseXPos / width - 0.5
    const yPct = mouseYPos / height - 0.5
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
      whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative glass-theater p-12 rounded-[50px] transition-colors duration-500 group hover:bg-white/10 hover:border-primary/40"
    >
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-10 border border-white/5 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_#00F5D440] transition-all"
      >
        <Icon className="w-10 h-10 text-primary group-hover:drop-shadow-[0_0_10px_#00F5D4]" />
      </div>
      <h3 
        style={{ transform: "translateZ(30px)" }}
        className="text-3xl font-black mb-6 tracking-tighter uppercase italic drop-shadow-lg"
      >
        {title}
      </h3>
      <p 
        style={{ transform: "translateZ(20px)" }}
        className="text-white/40 text-lg font-bold leading-relaxed uppercase tracking-tighter group-hover:text-white/70 transition-colors"
      >
        {desc}
      </p>

      <motion.div 
        className="absolute inset-0 z-[-1] rounded-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-screen"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${useTransform(mouseX, [-0.5, 0.5], [0, 100])}% ${useTransform(mouseY, [-0.5, 0.5], [0, 100])}%, rgba(0, 245, 212, 0.15), transparent 80%)`
        }}
      />
    </motion.div>
  )
}

export const LandingPage = () => {
  return (
    <div className="bg-[#020205] text-white selection:bg-primary/40 font-sans min-h-screen flex flex-col" style={{ perspective: '2000px' }}>
      
      {/* High-Frequency Scanlines Overlay */}
      <div className="fixed inset-0 z-[999] pointer-events-none opacity-[0.03] mix-blend-overlay bg-[linear-gradient(transparent_50%,_rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

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
          backdrop-filter: blur(30px) saturate(150%);
          border: 1px solid rgba(0, 245, 212, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 245, 212, 0.05);
        }
        .neon-border {
          position: relative;
        }
        .neon-border::after {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(90deg, transparent, rgba(0,245,212,0.5), transparent);
          z-index: -1;
          border-radius: inherit;
        }
      `}} />

      {/* NAVIGATION */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-5xl px-6">
        <div className="glass-theater py-4 px-10 rounded-full flex items-center justify-between neon-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary rounded-lg rotate-45 group-hover:rotate-0 transition-transform duration-500 shadow-[0_0_20px_#00F5D4]" />
            <span className="font-black text-xl tracking-[0.2em] italic drop-shadow-[0_0_10px_rgba(0,245,212,0.5)]">SMARTSCHOLAR</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.4em] opacity-80">
            <span className="text-primary hover:tracking-[0.6em] transition-all cursor-crosshair">Zero-Google</span>
            <span className="hover:text-primary hover:tracking-[0.6em] transition-all cursor-crosshair">Digital Theater V4</span>
            <Link to="/auth" className="text-primary hover:text-white transition-all underline decoration-primary/50 underline-offset-8">Login Portal</Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO (Iridescent Core) */}
      <section className="relative w-full min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true, antialias: true }}>
            <ambientLight intensity={2} />
            <pointLight position={[10, 10, 10]} color="#00F5D4" intensity={5} />
            <pointLight position={[-10, -10, -10]} color="#7000FF" intensity={5} />
            <IridescentCore />
          </Canvas>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center space-y-16 max-w-7xl w-full"
        >
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full glass-theater border-primary/40 text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4 shadow-[0_0_30px_rgba(0,245,212,0.2)]">
            <div className="w-2 h-2 rounded-full bg-primary animate-[pulse_400ms_infinite]" />
            Groq Llama 3.3 Engine Active
          </div>

          <h1 className="text-6xl md:text-[140px] font-black tracking-tighter leading-[0.8] uppercase italic drop-shadow-2xl">
            STUDY AT THE <br />
            <span className="text-iridescent">SPEED OF THOUGHT</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/50 max-w-4xl mx-auto leading-relaxed font-black uppercase tracking-widest italic drop-shadow-md">
            Transform static syllabi into interactive 3D knowledge graphs. <br />
            Powered by <span className="text-white drop-shadow-[0_0_8px_#fff]">Groq & Llama 4 Scout</span>, delivered in sub-second inference. <br />
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10">
            <Link to="/auth" className="group relative z-20">
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/50 transition duration-700" />
              <Button className="relative w-full sm:w-80 h-20 bg-primary text-black hover:bg-white hover:text-black hover:scale-[1.02] transition-all rounded-2xl font-black text-xl uppercase tracking-widest border border-white/20 shadow-[0_0_40px_rgba(0,245,212,0.3)]">
                INITIALIZE PLATFORM <ChevronRight className="ml-2 w-7 h-7" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: 3D FEATURE GRID */}
      <section className="relative w-full py-48 px-8 bg-[#020205] overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.05),transparent_70%)]" />
         <motion.div 
           initial={{ opacity: 0, y: 100 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="w-full max-w-7xl mx-auto relative z-10"
         >
           <div className="text-center mb-24">
             <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4"><span className="text-primary">Zero-Google</span> Architecture</h2>
             <p className="text-white/40 uppercase tracking-[0.4em] font-bold text-sm">Every inference routed through Groq Llama endpoints.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 perspective-[2000px]">
              <TiltCard icon={Network} title="3D Knowledge Map" desc="Your entire curriculum visualized as a glowing constellation of interconnected nodes via Llama 3.3 struct parsing." delay={0} />
              <TiltCard icon={Cpu} title="Groq-Speed AI" desc="Sub-second response times for syllabus analysis and dynamic 6-month roadmap generation. Zero lag computation." delay={0.2} />
              <TiltCard icon={BrainCircuit} title="Vision Grader" desc="Grade handwritten long-form answers instantly with Llama 4 Scout multimodal vision. Unmatched OCR precision." delay={0.4} />
           </div>
         </motion.div>
      </section>

      {/* SECTION 3: THEATER STATS */}
      <section className="relative w-full py-48 px-8 bg-[#010103] flex justify-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, rotateX: -20, scale: 0.95 }}
          whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1 }}
          className="w-full max-w-7xl relative z-10"
        >
          <div className="glass-theater rounded-[80px] p-1 border-primary/20 neon-border">
              <div className="bg-[#020205]/80 rounded-[79px] p-12 md:p-32 relative overflow-hidden backdrop-blur-3xl">
                  {/* Background glows */}
                  <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/20 blur-[180px] rounded-full animate-pulse" />
                  <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#7000FF] opacity-20 blur-[180px] rounded-full" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center relative z-10">
                      <div className="space-y-12">
                          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-theater border-primary/40 text-primary text-[10px] font-black tracking-[0.5em] uppercase">
                              Spatial Memory Environment
                          </div>
                          <h2 className="text-6xl md:text-9xl font-black italic uppercase leading-[0.85] tracking-tighter drop-shadow-lg">
                              The <span className="text-iridescent">Intelligence</span> <br /> Layer
                          </h2>
                          <p className="text-xl text-white/50 leading-relaxed font-black uppercase tracking-widest italic pr-10">
                              SmartScholar doesn't just store data; it projects it. Our Glassmorphism HUD creates a spatial memory environment that makes complex topics stick 4x faster.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-8">
                              {[
                                  { label: 'Latency Target', val: '400ms' },
                                  { label: 'Logic Core', val: 'Llama 3.3' },
                                  { label: 'Vision Core', val: 'Llama 4 Scout' },
                                  { label: 'Inference', val: 'Groq Cloud' }
                              ].map((stat, i) => (
                                  <div key={i} className="glass-theater p-8 rounded-3xl border-primary/10 group hover:border-primary/50 transition-all hover:bg-white/5 cursor-crosshair">
                                      <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2 group-hover:opacity-100 transition-opacity">{stat.label}</div>
                                      <div className="text-3xl font-black text-primary italic tracking-tighter drop-shadow-[0_0_15px_rgba(0,245,212,0.4)]">{stat.val}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="relative flex items-center justify-center">
                          <motion.div 
                            animate={{ rotateZ: 360, rotateX: 20, rotateY: 30 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="relative w-full aspect-square max-w-[500px] border border-primary/30 rounded-full flex items-center justify-center p-10 transform-gpu"
                            style={{ transformStyle: "preserve-3d" }}
                          >
                              <div className="absolute top-0 w-6 h-6 bg-primary shadow-[0_0_30px_#00F5D4] rounded-full" style={{ transform: "translateZ(50px)" }} />
                              <div className="absolute bottom-0 w-6 h-6 bg-[#7000FF] shadow-[0_0_30px_#7000FF] rounded-full" style={{ transform: "translateZ(-50px)" }} />
                              
                              <div className="w-full h-full glass-theater rounded-full flex items-center justify-center relative overflow-hidden">
                                   <Sparkles className="w-40 h-40 text-primary drop-shadow-[0_0_20px_#00F5D4]" />
                              </div>
                          </motion.div>
                      </div>
                  </div>
              </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER METADATA */}
      <footer className="relative z-10 w-full py-32 px-12 border-t border-primary/10 bg-[#000] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(112,0,255,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-20 relative z-10">
          <div className="flex flex-col items-center gap-10">
            <motion.div 
              whileHover={{ rotate: 90, scale: 1.2 }}
              className="w-16 h-16 bg-primary rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_40px_#00F5D4] cursor-crosshair transition-transform duration-500"
            >
              <Globe className="w-8 h-8 text-black" />
            </motion.div>
            <span className="font-black text-5xl tracking-[0.3em] uppercase italic drop-shadow-[0_0_15px_rgba(0,245,212,0.5)]">SMARTSCHOLAR.AI</span>
            <p className="text-white/30 text-sm font-black uppercase tracking-[1em]">The High-Frequency Study Platform</p>
          </div>
          
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-10">
            <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] italic">
              Digital Theater v4.0 // [GROQ_ENABLED] // [LLAMA_4_SCOUT]
            </div>

            <div className="flex gap-16 text-primary/40 hover:text-primary transition-all duration-700">
               <Rocket className="w-8 h-8 hover:text-white cursor-crosshair transition-transform hover:-translate-y-2 hover:drop-shadow-[0_0_10px_#fff]" />
               <ShieldCheck className="w-8 h-8 hover:text-white cursor-crosshair transition-transform hover:-translate-y-2 hover:drop-shadow-[0_0_10px_#fff]" />
               <BrainCircuit className="w-8 h-8 hover:text-white cursor-crosshair transition-transform hover:-translate-y-2 hover:drop-shadow-[0_0_10px_#fff]" />
            </div>
            
            <div className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-loose text-right">
              © 2026 COGNITIVE SYSTEMS <br />
              <span className="text-primary animate-pulse">NEURAL INTERFACE: ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
