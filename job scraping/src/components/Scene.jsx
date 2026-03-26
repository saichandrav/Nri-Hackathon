import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

const ParticleRing = ({ count = 200, radius = 4 }) => {
  const points = useRef();
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5;
      const y = (Math.random() - 0.5) * 2;
      
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, [count, radius]);

  let time = 0;
  useFrame((state, delta) => {
    time += delta;
    if (points.current) {
      points.current.rotation.y = time * 0.1;
      points.current.rotation.x = Math.sin(time * 0.2) * 0.2;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a78bfa"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const CoreNode = () => {
  const meshRef = useRef();

  let time = 0;
  useFrame((state, delta) => {
    time += delta;
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
      
      // Floating effect based on mouse position
      const targetX = (state.pointer.x * state.viewport.width) / 4;
      const targetY = (state.pointer.y * state.viewport.height) / 4;
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <group ref={meshRef}>
        <Sphere args={[1.5, 32, 32]}>
          <meshStandardMaterial 
            color="#0f172a" 
            roughness={0.1}
            metalness={0.8}
            wireframe={true}
            transparent
            opacity={0.3}
          />
        </Sphere>
        <Sphere args={[1.2, 16, 16]}>
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#3b82f6"
            emissiveIntensity={2}
            roughness={0.2}
            metalness={1}
            wireframe={true}
          />
        </Sphere>
      </group>
    </Float>
  );
};

const Scene = () => {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#a78bfa" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ParticleRing />
        <CoreNode />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Scene;
