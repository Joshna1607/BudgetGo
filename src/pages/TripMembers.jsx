import React, { useState, useEffect } from 'react'
import { FiMail, FiUsers, FiX, FiCheckCircle, FiCheck } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useParams } from 'react-router-dom'
import api from '../config/api'
import './TripMembers.css'
import AddMemberModal from '../components/AddMemberModal'
import PollsComponent from '../components/PollsComponent'

const TripMembers = () => {
  const { user } = useAuth()
  const { tripId } = useParams()
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (tripId) {
      loadMembers()
      loadInvitations()
    }
  }, [tripId])

  const loadMembers = async () => {
    try {
      const result = await api.get(`/trip-members?tripId=${tripId}`)
      if (result.success) {
        // Fetch user details for each member
        const memberDetails = await Promise.all(
          result.data.map(async (member) => {
            const userResult = await api.get(`/users/${member.userId}`)
            return {
              ...member,
              userName: userResult.success ? userResult.data.name : 'Unknown',
              userEmail: userResult.success ? userResult.data.email : ''
            }
          })
        )
        setMembers(memberDetails)
      }
    } catch (err) {
      console.error('Failed to load members:', err)
    }
  }

  const loadInvitations = async () => {
    try {
      const result = await api.get(`/invitations/trip/${tripId}`)
      if (result.success) {
        setInvitations(result.data)
      }
    } catch (err) {
      console.error('Failed to load invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (emailToAdd) => {
    try {
      // Direct add endpoint
      const result = await api.post('/trip-members/add', {
        tripId: parseInt(tripId),
        email: emailToAdd
      })

      // Check for success (api wrapper structure dependent, assuming standard)
      if (result.success || result.id) {
        setSuccess(`Member added successfully: ${emailToAdd}`)
        setShowAddMemberModal(false)
        loadMembers()
      } else {
        setError(result.error || 'Failed to add member')
      }
    } catch (err) {
      setError('Failed to add member. Please check if the email exists.')
    }
  }

  const handleApproveMember = async (memberId) => {
    try {
      const result = await api.put(`/trip-members/${memberId}/approve`);
      if (result.success || result.id) {
        setSuccess('Member approved successfully');
        loadMembers();
      }
    } catch (err) {
      setError('Failed to approve member');
    }
  }

  const handleSendInvitation = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const result = await api.post('/invitations/send', {
        tripId: parseInt(tripId),
        invitedBy: user.id,
        email: email.trim()
      })

      if (result.success) {
        setSuccess(`Invitation sent successfully to ${email}`)
        setEmail('')
        setShowInviteForm(false)
        loadInvitations()
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('Failed to send invitation. Please try again.')
    }
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending' && !inv.isExpired)

  // Current user role logic
  const myMemberRecord = members.find(m => m.userId === user.id);
  const isOwner = myMemberRecord?.role === 'owner' || user.role === 'admin';

  return (
    <div className="trip-members">
      <div className="page-header">
        <div>
          <h1><FiUsers /> Trip Members</h1>
          <p>Manage members and send invitations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddMemberModal(true)}
          >
            <FiUsers /> Add Member Direct
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            <FiMail /> Invite via Email
          </button>
        </div>
      </div>

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        isLoading={false} // pass loading state if you want to track api call status
      />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FiCheckCircle /> {success}
        </div>
      )}

      {showInviteForm && (
        <div className="invite-form card">
          <h2>Invite New Member</h2>
          <form onSubmit={handleSendInvitation}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
              <small>An invitation link will be sent to this email</small>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowInviteForm(false)
                  setEmail('')
                  setError('')
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="members-section">
        <h2>Current Members</h2>
        <div className="members-list">
          {members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.userId}
                  </div>
                  <div>
                    <h3>User ID: {member.userId}</h3>
                    <p>Member ID: {member.id}</p>
                    {member.userName && <p className="text-sm text-gray-500">{member.userName}</p>}
                    {member.userEmail && <p className="text-xs text-gray-400">{member.userEmail}</p>}
                  </div>
                </div>
                <div className="member-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span className={`status-badge status-${member.status || 'active'}`}>
                      {member.status || 'active'}
                    </span>
                    <span className={`role-badge role-${member.role || 'member'}`}>
                      {member.role || 'member'}
                    </span>
                  </div>
                  {member.status === 'pending' && isOwner && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleApproveMember(member.id)}
                      style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiCheck /> Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No members yet. Invite someone to join!</p>
          )}
        </div>
      </div>

      <div className="polls-section-wrapper" style={{ marginTop: '2rem' }}>
        <PollsComponent tripId={tripId} currentUser={user} />
      </div>

      {pendingInvitations.length > 0 && (
        <div className="invitations-section">
          <h2>Pending Invitations</h2>
          <div className="invitations-list">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-info">
                  <FiMail />
                  <div>
                    <strong>{invitation.email}</strong>
                    <p>Invited on {new Date(invitation.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="status-badge status-pending">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TripMembers

