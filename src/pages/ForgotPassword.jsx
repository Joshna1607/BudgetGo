import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import api from '../config/api'
import './Login.css'

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await api.post('/send-otp', { email });
            if (res.success || res.message) {
                setStep(2);
                setMessage('OTP sent to your email.');
            } else {
                setError(res.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setError('Failed to send OTP. Please check your email.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/reset-password', { email, otp, newPassword });
            if (res.success || res.message) {
                setMessage('Password reset successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(res.error || 'Failed to reset password.');
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP or Request Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <Logo size="large" showText={true} />
                        <p>Reset your password</p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="login-form">
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="login-form">
                            <div className="success-message" style={{ marginBottom: '1rem', color: 'green' }}>{message}</div>
                            <div className="input-group">
                                <label>Enter OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Check your email for OTP"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    minLength={6}
                                    required
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    <div className="login-footer">
                        <Link to="/login" className="link">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
