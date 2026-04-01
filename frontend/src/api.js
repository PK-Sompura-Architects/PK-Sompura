import axios from "axios";

const API_URL = "";

const api = axios.create({
    baseURL: API_URL,
});

export const getTemples = async (lang = "en") => {
    try {
        const response = await api.get(`/temples?lang=${lang}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching temples:", error);
        throw error;
    }
};

export const getFeaturedTemples = async (lang = "en") => {
    try {
        const response = await api.get(`/temples/featured?lang=${lang}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching featured temples:", error);
        throw error;
    }
};

export const submitContact = async (data) => {
    try {
        const response = await api.post("/contact", data);
        return response.data;
    } catch (error) {
        console.error("Error submitting contact form:", error);
        throw error;
    }
};

export const uploadImage = async (formData) => {
    try {
        const response = await api.post("/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export default api;
