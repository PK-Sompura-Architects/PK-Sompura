import Prism from "../components/Prism";
import ModelViewer from "../components/ModelViewer";
import ScrollReveal from "../components/ScrollReveal";
import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="dashboard-wrapper">
            
            <div className="dashboard-bg">
                <Prism 
                    animationType="3drotate" 
                    timeScale={0.1}
                    glow={1.5}
                    colorFrequency={0.5} 
                />
            </div>

            {/* The 3D Temple Model Container is now Full-Screen */}
            <div className="dashboard-model-container">
                <ModelViewer
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
                    width="100%"
                    height="100%"
                    
                    /* THE FIX: Pushes the model 45% to the right of the screen center */
                    modelXOffset={0.45} 
                    
                    enableMouseParallax={true}
                    enableHoverRotation={true}
                    autoRotate={true}
                    autoRotateSpeed={0.2}
                    environmentPreset="city" 
                    showScreenshotButton={false}
                    enableManualZoom={false} 
                />
            </div>

            <div className="dashboard-text-overlay">
                <ScrollReveal 
                    baseOpacity={0} 
                    enableBlur={true} 
                    blurStrength={10} 
                    baseRotation={5}
                >
                    <h1 className="sompura-title">P.K. SOMPURA</h1>
                </ScrollReveal>
                
                <ScrollReveal 
                    baseOpacity={0} 
                    enableBlur={true} 
                    blurStrength={5}
                >
                    <p className="sompura-subtitle">TEMPLE ARCHITECT & CONTRACTOR</p>
                </ScrollReveal>
            </div>

        </div>
    );
}

export default Dashboard;