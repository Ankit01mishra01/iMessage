import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';

// ── helpers (pure, no logic change) ──────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// ── iMessage logo SVG ─────────────────────────────────────────────────────────
const Logo = () => (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#logoGrad)" />
        <path d="M8 11h24a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H22l-6 6v-6H8a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="white" opacity="0.95" />
    </svg>
);

// ── CollabIcon ────────────────────────────────────────────────────────────────
const CollabIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

// ── PlusIcon ──────────────────────────────────────────────────────────────────
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // ── data fetching (UNCHANGED) ─────────────────────────────────────────────
    const loadProjects = useCallback(() => {
        axios
            .get('/projects/all')
            .then((res) => setProjects(res.data.projects))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load projects'));
    }, []);

    const loadInvites = useCallback(() => {
        axios
            .get('/projects/invites/pending')
            .then((res) => setPendingInvites(res.data.invites || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadProjects();
        loadInvites();
    }, [loadProjects, loadInvites]);

    // ── handlers (UNCHANGED) ─────────────────────────────────────────────────
    function createProject(e) {
        e.preventDefault();
        setError('');

        const trimmedName = projectName.trim();
        if (!trimmedName) {
            setError('Project name is required.');
            return;
        }

        axios
            .post('/projects/create', { name: trimmedName })
            .then(() => {
                setIsModalOpen(false);
                setProjectName('');
                loadProjects();
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to create project');
                console.error('Create project error:', err.response?.data || err);
            });
    }

    function respondInvite(projectId, action) {
        axios
            .post('/projects/invite/respond', { projectId, action })
            .then(() => {
                loadInvites();
                loadProjects();
            })
            .catch((err) => setError(err.response?.data?.error || 'Failed to respond to invite'));
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <div className="im-root">
            {/* ── Navbar ── */}
            <header className="im-navbar">
                <div className="im-navbar-brand">
                    <Logo />
                    <span className="im-brand-name">iMessage</span>
                </div>
                <div className="im-navbar-right">
                    {user?.email && (
                        <span className="im-user-email">{user.email}</span>
                    )}
                    <button
                        className="im-btn-outline"
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('refreshToken');
                            navigate('/login');
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="im-main">
                {/* greeting */}
                <div className="im-greeting-block">
                    <p className="im-greeting-text">
                        {getGreeting()}{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
                    </p>
                    <h1 className="im-greeting-title">Your Projects</h1>
                </div>

                {/* error */}
                {error && (
                    <div className="im-error-bar">
                        <span>⚠ {error}</span>
                        <button onClick={() => setError('')}>✕</button>
                    </div>
                )}

                {/* pending invites */}
                {pendingInvites.length > 0 && (
                    <section className="im-invites-section">
                        <h2 className="im-invites-title">
                            <span className="im-invite-badge">{pendingInvites.length}</span>
                            Pending Invites
                        </h2>
                        {pendingInvites.map((invite) => (
                            <div key={invite._id} className="im-invite-row">
                                <span className="im-invite-name">{invite.name}</span>
                                <div className="im-invite-actions">
                                    <button
                                        className="im-btn-accept"
                                        onClick={() => respondInvite(invite._id, 'accept')}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="im-btn-reject"
                                        onClick={() => respondInvite(invite._id, 'reject')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* project grid */}
                <div className="im-project-grid">
                    {/* new project card */}
                    <button
                        className="im-new-project-card"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <span className="im-new-project-icon"><PlusIcon /></span>
                        <span className="im-new-project-label">New Project</span>
                    </button>

                    {/* existing projects */}
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className="im-project-card"
                            onClick={() => navigate('/project', { state: { project } })}
                        >
                            <div className="im-project-card-accent" />
                            <div className="im-project-card-body">
                                <h2 className="im-project-name">{project.name}</h2>
                                <div className="im-project-meta">
                                    <CollabIcon />
                                    <span>{project.users?.length || 0} collaborator{project.users?.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            <div className="im-project-card-arrow">→</div>
                        </div>
                    ))}

                    {/* empty state */}
                    {projects.length === 0 && (
                        <div className="im-empty-state">
                            <div className="im-empty-icon">
                                <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="12" fill="#1A1A2E" />
                                    <path d="M8 11h24a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H22l-6 6v-6H8a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z" fill="#7C3AED" opacity="0.4" />
                                </svg>
                            </div>
                            <p className="im-empty-title">No projects yet</p>
                            <p className="im-empty-sub">Create your first project to get started</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── Modal ── */}
            {isModalOpen && (
                <div className="im-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="im-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="im-modal-header">
                            <h2 className="im-modal-title">Create New Project</h2>
                            <button className="im-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={createProject}>
                            <div className="im-form-group">
                                <label className="im-label">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text"
                                    className="im-input"
                                    placeholder="e.g. My Chat App"
                                    required
                                />
                            </div>
                            <div className="im-modal-footer">
                                <button
                                    type="button"
                                    className="im-btn-ghost"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="im-btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;