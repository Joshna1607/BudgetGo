import React, { useState, useEffect } from 'react'
import { FiPlus, FiDollarSign, FiPieChart, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import api from '../config/api'
import { DEMO_DATA } from '../data/demoData'
import './ExpenseManager.css'

const ExpenseManager = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState('')
  const [groupMembers, setGroupMembers] = useState([]) // Initialize empty
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: '',
    description: '',
    splitAmong: 2,
    paidBy: 'You'
  })

  const [activeTrip, setActiveTrip] = useState(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user || !user.id) {
      setLoading(false)
      return
    }

    // DEMO MODE CHECK
    if (user.isDemo) {
      setExpenses(DEMO_DATA.expenses)
      setGroupMembers(['You', 'Friend', 'John', 'Sarah']) // Demo members
      if (DEMO_DATA.trips.length > 0) {
        setActiveTrip(DEMO_DATA.trips[0])
      }
      setLoading(false)
      return
    }

    try {
      // Load active trip
      const tripsResult = await api.get(`/trips?userId=${user.id}`)
      let currentTrip = null
      if (tripsResult.success && tripsResult.data && tripsResult.data.length > 0) {
        currentTrip = tripsResult.data[0]
        setActiveTrip(currentTrip)

        // Load Trip Members
        const membersResult = await api.get(`/trip-members?tripId=${currentTrip.id}`)
        if (membersResult.success && membersResult.data) {
          const memberNames = membersResult.data.map(m => m.user ? m.user.name : 'Unknown')
          // Ensure 'You' refers to current user, but maybe simple names are better
          // Or map to specific names. For now, let's use the names from DB.
          // Filter out duplicates if any
          setGroupMembers([...new Set(memberNames)])
        }
      }

      // Load expenses
      const result = await api.get(`/expenses?userId=${user.id}`)
      if (result.success) {
        setExpenses(result.data || [])
      } else {
        setError(result.error || 'Failed to load expenses')
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Accommodation', 'Food', 'Transportation', 'Activities', 'Shopping', 'Other']

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const budget = activeTrip ? (activeTrip.budget || 0) : 0
  const remaining = budget - totalExpenses
  const percentageUsed = budget > 0 ? (totalExpenses / budget) * 100 : 0

  // Expenses By Category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!user || !user.id) {
      setError('Please login to add expenses')
      return
    }

    try {
      const expenseData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        splitAmong: parseInt(formData.splitAmong) || 1,
        paidBy: formData.paidBy,
        userId: user.id,
        tripId: null // Can be set if trip is selected
      }

      const result = await api.post('/expenses', expenseData)
      if (result.success) {
        setExpenses([...expenses, result.data])
        setFormData({ category: '', amount: '', date: '', description: '', splitAmong: 2, paidBy: 'You' })
        setShowAddForm(false)
      } else {
        setError(result.error || 'Failed to add expense')
      }
    } catch (err) {
      setError('Failed to add expense. Please try again.')
    }
  }

  // Calculate per-person expenses
  const calculatePerPersonExpenses = () => {
    const perPerson = {}
    expenses.forEach(expense => {
      const splitCount = expense.splitAmong || 1
      const perPersonAmount = expense.amount / splitCount

      groupMembers.forEach(member => {
        if (!perPerson[member]) {
          perPerson[member] = 0
        }
        // If this member is part of the split
        if (splitCount <= groupMembers.length) {
          perPerson[member] += perPersonAmount
        }
      })
    })
    return perPerson
  }

  const perPersonExpenses = calculatePerPersonExpenses()
  const totalPerPerson = Object.values(perPersonExpenses).reduce((sum, val) => sum + val, 0)

  return (
    <div className="expense-manager">
      <div className="page-header">
        <div>
          <h1>Expense Manager</h1>
          <p>Track expenses for {activeTrip ? activeTrip.tripName : 'your trips'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <FiPlus /> Add Expense
        </button>
      </div>

      <div className="expense-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3>{formatINR(totalExpenses)}</h3>
            <p>Total Spent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#28a74520', color: '#28a745' }}>
            <FiTrendingDown />
          </div>
          <div className="stat-content">
            <h3>{formatINR(remaining)}</h3>
            <p>Remaining Budget</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ffc10720', color: '#ffc107' }}>
            <FiPieChart />
          </div>
          <div className="stat-content">
            <h3>{percentageUsed.toFixed(1)}%</h3>
            <p>Budget Used</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          color: '#dc3545',
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#f8d7da',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="add-expense-form card">
          <h2>Add New Expense</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="amount">Amount (₹)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter expense description"
                required
              />
            </div>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="splitAmong">Split Among (People)</label>
                <input
                  type="number"
                  id="splitAmong"
                  name="splitAmong"
                  value={formData.splitAmong}
                  onChange={handleChange}
                  min="1"
                  max={groupMembers.length}
                  required
                />
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Per person: ₹{formData.amount ? (parseFloat(formData.amount) / (parseInt(formData.splitAmong) || 1)).toLocaleString('en-IN') : '0'}
                </small>
              </div>
              <div className="input-group">
                <label htmlFor="paidBy">Paid By</label>
                <select
                  id="paidBy"
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  required
                >
                  {groupMembers.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="expense-content">
        <div className="expense-list card">
          <h2>Recent Expenses</h2>
          <div className="expenses-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Split Details</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => {
                  const perPerson = expense.perPersonCost || (expense.amount / (expense.splitAmong || 1))
                  return (
                    <tr key={expense.id}>
                      <td>{expense.date}</td>
                      <td>
                        <span className="category-badge">{expense.category}</span>
                      </td>
                      <td>{expense.description}</td>
                      <td className="amount">{formatINR(expense.amount)}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div>Split: {expense.splitAmong || 1} people</div>
                          <div style={{ color: '#667eea', fontWeight: 'bold' }}>
                            ₹{perPerson.toLocaleString('en-IN')}/person
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            Paid by: {expense.paidBy || 'You'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="expense-chart card">
          <h2>Expenses by Category</h2>
          <div className="chart-container">
            {Object.entries(expensesByCategory).map(([category, amount]) => {
              const percentage = (amount / totalExpenses) * 100
              return (
                <div key={category} className="chart-item">
                  <div className="chart-header">
                    <span className="chart-label">{category}</span>
                    <span className="chart-value">{formatINR(amount)}</span>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="per-person-expenses card">
          <h2>Per-Person Expense Summary</h2>
          <div className="per-person-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {Object.entries(perPersonExpenses).map(([member, amount]) => (
              <div key={member} style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px solid #dee2e6'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  {member}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                  {formatINR(amount)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '2px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total Group Expenses:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
              {formatINR(totalExpenses)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseManager

