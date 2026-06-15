import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <defs>
            <linearGradient id="lp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
        </defs>

        <rect width="40" height="40" rx="12" fill="url(#lp-grad)" />

        <path
            d="M8 11h24a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H22l-6 6v-6H8a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2z"
            fill="white"
        />
    </svg>
);

const features = [
    {
        icon: '⚡',
        title: 'Real-time Messaging',
        desc: 'Instant messages powered by WebSockets. Zero lag, always in sync.',
    },
    {
        icon: '🤖',
        title: 'AI Integration',
        desc: 'Summon AI mid-conversation with @ai.',
    },
    {
        icon: '👥',
        title: 'Team Collaboration',
        desc: 'Invite collaborators to projects.',
    },
    {
        icon: '🔒',
        title: 'Secure by Default',
        desc: 'JWT auth and refresh tokens.',
    },
];

const Landing = () => {
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    return (
        <div className="lp-root">
            {/* Navbar */}

            <header className="lp-navbar">
                <div className="lp-navbar-brand">
                    <Logo />
                    <span className="lp-brand-name">iMessage</span>
                </div>

                <div className="lp-navbar-actions">
                    {token ? (
                        <button
                            className="lp-btn-primary"
                            onClick={() => navigate('/')}
                        >
                            Go To Workspace →
                        </button>
                    ) : (
                        <>
                            <button
                                className="lp-btn-ghost"
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </button>

                            <button
                                className="lp-btn-primary"
                                onClick={() => navigate('/register')}
                            >
                                Get Started
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero */}

            <section className="lp-hero">
                <div className="lp-hero-badge">
                    ✦ AI-Powered Chat Platform
                </div>

                <h1 className="lp-hero-title">
                    Collaborate smarter.
                    <br />
                    <span className="lp-hero-accent">
                        Chat with AI.
                    </span>
                </h1>

                <p className="lp-hero-sub">
                    iMessage brings your team and AI together in one seamless
                    workspace.
                </p>

                <div className="lp-hero-cta">
                    {token ? (
                        <button
                            className="lp-btn-primary lp-btn-lg"
                            onClick={() => navigate('/')}
                        >
                            Go To Workspace →
                        </button>
                    ) : (
                        <>
                            <button
                                className="lp-btn-primary lp-btn-lg"
                                onClick={() => navigate('/register')}
                            >
                                Start for free →
                            </button>

                            <button
                                className="lp-btn-outline lp-btn-lg"
                                onClick={() => navigate('/login')}
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>

                {/* Preview */}

                <div className="lp-preview">
                    <div className="lp-preview-bar">
                        <span className="lp-preview-title">
                            project-alpha
                        </span>
                    </div>

                    <div className="lp-preview-body">
                        <div className="lp-msg">
                            Hey team, can someone explain the auth flow?
                        </div>

                        <div className="lp-msg">
                            AI: JWT + Refresh Token Rotation
                        </div>

                        <div className="lp-msg">
                            Perfect 🎯
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}

            <section className="lp-features">
                <h2 className="lp-section-title">
                    Everything your team needs
                </h2>

                <div className="lp-feature-grid">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="lp-feature-card"
                        >
                            <div>{feature.icon}</div>

                            <h3>{feature.title}</h3>

                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}

            <section className="lp-cta-banner">
                <h2>Ready to get started?</h2>

                <p>Join your team on iMessage today.</p>

                <button
                    className="lp-btn-primary lp-btn-lg"
                    onClick={() =>
                        navigate(token ? '/' : '/register')
                    }
                >
                    {token
                        ? 'Go To Workspace →'
                        : 'Create your workspace →'}
                </button>
            </section>

            {/* Footer */}

            <footer className="lp-footer">
                <div className="lp-footer-brand">
                    <Logo />
                    <span className="lp-brand-name">
                        iMessage
                    </span>
                </div>

                <p>© 2026 iMessage. Built by Ankit Mishra</p>
            </footer>
        </div>
    );
};

export default Landing;