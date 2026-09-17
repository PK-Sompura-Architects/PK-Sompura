import { useRef, useEffect, useState } from "react";
import { gsap } from "../animations/scrollAnimations";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";
import "./ContactSection.css";

function ContactSection() {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language];
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        templeType: "",
        message: "",
    });

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Reveal on scroll
            gsap.fromTo(
                contentRef.current.children,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                        end: "top 30%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, [language]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${API_URL}/contact/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    temple_type: formData.templeType,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                console.error("Submission failed");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <section className="contact-section" ref={sectionRef}>
            <div className="contact-bg"></div>

            <div className="contact-content" ref={contentRef}>
                <span className="contact-label">{t.contact.label}</span>
                <h2>
                    {t.contact.title} <span className="gold">{t.contact.titleGold}</span>{" "}
                    {t.contact.titleSuffix}
                </h2>
                <p className="contact-subtitle">{t.contact.subtitle}</p>
                <div className="contact-line"></div>

                {!submitted ? (
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="contact-name">{t.contact.form.name}</label>
                                <input
                                    type="text"
                                    id="contact-name"
                                    name="name"
                                    placeholder={t.contact.form.namePlace}
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="contact-email">{t.contact.form.email}</label>
                                <input
                                    type="email"
                                    id="contact-email"
                                    name="email"
                                    placeholder={t.contact.form.emailPlace}
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact-temple-type">
                                {t.contact.form.projectType}
                            </label>
                            <select
                                id="contact-temple-type"
                                name="templeType"
                                value={formData.templeType}
                                onChange={handleChange}
                            >
                                <option value="">{t.contact.form.selectDefault}</option>
                                <option value="temple">{t.contact.form.types.temple}</option>
                                <option value="monument">
                                    {t.contact.form.types.monument}
                                </option>
                                <option value="restoration">
                                    {t.contact.form.types.restoration}
                                </option>
                                <option value="consultation">
                                    {t.contact.form.types.consultation}
                                </option>
                                <option value="other">{t.contact.form.types.other}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact-message">{t.contact.form.message}</label>
                            <textarea
                                id="contact-message"
                                name="message"
                                placeholder={t.contact.form.messagePlace}
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="contact-submit">
                            {t.contact.form.submit}
                        </button>
                    </form>
                ) : (
                    <div className="contact-success">
                        <div className="contact-success-icon">✓</div>
                        <p>{t.contact.form.success}</p>
                    </div>
                )}

                <div className="contact-footer">
                    <p>{t.contact.form.footer}</p>
                </div>
            </div>
        </section>
    );
}

export default ContactSection;
