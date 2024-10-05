"use client"
import React, { useRef, useCallback, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Lamp({ focusOnLamp }) {
  const { scene } = useGLTF('/titanic_lamp/scene.gltf');
  const lampRef = useRef();

  return (
    <primitive 
      ref={lampRef}
      object={scene} 
      scale={[0.01, 0.01, 0.01]} // Adjust scale as needed
      position={[-4.7, -1, 2.5]}
      rotation={[0, 0, 0]} // Reset rotation
    />
  );
}

function Text3D({ text, position, rotation }) {
  const font = useLoader(FontLoader, '/fonts/Tektur_Regular.json');
  const meshRef = useRef();

  useEffect(() => {
    if (font) {
      const geometry = new TextGeometry(text, {
        font: font,
        size: 0.15,
        height: 0.02,
        curveSegments: 12,
        bevelThickness: 0.01,
        bevelEnabled: false,
      });
      geometry.center();
      meshRef.current.geometry = geometry;
    }
  }, [font, text]);

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <meshStandardMaterial color="black" />
    </mesh>
  );
}

function Room() {
  const roomControlsRef = useRef();
  const lampControlsRef = useRef();
  const [focusOnLamp, setFocusOnLamp] = useState(false);
  const { camera, gl } = useThree();

  const handleWheel = useCallback(
    (event) => {
      const activeControls = focusOnLamp ? lampControlsRef.current : roomControlsRef.current;
      if (activeControls) {
        const zoomSpeed = 0.1;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        const moveVector = new THREE.Vector3()
          .copy(direction)
          .multiplyScalar(event.deltaY < 0 ? zoomSpeed : -zoomSpeed);

        camera.position.add(moveVector);
        camera.position.y = Math.max(camera.position.y, 1);

        activeControls.target.copy(camera.position).add(direction);
      }
    },
    [camera, focusOnLamp]
  );

  useFrame(() => {
    if (roomControlsRef.current) {
      roomControlsRef.current.minDistance = 0.5;
      roomControlsRef.current.maxDistance = 4;
    }
    if (lampControlsRef.current) {
      lampControlsRef.current.minDistance = 0.5;
      lampControlsRef.current.maxDistance = 2;
    }
  });

  const toggleFocus = () => {
    setFocusOnLamp(!focusOnLamp);
    if (!focusOnLamp) {
      // Focus on lamp
      camera.position.set(0, 1.5, 3); // Adjusted camera position
      lampControlsRef.current.target.set(0, 0, 0); // Set target to lamp position (center)
    } else {
      // Focus on room
      camera.position.set(0, 1.5, 5);
      roomControlsRef.current.target.set(0, 1.5, 0);
    }
  };

  return (
    <>
      <Model url="/room/scene.gltf" />
      <Lamp focusOnLamp={focusOnLamp} />
      <Text3D 
        text="Hello, I am Nischal and"
        position={[2.5, 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <Text3D 
        text="This is my room."
        position={[2.5, 1.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <OrbitControls
        ref={roomControlsRef}
        rotateSpeed={0.5}
        target={[0, 1.5, 0]}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.8}
        minDistance={0.5}
        maxDistance={4}
        enabled={!focusOnLamp}
      />
      <OrbitControls
        ref={lampControlsRef}
        rotateSpeed={0.5}
        target={[0, 0, 0]} // Set target to lamp position (center)
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        minDistance={0.5}
        maxDistance={2}
        enabled={focusOnLamp}
      />
      <primitive object={camera} onWheel={handleWheel} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} />

      <Html
        as='div'
        center
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <button 
          onClick={toggleFocus} 
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: focusOnLamp ? '#ff4136' : '#0074D9',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'opacity 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
        >
          {focusOnLamp ? 'Room' : 'Lamp'}
        </button>
      </Html>
    </>
  );
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <Room />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload models
useGLTF.preload('/room/scene.gltf');
useGLTF.preload('/lamp/scene.gltf');