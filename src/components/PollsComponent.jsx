import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiPlus, FiCheck } from 'react-icons/fi';
import api from '../config/api';

const PollsComponent = ({ tripId, currentUser }) => {
    const [polls, setPolls] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPolls();
    }, [tripId]);

    const loadPolls = async () => {
        try {
            const result = await api.get(`/polls/trip/${tripId}`);
            if (result.success || Array.isArray(result)) {
                // Adjust depending on api wrapper, assuming it returns data directly if success
                setPolls(Array.isArray(result) ? result : result.data);
            }
        } catch (err) {
            console.error('Failed to load polls', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        const validOptions = newOptions.filter(o => o.trim() !== '');

        if (!newQuestion.trim() || validOptions.length < 2) return;

        try {
            const result = await api.post('/polls', {
                tripId: parseInt(tripId),
                createdBy: currentUser.id,
                question: newQuestion,
                options: validOptions
            });

            if (result.success || result.id) {
                setNewQuestion('');
                setNewOptions(['', '']);
                setShowCreateForm(false);
                loadPolls();
            }
        } catch (err) {
            console.error('Failed to create poll', err);
        }
    };

    const handleVote = async (optionId) => {
        try {
            const result = await api.post(`/polls/vote/${optionId}`);
            if (result.success || result.id) {
                loadPolls(); // Reload to see updated counts
            }
        } catch (err) {
            console.error('Failed to vote', err);
        }
    };

    const addOptionField = () => {
        setNewOptions([...newOptions, '']);
    };

    const updateOption = (index, value) => {
        const updated = [...newOptions];
        updated[index] = value;
        setNewOptions(updated);
    };

    return (
        <div className="polls-section card" style={{ marginTop: '2rem' }}>
            <div className="flex justify-between items-center mb-4">
                <h2><FiBarChart2 /> Trip Polls</h2>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    <FiPlus /> New Poll
                </button>
            </div>

            {showCreateForm && (
                <form onSubmit={handleCreatePoll} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-indigo-100">
                    <div className="mb-3">
                        <label className="block text-sm font-bold mb-1">Question</label>
                        <input
                            type="text"
                            className="w-full p-2 rounded border"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Where should we go for dinner?"
                            required
                        />
                    </div>
                    <div className="space-y-2 mb-3">
                        <label className="block text-sm font-bold">Options</label>
                        {newOptions.map((opt, idx) => (
                            <input
                                key={idx}
                                type="text"
                                className="w-full p-2 rounded border"
                                value={opt}
                                onChange={(e) => updateOption(idx, e.target.value)}
                                placeholder={`Option ${idx + 1}`}
                                required={idx < 2}
                            />
                        ))}
                        <button type="button" onClick={addOptionField} className="text-sm text-indigo-600 hover:text-indigo-800">
                            + Add Option
                        </button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-sm btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-sm btn-primary">Create Poll</button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {polls.length === 0 ? (
                    <p className="text-gray-500 italic">No polls yet. Create one to start deciding!</p>
                ) : (
                    polls.map(poll => (
                        <div key={poll.id} className="poll-card border rounded-lg p-4">
                            <h3 className="font-bold text-lg mb-3">{poll.question}</h3>
                            <div className="space-y-2">
                                {poll.options.map(option => {
                                    const totalVotes = poll.options.reduce((sum, o) => sum + (o.voteCount || 0), 0);
                                    const percentage = totalVotes === 0 ? 0 : Math.round(((option.voteCount || 0) / totalVotes) * 100);

                                    return (
                                        <div key={option.id} className="relative">
                                            <button
                                                onClick={() => handleVote(option.id)}
                                                className="w-full text-left p-3 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative overflow-hidden z-10"
                                            >
                                                <div className="flex justify-between items-center z-20 relative">
                                                    <span className="font-medium">{option.text}</span>
                                                    <span className="text-sm font-bold">{option.voteCount || 0} ({percentage}%)</span>
                                                </div>
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-indigo-200 dark:bg-indigo-900 opacity-50 z-0 transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-2 text-xs text-gray-400 text-right">
                                {new Date(poll.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PollsComponent;
