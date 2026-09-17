import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './AdminPage.css';

// --- Supabase Client ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const SESSION_KEY = 'pk_admin_session';

// --- Auth Gate ---
function LoginGate({ onLogin }) {
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (pw === ADMIN_PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, '1');
            onLogin();
        } else {
            setError('Incorrect password. Please try again.');
            setPw('');
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-box">
                <div className="admin-login-logo">🏛️</div>
                <h1 className="admin-login-title">Admin Portal</h1>
                <p className="admin-login-sub">P.K. Sompura Architecture</p>
                <form onSubmit={handleLogin} className="admin-login-form">
                    <input
                        type="password"
                        value={pw}
                        onChange={e => setPw(e.target.value)}
                        placeholder="Enter admin password"
                        className="admin-input"
                        required
                        autoFocus
                    />
                    {error && <p className="admin-error-msg">{error}</p>}
                    <button type="submit" className="admin-btn admin-btn--primary">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}

// --- Upload Panel ---
function UploadPanel({ onUploaded }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const fileRef = useRef();

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFile(null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
        setUploadStatus('idle');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!supabase) {
            alert('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
            return;
        }
        if (!file) { alert('Please select an image.'); return; }
        if (!title.trim()) { alert('Please enter a title.'); return; }

        setUploading(true);
        setUploadStatus('uploading');

        try {
            // 1. Upload to storage bucket
            const timestamp = Date.now();
            const cleanName = file.name.replace(/\s+/g, '_');
            const filePath = `${timestamp}_${cleanName}`;

            const { error: storageError } = await supabase.storage
                .from('samples')
                .upload(filePath, file, { contentType: file.type, upsert: false });

            if (storageError) throw storageError;

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('samples')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // 3. Insert into samples_data table
            const { error: dbError } = await supabase
                .from('samples_data')
                .insert([{
                    image_url: publicUrl,
                    title: title.trim(),
                    description: description.trim() || null,
                    created_at: new Date().toISOString(),
                }]);

            if (dbError) throw dbError;

            setUploadStatus('success');
            onUploaded();
            setTimeout(resetForm, 2000);
        } catch (err) {
            console.error('Upload failed:', err);
            setUploadStatus('error');
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="admin-panel">
            <h2 className="admin-panel-title">
                <span>📤</span> Upload New Sample
            </h2>

            {uploadStatus === 'success' ? (
                <div className="admin-upload-success">
                    <div className="admin-success-icon">✅</div>
                    <p>Sample uploaded successfully!</p>
                    <button className="admin-btn admin-btn--secondary" onClick={resetForm}>
                        Upload Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleUpload} className="admin-upload-form">
                    <div className="admin-form-row">
                        <div className="admin-field">
                            <label className="admin-label">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="admin-input"
                                placeholder="e.g. Vishnu Temple Sculpting"
                                required
                            />
                        </div>
                        <div className="admin-field">
                            <label className="admin-label">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="admin-input"
                                placeholder="Optional short description"
                            />
                        </div>
                    </div>

                    <div className="admin-field">
                        <label className="admin-label">Image File *</label>
                        <div
                            className="admin-dropzone"
                            onClick={() => fileRef.current?.click()}
                        >
                            {preview ? (
                                <img src={preview} alt="Preview" className="admin-preview-img" />
                            ) : (
                                <div className="admin-dropzone-placeholder">
                                    <span className="admin-dropzone-icon">🖼️</span>
                                    <p>Click to select an image</p>
                                    <p className="admin-dropzone-sub">JPG, PNG, WebP supported</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFile}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="admin-form-actions">
                        <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            onClick={resetForm}
                            disabled={uploading}
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            className="admin-btn admin-btn--primary"
                            disabled={uploading || !file || !title.trim()}
                        >
                            {uploading ? (
                                <span className="admin-btn-spinner">
                                    <span className="spinner" /> Uploading...
                                </span>
                            ) : 'Upload to Supabase'}
                        </button>
                    </div>

                    {!supabase && (
                        <p className="admin-warn-banner">
                            ⚠️ Supabase not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}

// --- Samples List ---
function SamplesList({ refreshKey }) {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [deletingId, setDeletingId] = useState(null);

    const fetchSamples = async () => {
        if (!supabase) { setLoading(false); return; }
        setLoading(true);
        const { data, error: err } = await supabase
            .from('samples_data')
            .select('*')
            .order('created_at', { ascending: false });

        if (err) { setError(err.message); }
        else { setSamples(data || []); }
        setLoading(false);
    };

    useEffect(() => { fetchSamples(); }, [refreshKey]);

    const handleDelete = async (id, imageUrl) => {
        if (!confirm('Delete this sample permanently?')) return;
        setDeletingId(id);
        try {
            // Delete DB record
            await supabase.from('samples_data').delete().eq('id', id);

            // Optionally remove from storage
            if (imageUrl) {
                const filePath = imageUrl.split('/samples/')[1];
                if (filePath) {
                    await supabase.storage.from('samples').remove([filePath]);
                }
            }

            setSamples(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert(`Delete failed: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const startEdit = (sample) => {
        setEditingId(sample.id);
        setEditData({ title: sample.title, description: sample.description || '' });
    };

    const saveEdit = async (id) => {
        const { error: err } = await supabase
            .from('samples_data')
            .update({ title: editData.title, description: editData.description })
            .eq('id', id);

        if (err) { alert(`Save failed: ${err.message}`); return; }
        setSamples(prev => prev.map(s => s.id === id ? { ...s, ...editData } : s));
        setEditingId(null);
    };

    if (!supabase) {
        return (
            <div className="admin-panel">
                <h2 className="admin-panel-title"><span>📋</span> Samples Verification</h2>
                <p className="admin-warn-banner">⚠️ Supabase not configured. Please add environment variables to enable data management.</p>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2 className="admin-panel-title"><span>📋</span> All Samples ({samples.length})</h2>
                <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={fetchSamples}>
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="admin-loading">Loading samples...</div>
            ) : error ? (
                <p className="admin-error-msg">Error: {error}</p>
            ) : samples.length === 0 ? (
                <p className="admin-empty">No samples uploaded yet. Use the Upload panel above to add your first sample.</p>
            ) : (
                <div className="admin-samples-grid">
                    {samples.map(sample => (
                        <div key={sample.id} className="admin-sample-card">
                            <div className="admin-sample-thumb">
                                <img src={sample.image_url} alt={sample.title} loading="lazy" />
                            </div>

                            {editingId === sample.id ? (
                                <div className="admin-sample-edit">
                                    <input
                                        className="admin-input admin-input--sm"
                                        value={editData.title}
                                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                                        placeholder="Title"
                                    />
                                    <input
                                        className="admin-input admin-input--sm"
                                        value={editData.description}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        placeholder="Description"
                                    />
                                    <div className="admin-sample-actions">
                                        <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => saveEdit(sample.id)}>Save</button>
                                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-sample-info">
                                    <p className="admin-sample-title">{sample.title}</p>
                                    {sample.description && (
                                        <p className="admin-sample-desc">{sample.description}</p>
                                    )}
                                    <p className="admin-sample-date">
                                        {new Date(sample.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </p>
                                    <a href={sample.image_url} target="_blank" rel="noopener noreferrer" className="admin-sample-url">
                                        View Image ↗
                                    </a>
                                    <div className="admin-sample-actions">
                                        <button
                                            className="admin-btn admin-btn--secondary admin-btn--sm"
                                            onClick={() => startEdit(sample)}
                                        >✏️ Edit</button>
                                        <button
                                            className="admin-btn admin-btn--danger admin-btn--sm"
                                            onClick={() => handleDelete(sample.id, sample.image_url)}
                                            disabled={deletingId === sample.id}
                                        >
                                            {deletingId === sample.id ? '...' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Main Admin Page ---
export default function AdminPage() {
    const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
    const [refreshKey, setRefreshKey] = useState(0);

    const handleLogout = () => {
        sessionStorage.removeItem(SESSION_KEY);
        setAuthed(false);
    };

    if (!authed) {
        return <LoginGate onLogin={() => setAuthed(true)} />;
    }

    return (
        <div className="admin-wrapper">
            <header className="admin-header">
                <div className="admin-header-left">
                    <span className="admin-header-logo">🏛️</span>
                    <div>
                        <h1 className="admin-header-title">Admin Dashboard</h1>
                        <p className="admin-header-sub">P.K. Sompura Architecture</p>
                    </div>
                </div>
                <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <main className="admin-content">
                <UploadPanel onUploaded={() => setRefreshKey(k => k + 1)} />
                <SamplesList refreshKey={refreshKey} />
            </main>
        </div>
    );
}
