import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FiSend, FiUser, FiUsers, FiPlus } from 'react-icons/fi'
import api from '../config/api'
import AddMemberModal from '../components/AddMemberModal'
import ChatService from '../utils/ChatService'
import './Chat.css'

const Chat = () => {
  const { user } = useAuth()
  const [tripId, setTripId] = useState(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  // State for real attributes
  const [messages, setMessages] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)

  // Fetch trip ID for current user
  useEffect(() => {
    const fetchDefaultTrip = async () => {
      if (user && user.id) {
        try {
          const response = await api.get(`/trips?userId=${user.id}`)
          if (response.success && response.data && response.data.length > 0) {
            setTripId(response.data[0].id)
          }
        } catch (e) {
          console.error("Failed to fetch default trip for chat", e)
        }
      }
    }
    fetchDefaultTrip()
  }, [user])

  // Fetch Chat History & Connect
  useEffect(() => {
    const initChat = async () => {
      if (!user || !user.id || !tripId) return;

      try {
        // 2. Fetch Members
        const membersRes = await api.get(`/trip-members?tripId=${tripId}`);
        if (membersRes.success && membersRes.data) {
          // Map to a structure suitable for display (e.g. { id, name, ... })
          // The API returns TripMember objects which contain a User object
          const members = membersRes.data.map(m => ({
            id: m.user ? m.user.id : m.id, // Fallback
            name: m.user ? m.user.name : 'Unknown',
            email: m.user ? m.user.email : '',
            role: m.role
          }));
          setGroupMembers(members);
        }

        // 3. Fetch History
        const historyRes = await api.get(`/chat/${tripId}`);
        if (Array.isArray(historyRes)) {
          setMessages(historyRes);
        }

        // 4. Connect WebSocket
        const token = localStorage.getItem('token');
        ChatService.connect(tripId, token, (msg) => {
          setMessages(prev => [...prev, msg]);
        });
        setIsConnected(true);

      } catch (error) {
        console.error("Chat init failed", error);
      }
    }

    initChat();

    return () => {
      ChatService.disconnect();
      setIsConnected(false);
    }
  }, [user, tripId]);

  const handleAddMember = async (emailToAdd) => {
    try {
      if (!tripId) {
        return { success: false, error: 'No active trip to add member to.' };
      }
      const result = await api.post('/trip-members/add', {
        tripId: parseInt(tripId),
        email: emailToAdd
      })

      if (result.success || result.id) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to add member' };
      }
    } catch (err) {
      console.error("Add member failed", err)
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (newMessage.trim() && tripId) {
      ChatService.sendMessage(newMessage, user.id, user.name);
      setNewMessage('')
    }
  }

  return (
    <div className="chat">
      <div className="page-header">
        <h1>Group Chat</h1>
        <p>Chat with your trip members in real-time</p>
      </div>

      <div className="chat-container">
        <div className="chat-sidebar">
          <h3>
            <FiUsers /> Group Members
          </h3>
          <div className="chat-list">
            {groupMembers.map((member, idx) => (
              <div key={idx} className={`chat-item ${member.id === user?.id ? 'active' : ''}`}>
                <div className="chat-avatar"><FiUser /></div>
                <div className="chat-info">
                  <h4>{member.name} {member.id === user?.id ? '(You)' : ''}</h4>
                  <p className="status-online">{member.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>

          {tripId && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => setShowAddMemberModal(true)}
            >
              <FiPlus /> Add Member
            </button>
          )}
        </div>

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
          isLoading={false}
        />

        <div className="chat-main">
          <div className="chat-header">
            <div className="chat-user-info">
              <div className="chat-avatar" style={{ background: '#667eea', color: 'white' }}>
                <FiUsers />
              </div>
              <div>
                <h3>Trip Group Chat</h3>
                <p className="status-online">{isConnected ? 'Connected' : 'Connecting...'}</p>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message, idx) => {
              const senderId = message.senderId || message.userId;
              const isCurrentUser = String(senderId) === String(user?.id);

              const senderName = message.senderName || message.name || ((isCurrentUser ? 'You' : 'Unknown'));
              const content = message.content || message.text;

              let timeStr = "";
              if (message.timestamp) {
                timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else if (message.time) {
                timeStr = message.time;
              }

              return (
                <div key={message.id || idx} className={`message ${isCurrentUser ? 'me' : 'other'}`}>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-name">
                        {senderName}
                      </span>
                      <span className="message-time">{timeStr}</span>
                    </div>
                    <div className="message-text">{content}</div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSend}>
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!isConnected}
            />
            <button type="submit" className="chat-send-btn" disabled={!isConnected || !newMessage.trim()}>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat
