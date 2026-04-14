import React, { useState } from 'react';
import { FiX, FiLoader, FiUserPlus } from 'react-icons/fi';
import { validateEmail } from '../utils/emailUtils';
import './AddMemberModal.css';

const AddMemberModal = ({ isOpen, onClose, onAddMember, isLoading }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    // Use local loading state to handle the async operation
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Validation using shared utility
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            setError(emailValidation.error);
            return;
        }

        setIsSubmitting(true);

        // 2. Call parent handler and await result
        try {
            const result = await onAddMember(email);

            if (result && result.success) {
                // Success: Clear and close
                setEmail('');
                setError('');
                onClose();
            } else {
                // Failure: Show error from backend (or default)
                // If backend says user not found, we show "Please check your email ID" as requested
                const errorMsg = result?.error || 'Failed to add member';
                if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('exist')) {
                    setError('Please check your email ID');
                } else {
                    setError(errorMsg);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2><FiUserPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Add Trip Member</h2>
                    <button onClick={onClose} className="close-btn">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="input-group">
                            <label htmlFor="email">Member Email</label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                placeholder="friend@example.com"
                                autoFocus
                                className={error ? 'input-error' : ''}
                            />
                            {error && <p className="error-text" style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={isSubmitting || isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="btn btn-primary"
                        >
                            {(isSubmitting || isLoading) ? (
                                <>
                                    <FiLoader className="animate-spin" /> Adding...
                                </>
                            ) : (
                                'Add Member'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
