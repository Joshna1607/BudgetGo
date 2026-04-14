import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiCheckCircle, FiUsers, FiCreditCard, FiArrowRight, FiActivity } from 'react-icons/fi';
import './Landing.css'; // We'll create a specific CSS if needed, but using global class names mostly

const Landing = () => {
    // Add simple animation on scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-up');
                }
            });
        });

        document.querySelectorAll('.fade-in-section').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container hero-content text-center">
                    <h1 className="hero-title fade-in-section">
                        Travele Smarter. <br />
                        <span className="text-gradient">Plan Better.</span>
                    </h1>
                    <p className="hero-subtitle fade-in-section">
                        The all-in-one platform for effortless trip planning, real-time budgeting,
                        and seamless group coordination. Use AI to discover your next adventure.
                    </p>
                    <div className="hero-actions fade-in-section">
                        <Link to="/create-trip" className="btn btn-primary btn-lg">
                            Start Planning <FiArrowRight />
                        </Link>
                        <Link to="/register" className="btn btn-secondary btn-lg">
                            Create Account
                        </Link>
                        <Link to="/login" className="btn btn-secondary btn-lg" style={{ marginLeft: '10px' }}>
                            Login
                        </Link>
                    </div>
                </div>
            </section>


            {/* Core Features */}
            <section className="features-section container fade-in-section">
                <div className="section-header text-center">
                    <h2 className="section-title">Why Choose BudgetGo?</h2>
                    <p className="section-desc">We handle the chaos, you enjoy the journey.</p>
                </div>

                <div className="grid grid-3">
                    <div className="feature-card">
                        <div className="feature-icon bg-primary-soft"><FiActivity /></div>
                        <h3>AI-Powered Itineraries</h3>
                        <p>Get personalized day-by-day plans, train suggestions, and real hotel recommendations based on your mood and budget.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-success-soft"><FiCreditCard /></div>
                        <h3>Smart Budget Tracking</h3>
                        <p>Real-time expense splitting, budget alerts, and automated categorization so you never overspend.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon bg-accent-soft"><FiUsers /></div>
                        <h3>Collaborative Groups</h3>
                        <p>Invite friends, vote on plans, chat in real-time, and split bills effortlessly. No more "who owes whom".</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works bg-slate fade-in-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>How It Works</h2>
                    </div>
                    <div className="steps-container">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <h3>Create a Trip</h3>
                            <p>Enter your destination, dates, and budget.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <h3>Invite Friends</h3>
                            <p>Share the link and start planning together.</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <h3>Enjoy & Track</h3>
                            <p>Follow the itinerary and track expenses.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="cta-section container text-center fade-in-section">
                <div className="cta-box">
                    <h2>Ready to explore the world?</h2>
                    <p>Join thousands of smart travelers using BudgetGo today.</p>
                    <Link to="/register" className="btn btn-primary btn-lg">Get Started for Free</Link>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="footer bg-dark">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <h2>BudgetGo</h2>
                        <p>Making travel accessible and organized for everyone.</p>
                    </div>
                    <div className="footer-copy">
                        &copy; 2024 BudgetGo Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
