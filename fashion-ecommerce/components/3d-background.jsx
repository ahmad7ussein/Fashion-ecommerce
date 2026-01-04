"use client";
import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";
function AnimatedSphere() {
    const meshRef = useRef(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });
    return (<Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.5}>
        <MeshDistortMaterial color="#4F46E5" attach="material" distort={0.4} speed={2} roughness={0.2} metalness={0.8}/>
      </Sphere>
    </Float>);
}
function ParticleField() {
    const pointsRef = useRef(null);
    useEffect(() => {
        if (!pointsRef.current)
            return;
        const positions = new Float32Array(1000 * 3);
        for (let i = 0; i < 1000; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        pointsRef.current.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    }, []);
    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.03;
        }
    });
    return (<points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.6} sizeAttenuation/>
    </points>);
}
function FloatingSpheres() {
    return (<>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3} position={[-3, 2, -2]}>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#8B5CF6" metalness={0.8} roughness={0.2}/>
        </Sphere>
      </Float>

      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.4} position={[3, -1, -3]}>
        <Sphere args={[0.7, 32, 32]}>
          <meshStandardMaterial color="#EC4899" metalness={0.8} roughness={0.2}/>
        </Sphere>
      </Float>

      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.5} position={[2, 3, -4]}>
        <Sphere args={[0.4, 32, 32]}>
          <meshStandardMaterial color="#06B6D4" metalness={0.8} roughness={0.2}/>
        </Sphere>
      </Float>

      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.3} position={[-2, -2, -2]}>
        <Sphere args={[0.6, 32, 32]}>
          <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.2}/>
        </Sphere>
      </Float>
    </>);
}
export function Background3D() {
    return (<div className="fixed inset-0 -z-10 opacity-30">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.5}/>
        <pointLight position={[10, 10, 10]} intensity={1}/>
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4F46E5"/>
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} castShadow/>

        <AnimatedSphere />
        <ParticleField />
        <FloatingSpheres />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2}/>
      </Canvas>
    </div>);
}
export function Background3DSimple() {
    return (<div className="fixed inset-0 -z-10 opacity-20">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true, antialias: false }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5}/>
        <pointLight position={[10, 10, 10]} intensity={1}/>
        
        <AnimatedSphere />
        <ParticleField />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3}/>
      </Canvas>
    </div>);
}
export function GradientMeshBackground() {
    return (<div className="fixed inset-0 -z-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-blob"/>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"/>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000"/>
      
      <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "50px 50px",
        }}/>
    </div>);
}
