import { useState } from "react";
import ScrollReveal from "../components/ScrollReveal";
import "./Inquiry.css";

function Inquiry() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        templeType: "",
        message: "",
    });
    const [status, setStatus] = useState("idle"); 

    // 🚨 Checks if you are typing the secret backdoor name
    const isAdminAttempt = formData.name.toLowerCase() === "admin";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🚨 THE SECRET ADMIN BACKDOOR 🚨
        if (isAdminAttempt && formData.phone === "admin123") {
            window.location.href = "http://localhost:8000/admin";
            return;
        }

        setStatus("submitting");

        try {
            const response = await fetch("http://localhost:8000/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    temple_type: formData.templeType,
                    message: formData.message,
                }),
            });

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", phone: "", templeType: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Form error:", error);
            setStatus("error");
        }
    };

    return (
        <div className="inquiry-wrapper">
            <div className="inquiry-container">
                <div className="inquiry-header">
                    <ScrollReveal baseOpacity={0} blurStrength={10} baseRotation={2}>
                        <h1 className="sompura-title" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
                            Begin a Project
                        </h1>
                    </ScrollReveal>
                    <p style={{ color: "var(--color-text-muted)", marginTop: "10px" }}>
                        Connect with our architects to discuss your sacred vision.
                    </p>
                </div>

                {status === "success" ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-gold)" }}>
                        <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: "15px" }}>Inquiry Received</h2>
                        <p style={{ color: "var(--color-text-muted)" }}>We will be in touch with you shortly.</p>
                        <button className="submit-btn" onClick={() => setStatus("idle")} style={{ marginTop: "30px" }}>
                            Send Another
                        </button>
                    </div>
                ) : (
                    <form className="inquiry-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                {/* THE FIX: Required is turned off if you type 'admin' */}
                                <input type="email" id="email" name="email" required={!isAdminAttempt} value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="templeType">Type of Construction</label>
                            {/* THE FIX: Required is turned off if you type 'admin' */}
                            <select id="templeType" name="templeType" required={!isAdminAttempt} value={formData.templeType} onChange={handleChange}>
                                <option value="" disabled>Select a category...</option>
                                <option value="New Temple">New Temple Construction</option>
                                <option value="Restoration">Heritage Restoration</option>
                                <option value="Monument">Monument / Memorial</option>
                                <option value="Consultation">Architectural Consultation</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Project Details</label>
                            {/* THE FIX: Required is turned off if you type 'admin' */}
                            <textarea id="message" name="message" required={!isAdminAttempt} value={formData.message} onChange={handleChange} placeholder="Please describe your vision, location, and timeline..."></textarea>
                        </div>

                        <button type="submit" className="submit-btn" disabled={status === "submitting"}>
                            {status === "submitting" ? "Sending..." : "Submit Inquiry"}
                        </button>
                        
                        {status === "error" && (
                            <p style={{ color: "red", textAlign: "center", fontSize: "14px", marginTop: "10px" }}>
                                Something went wrong. Please check your connection and try again.
                            </p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}

export default Inquiry;