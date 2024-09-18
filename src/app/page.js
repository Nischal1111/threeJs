"use client";
import React, { useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Room() {
  const controlsRef = useRef();
  const { camera } = useThree();

  const handleWheel = useCallback(
    (event) => {
      if (controlsRef.current) {
        const zoomSpeed = 0.1;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        const moveVector = new THREE.Vector3()
          .copy(direction)
          .multiplyScalar(event.deltaY < 0 ? zoomSpeed : -zoomSpeed);

        camera.position.add(moveVector);
        camera.position.y = Math.max(camera.position.y, 1); // Limit Y to prevent zooming too low

        controlsRef.current.target.copy(camera.position).add(direction);
      }
    },
    [camera]
  );

  useFrame(() => {
    if (controlsRef.current) {
      // You can define additional constraints for the camera's controls here
      controlsRef.current.minDistance = 0.5; // Allow zooming closer to walls
      controlsRef.current.maxDistance = 4;   // Maximum zoom out distance
    }
  });

  return (
    <>
      <Model url="/room/scene.gltf" />
      <Text
        position={[2.5, 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        color="black"
        fontSize={0.2}
        maxWidth={2}
        textAlign="center"
      >
        Hello, I am Nischal and this is my room.
      </Text>
      <OrbitControls
        ref={controlsRef}
        rotateSpeed={0.5}
        target={[0, 1.5, 0]} // Set target in the center of the room
        minPolarAngle={Math.PI / 3.5} // Minimum view angle (allows looking slightly downward)
        maxPolarAngle={Math.PI / 1.8} // Maximum view angle (allows looking slightly upward)
        minDistance={0.5} // Minimum zoom distance (allows zooming into walls)
        maxDistance={4} // Maximum zoom distance (allows zooming out further)
      />
      <primitive object={camera} onWheel={handleWheel} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <pointLight position={[-5, 3, -5]} intensity={0.5} />
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
