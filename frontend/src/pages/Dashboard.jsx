import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Environment, ContactShadows, Float } from "@react-three/drei";
import Prism from "../components/Prism";
import ScrollReveal from "../components/ScrollReveal";
import LineageSection from '../components/LineageSection';
import WorkingSitesSection from '../components/WorkingSitesSection';
import DashboardGalleries from '../components/DashboardGalleries';
import "./Dashboard.css";

function SpinningLogo() {
    const groupRef = useRef();
    const texture = useTexture("/LOGO_2.png");

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.4;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
            <group ref={groupRef} position={[2.5, -0.2, 0]}>
                {/* Front Side */}
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[4, 4]} />
                    {/* Clean, untinted material for light theme */}
                    <meshStandardMaterial map={texture} transparent={true} />
                </mesh>
                {/* Back Side */}
                <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[4, 4]} />
                    {/* Clean, untinted material for light theme */}
                    <meshStandardMaterial map={texture} transparent={true} />
                </mesh>
            </group>
        </Float>
    );
}

function Dashboard() {
    const scrollToLineage = () => {
        document.getElementById('lineage-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="dashboard-container">
            {/* 1. Landing Hero Section */}
            <section className="dashboard-hero-wrapper">
                
                {/* Left Side Text */}
                <div className="dashboard-text-overlay">
                    <ScrollReveal baseOpacity={0} enableBlur={true} blurStrength={10} baseRotation={5}>
                        <h1 className="sompura-title">P.K. SOMPURA</h1>
                    </ScrollReveal>
                    <ScrollReveal baseOpacity={0} enableBlur={true} blurStrength={5}>
                        <p className="sompura-subtitle">TEMPLE ARCHITECT & CONTRACTOR</p>
                    </ScrollReveal>
                </div>

                {/* Background Animation */}
                <div className="dashboard-bg">
                    <Prism 
                        animationType="3drotate" 
                        timeScale={0.1}
                        glow={1.5}
                        colorFrequency={0.5} 
                    />
                </div>

                {/* 3D Canvas Container */}
                <div className="dashboard-model-container">
                    <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                        <ambientLight intensity={1.2} />
                        <directionalLight position={[5, 8, 5]} intensity={1.5} />
                        <Suspense fallback={null}>
                            <SpinningLogo />
                            <Environment preset="city" />
                            <ContactShadows position={[2.5, -2.5, 0]} opacity={0.2} scale={10} blur={2.5} far={4} color="#0F1C2E" />
                        </Suspense>
                    </Canvas>
                </div>

                {/* Animated Scroll Down Indicator */}
                <div className="dashboard-scroll-indicator" onClick={scrollToLineage} role="button">
                    <span className="scroll-text">Discover Legacy</span>
                    <div className="scroll-chevron-wrapper">
                        <div className="scroll-chevron"></div>
                        <div className="scroll-chevron"></div>
                    </div>
                </div>
            </section>

            {/* 2. Embedded Lineage Section */}
            <div id="lineage-section" className="dashboard-about-wrapper">
                <LineageSection />
            </div>

            {/* 3. Tools, Machines & Working Sites */}
            <div id="working-sites-section">
                <WorkingSitesSection />
            </div>

            {/* 4. Operations & Galleries Section */}
            <div id="operations-section">
                <DashboardGalleries />
            </div>
        </div>
    );
}

export default Dashboard;
