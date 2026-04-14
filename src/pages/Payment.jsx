import React, { useState, useEffect } from 'react'
import { FiCreditCard, FiLock, FiCheck, FiDollarSign } from 'react-icons/fi'
import { formatINR } from '../utils/currency'
import './Payment.css'

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const hotelBooking = 37500
  const serviceFee = 830
  const totalAmount = hotelBooking + serviceFee
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    amount: totalAmount
  })

  useEffect(() => {
    // Load payment history
    const storedPayments = JSON.parse(localStorage.getItem('payments') || '[]')
    setPaymentHistory(storedPayments)
  }, [])

  const handleChange = (e) => {
    const value = e.target.value
    if (e.target.name === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      setFormData({ ...formData, [e.target.name]: formatted })
    } else if (e.target.name === 'expiryDate') {
      // Format expiry date as MM/YY
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
      setFormData({ ...formData, [e.target.name]: formatted })
    } else {
      setFormData({ ...formData, [e.target.name]: value })
    }
  }

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async () => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js')

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?')
      return
    }

    try {
      // 1. Create Order on Backend
      // In a real flow, we might create a 'Booking' first, then pay for it.
      // Here we auto-generate an order for the total amount.
      const orderData = {
        amount: totalAmount,
        currency: 'INR',
        receipt: 'receipt_' + Date.now(),
        userId: 1, // Replace with actual user ID from auth context
        // For now using mock user ID 1 or current user
      }

      // We can reuse the createPayment endpoint to Generate Order ID if we send empty orderId?
      // Or better, we call a dedicated /api/payments/order endpoint?
      // Based on my backend change: createPayment generates orderId if missing.
      // BUT createPayment also saves the payment as 'Pending'.

      // Let's create a Pending payment to get the Order ID
      const initPaymentRes = await fetch('http://localhost:8080/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          method: 'Razorpay',
          status: 'Created',
          userId: 1, // TODO: Use real user ID
          tripId: 1 // TODO: Use real trip ID if available
        })
      });
      const initPaymentData = await initPaymentRes.json();

      if (!initPaymentData || !initPaymentData.orderId) {
        alert('Server error: Could not create order');
        return;
      }

      const options = {
        key: 'rzp_test_YOUR_KEY_HERE', // TODO: Get from env or backend public config
        amount: initPaymentData.amount * 100,
        currency: 'INR',
        name: 'BudgetGo',
        description: 'Trip Transaction',
        image: '/vite.svg', // Optional logo
        order_id: initPaymentData.orderId,
        handler: async function (response) {
          // 2. Verify Payment on Backend
          const verifyRes = await fetch(`http://localhost:8080/api/payments/${initPaymentData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              status: 'Success'
            })
          });

          const verifyData = await verifyRes.json();

          setPaymentStatus({ success: true, message: 'Payment Successful!' });

          // Update History Local State
          const paymentRecord = {
            id: response.razorpay_payment_id,
            amount: totalAmount,
            method: 'Razorpay',
            status: 'Success',
            date: new Date().toISOString()
          };
          setPaymentHistory(prev => [...prev, paymentRecord]);
        },
        prefill: {
          name: 'BudgetGo User',
          email: 'user@budgetgo.com',
          contact: '9999999999'
        },
        theme: {
          color: '#667eea'
        }
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()

    } catch (error) {
      console.error(error);
      setPaymentStatus({ success: false, message: 'Payment initiation failed.' })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment()
    } else {
      // Simulate other payment methods
      const paymentData = {
        id: `pay_${Date.now()}`,
        amount: totalAmount,
        method: paymentMethod === 'card' ? 'Card' : paymentMethod,
        status: 'Success',
        date: new Date().toISOString()
      }

      const payments = JSON.parse(localStorage.getItem('payments') || '[]')
      payments.push(paymentData)
      localStorage.setItem('payments', JSON.stringify(payments))
      setPaymentHistory(payments)
      setPaymentStatus({ success: true, message: 'Payment processed successfully!' })
    }
  }

  const paymentMethods = [
    { id: 'razorpay', name: 'Razorpay (Recommended)', icon: FiCreditCard },
    { id: 'card', name: 'Credit/Debit Card', icon: FiCreditCard },
    { id: 'bank', name: 'Bank Transfer', icon: FiCreditCard },
  ]

  return (
    <div className="payment">
      <div className="page-header">
        <h1>Payment</h1>
        <p>Secure payment processing</p>
      </div>

      <div className="payment-content">
        <div className="payment-summary card">
          <h2>Payment Summary</h2>
          <div className="summary-item">
            <span>Hotel Booking</span>
            <span>{formatINR(hotelBooking)}</span>
          </div>
          <div className="summary-item">
            <span>Service Fee</span>
            <span>{formatINR(serviceFee)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <span>Total Amount</span>
            <span>{formatINR(totalAmount)}</span>
          </div>
          <div className="security-badge">
            <FiLock />
            <span>Secure Payment</span>
          </div>
        </div>

        <div className="payment-form-container card">
          <h2>Payment Method</h2>
          <div className="payment-methods">
            {paymentMethods.map(method => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  className={`payment-method-btn ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <Icon />
                  <span>{method.name}</span>
                </button>
              )
            })}
          </div>

          {paymentStatus && (
            <div className={`payment-status ${paymentStatus.success ? 'success' : 'error'}`} style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              backgroundColor: paymentStatus.success ? '#d4edda' : '#f8d7da',
              color: paymentStatus.success ? '#155724' : '#721c24',
              border: `1px solid ${paymentStatus.success ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {paymentStatus.success ? <FiCheck /> : '✕'} {paymentStatus.message}
            </div>
          )}

          {paymentMethod === 'razorpay' && (
            <div className="payment-razorpay">
              <div style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Secure Payment via Razorpay</h3>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                  You will be redirected to Razorpay's secure payment gateway to complete your transaction.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleRazorpayPayment}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                <FiLock /> Pay {formatINR(totalAmount)} with Razorpay
              </button>
            </div>
          )}

          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="input-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="cardName">Cardholder Name</label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                <FiLock /> Pay {formatINR(totalAmount)}
              </button>
            </form>
          )}

          {paymentMethod === 'paypal' && (
            <div className="payment-alternative">
              <p>You will be redirected to PayPal to complete your payment.</p>
              <button className="btn btn-primary btn-full">
                Continue to PayPal
              </button>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="payment-alternative">
              <p>Bank transfer details will be sent to your email after booking confirmation.</p>
              <button className="btn btn-primary btn-full">
                Confirm Booking
              </button>
            </div>
          )}
        </div>

        {paymentHistory.length > 0 && (
          <div className="payment-history card">
            <h2>Payment History</h2>
            <div className="payment-history-list">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payment ID</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.slice(0, 5).map(payment => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '0.75rem' }}>{payment.id.substring(0, 15)}...</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                        {formatINR(payment.amount)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{payment.method}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          backgroundColor: payment.status === 'Success' ? '#28a74520' : '#dc354520',
                          color: payment.status === 'Success' ? '#28a745' : '#dc3545'
                        }}>
                          {payment.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#666' }}>
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Payment

