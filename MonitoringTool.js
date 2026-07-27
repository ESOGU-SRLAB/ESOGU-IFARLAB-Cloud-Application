import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import UR10eRobot from '../components/UR10eRobot';
import KawasakiRobot from '../components/KawasakiRobot';
import EnvironmentElements from '../components/EnvironmentElements';
import ControlPanel from '../components/ControlPanel';
import Scene from '../components/Scene';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api\/auth\/?$/, '/api')
  : 'http://localhost:3001/api';

function Loader() {
  return (
    <Html center>
      <div style={{
        color: '#1d1d1f',
        fontSize: '15px',
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
        fontWeight: 500,
        background: 'rgba(255,255,255,0.92)',
        padding: '16px 28px',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
        Loading Digital Twin...
      </div>
    </Html>
  );
}

export default function DigitalTwin() {
  const [jointAngles, setJointAngles] = useState([0, -90, 0, -90, 0, 0]);
  const [showFrames, setShowFrames] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [gripperOpen, setGripperOpen] = useState(0.5);
  const [showEnvironment, setShowEnvironment] = useState(true);
  const [kawasakiAngles, setKawasakiAngles] = useState([0, 20, -30, 0, 45, 0]);
  const [panelOpen, setPanelOpen] = useState(false);

  const lastTelemetryTsRef = useRef(null);

  useEffect(() => {
    const url = `${API_BASE}/telemetry/joint-states/stream?interval=250`;
    const es = new EventSource(url);

    es.addEventListener('hello', () => {
      // no-op; connection established
    });

    es.addEventListener('joint_states', (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        const ur10eOk = Array.isArray(payload?.ur10e) && payload.ur10e.length === 6;
        const kawasakiOk = Array.isArray(payload?.kawasaki) && payload.kawasaki.length === 6;
        if (!ur10eOk && !kawasakiOk) return;
        if (payload.timestamp && payload.timestamp === lastTelemetryTsRef.current) return;
        lastTelemetryTsRef.current = payload.timestamp || null;

        // If user enabled demo animation, don't override angles.
        if (animate) return;
        if (ur10eOk) setJointAngles(payload.ur10e);
        if (kawasakiOk) setKawasakiAngles(payload.kawasaki);
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener('error', () => {
      // Browser will auto-retry; keep UI usable offline.
    });

    return () => {
      es.close();
    };
  }, [animate]);

  return (
    <div className="dt-wrapper">

      {/* Header bar */}
      <header className="ndoc-header">
        <div className="ndoc-header-inner">
          <span className="ndoc-header-title">Digital Twin</span>
          <span className="ndoc-header-version">3D Workcell Visualizer</span>
        </div>
      </header>

      {/* Split layout: sidebar + 3D viewport */}
      <div className="twin-layout">

        {/* Left sidebar (control panel) */}
        <div className={`twin-sidebar${panelOpen ? ' open' : ''}`}>
          <ControlPanel
            jointAngles={jointAngles}
            setJointAngles={setJointAngles}
            showFrames={showFrames}
            setShowFrames={setShowFrames}
            animate={animate}
            setAnimate={setAnimate}
            animationSpeed={animationSpeed}
            setAnimationSpeed={setAnimationSpeed}
            gripperOpen={gripperOpen}
            setGripperOpen={setGripperOpen}
            showEnvironment={showEnvironment}
            setShowEnvironment={setShowEnvironment}
          />
        </div>

        {/* Mobile drawer overlay */}
        {panelOpen && (
          <div className="drawer-overlay" onClick={() => setPanelOpen(false)} />
        )}

        {/* Right viewport */}
        <div className="twin-viewport">
          <button
            className="panel-toggle"
            onClick={() => setPanelOpen(o => !o)}
            aria-label="Toggle control panel"
          >
            Menu
          </button>

          <Canvas
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#e8e8ed' }}
            dpr={[1, 2]}
          >
            <Suspense fallback={<Loader />}>
              <Scene>
                <group position={[-0.147, 0.58635, -1.115]}>
                  <UR10eRobot
                    jointAngles={jointAngles}
                    showFrames={showFrames}
                    gripperOpen={gripperOpen}
                    animate={animate}
                    animationSpeed={animationSpeed}
                  />
                </group>
                <group position={[-2.299, 0.428, -1.02]} rotation={[0, Math.PI, 0]}>
                  <KawasakiRobot
                    jointAngles={kawasakiAngles}
                    animate={animate}
                    animationSpeed={animationSpeed * 0.6}
                    gripperOpen={gripperOpen}
                  />
                </group>
                <EnvironmentElements showEnvironment={showEnvironment} />
              </Scene>
            </Suspense>
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={0.5}
              maxDistance={25}
              maxPolarAngle={Math.PI / 2 + 0.1}
              target={[-1.2, 0.5, -1.0]}
            />
          </Canvas>

          <div className="controls-hint">
            Left click: Rotate &bull; Right click: Pan &bull; Scroll: Zoom
          </div>
        </div>
      </div>
    </div>
  );
}
