"use client";
import React, { useRef, useCallback, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import gsap from 'gsap';
import { cover } from 'three/src/extras/TextureUtils';

// Model component to load GLTF models
function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// Lamp component to focus on the lamp model
function Lamp({ focusOnLamp }) {
  const { scene } = useGLTF('/titanic_lamp/scene.gltf');
  const lampRef = useRef();

  useEffect(() => {
    if (lampRef.current) {
      gsap.to(lampRef.current.position, {
        x: -4.7,
        y: -1,
        z: 2.5,
        duration: 1,
        ease: "power2.inOut"
      });

      if (focusOnLamp) {
        gsap.to(lampRef.current.rotation, {
          y: Math.PI * 2,
          duration: 2,
          ease: "power2.inOut"
        });
      }
    }
  }, [focusOnLamp]);

  return (
    <primitive 
      ref={lampRef}
      object={scene} 
      scale={[0.01, 0.01, 0.01]}
      position={[-4.7, -1, 2.5]}
    />
  );
}

// 3D text component
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

function VideoWall() {
  const videoRef = useRef();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTexture, setVideoTexture] = useState(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = "/threePrac.mp4"; // Path to your video file
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.side=cover;
    video.playsInline = true;

    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    setVideoTexture(texture);
    videoRef.current = video;
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <>
      {/* Move video to the opposite wall */}
      <mesh position={[-.2, 1.5, 4.4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4.5, 2.5]} />
        {videoTexture && (
          <meshBasicMaterial 
            map={videoTexture} 
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        )}
      </mesh>

      {/* Play/Pause button for the video */}
      <Html position={[2, 2, 4]}>
        <button
          onClick={toggleVideo}
          style={{
            padding: '10px 20px',
            backgroundColor: isVideoPlaying ? '#FF4136' : '#0074D9',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize:"10px",
            cursor: 'pointer',
            zIndex: 1,
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {isVideoPlaying ? 'Pause' : 'Play'}
        </button>
      </Html>
    </>
  );
}


function Room() {
  const roomControlsRef = useRef();
  const lampControlsRef = useRef();
  const [focusOnLamp, setFocusOnLamp] = useState(false);
  const { camera } = useThree();

  // Handle zoom with the mouse wheel
  const handleWheel = useCallback(
  (event) => {
    event.preventDefault();
    const activeControls = focusOnLamp ? lampControlsRef.current : roomControlsRef.current;
    if (activeControls) {
      const zoomSpeed = 0.03; // Reduced zoom speed
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      // Calculate new position
      const newY = Math.max(
        camera.position.y + direction.y * (event.deltaY < 0 ? zoomSpeed : -zoomSpeed),
        focusOnLamp ? -0.2 : 0.5  // Limited minimum height
      );

      // Check distance from target
      const targetPosition = new THREE.Vector3(
        activeControls.target.x,
        activeControls.target.y,
        activeControls.target.z
      );
      const currentDistance = camera.position.distanceTo(targetPosition);
      const newDistance = currentDistance + (event.deltaY < 0 ? -zoomSpeed : zoomSpeed);

      // Only zoom if within distance limits
      const minDist = focusOnLamp ? 2 : 3;
      const maxDist = focusOnLamp ? 5 : 10;
      
      if (newDistance >= minDist && newDistance <= maxDist) {
        gsap.to(camera.position, {
          x: camera.position.x + direction.x * (event.deltaY < 0 ? zoomSpeed : -zoomSpeed),
          y: newY,
          z: camera.position.z + direction.z * (event.deltaY < 0 ? zoomSpeed : -zoomSpeed),
          duration: 0.5,
          ease: "power2.out"
        });
      }
    }
  },
  [camera, focusOnLamp]
);
  const toggleFocus = () => {
  setFocusOnLamp((prevFocus) => !prevFocus);

  if (!focusOnLamp) {
    // Transition to lamp view - moved camera back and up for better perspective
    gsap.to(camera.position, {
      x: -3.7,    // Moved slightly back from the lamp
      y: 0,       // Lowered the camera height
      z: 4.5,     // Increased distance from lamp
      duration: 1.5,
      ease: "power2.inOut",
    });
    gsap.to(lampControlsRef.current.target, {
      x: -4.7,
      y: -1,
      z: 2.5,
      duration: 1.5,
      ease: "power2.inOut",
    });
  } else {
    // Transition back to room view
    gsap.to(camera.position, {
      x: 0,
      y: 1.5,
      z: 5,
      duration: 1.5,
      ease: "power2.inOut",
    });
    gsap.to(roomControlsRef.current.target, {
      x: 0,
      y: 1.5,
      z: 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
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
      <VideoWall />
      <OrbitControls
        ref={roomControlsRef}
        rotateSpeed={0.5}
        target={[0, 1.5, 0]}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.8}
        minDistance={3} // Increased minimum distance for room zooming
        maxDistance={6} // Reduced maximum distance
        enabled={!focusOnLamp}
      />

      <OrbitControls
        ref={lampControlsRef}
        rotateSpeed={0.5}
        target={[-4.7, -1, 2.5]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={2.5} // Slightly increased minimum distance to prevent too close zoom
        maxDistance={4}   // Reduced maximum distance to avoid zooming too far
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


// Main Home component
export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [2, 1.5, 2], rotation: [0, -Math.PI / 2, 0], fov: 50 }}>
        <Suspense fallback={null}>
          <Room />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload models and video
useGLTF.preload('/room/scene.gltf');
useGLTF.preload('/lamp/scene.gltf');
