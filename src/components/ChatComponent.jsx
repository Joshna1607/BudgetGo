import React, { useState, useEffect, useRef } from 'react';
import ChatService from '../utils/ChatService';
import '../index.css'; // Ensure we have access to styles

const ChatComponent = ({ tripId, currentUser, onClose, onAddMember }) => {
    const [messages, setMessages] = useState([]);
    // ... (existing code omitted for brevity) ...

    return (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Trip Chat</h3>
                </div>
                <div className="flex items-center gap-2">
                    {onAddMember && (
                        <button onClick={onAddMember} className="hover:bg-white/20 rounded-full p-1" title="Add Member">
                            <svg xmlns="http://www.w3.org/2001/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0 1 1 0 002 0zM16 9a1 1 0 10-2 0 1 1 0 002 0zM15.293 7.293a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L16 9.414V13a1 1 0 11-2 0V9.414l-2.293 2.293a1 1 0 01-1.414-1.414l3-3z" />
                                {/* Reusing a user-plus-like path or standard svg */}
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                        </button>
                    )}
                    <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2001/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                        <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-2 text-sm ${isMe
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                                }`}>
                                {!isMe && <span className="text-xs font-bold block mb-1 opacity-75">{msg.senderName}</span>}
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
                <button
                    onClick={handleSend}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2001/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;
