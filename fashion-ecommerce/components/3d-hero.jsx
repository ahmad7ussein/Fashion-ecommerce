"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text3D, Center, Environment } from "@react-three/drei";
function AnimatedTShirt() {
    const meshRef = useRef(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
        }
    });
    return (<Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow>
        
        <boxGeometry args={[2, 2.5, 0.3]}/>
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1}/>
      </mesh>
      
      
      <mesh position={[-1.3, 0.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.3]}/>
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1}/>
      </mesh>
      
      
      <mesh position={[1.3, 0.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.3]}/>
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1}/>
      </mesh>
      
      
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 32]}/>
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1}/>
      </mesh>
    </Float>);
}
function AnimatedText() {
    const textRef = useRef(null);
    useFrame((state) => {
        if (textRef.current) {
            textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
        }
    });
    return (<group ref={textRef} position={[0, 2, 0]}>
      <Center>
        <Text3D font="/fonts/helvetiker_bold.typeface.json" size={0.5} height={0.2} curveSegments={12} bevelEnabled bevelThickness={0.02} bevelSize={0.02} bevelOffset={0} bevelSegments={5}>
          FashionHub
          <meshStandardMaterial color="#000000" roughness={0.2} metalness={0.8}/>
        </Text3D>
      </Center>
    </group>);
}
function ParticleField() {
    const particlesRef = useRef(null);
    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
            particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        }
    });
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return (<points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={particleCount} itemSize={3}/>
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#888888" transparent opacity={0.6}/>
    </points>);
}
export function Hero3D() {
    return (<div className="w-full h-[600px] relative">
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }} className="bg-gradient-to-b from-background to-muted">
        <ambientLight intensity={0.5}/>
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow/>
        <pointLight position={[-10, -10, -10]} intensity={0.5}/>
        
        <ParticleField />
        <AnimatedTShirt />
        
        <Environment preset="city"/>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5}/>
      </Canvas>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Design Your Style
          </h1>
          <p className="text-xl text-muted-foreground">
            Create unique fashion with our 3D design studio
          </p>
        </div>
      </div>
    </div>);
}
