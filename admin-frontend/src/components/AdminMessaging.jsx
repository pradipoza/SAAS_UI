import React, { useState, useEffect } from 'react'
import { adminMessaging } from '../services/apiService'

const AdminMessaging = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState(null)
  const [newMessage, setNewMessage] = useState({
    clientId: '',
    subject: '',
    message: '',
    priority: 'NORMAL'
  })
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadMessages()
    loadUnreadCount()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      console.log('🔍 AdminMessaging: Loading messages...')
      const response = await adminMessaging.getMessages()
      console.log('📦 AdminMessaging: Raw response:', response)
      console.log('📦 AdminMessaging: Response data:', response.data)
      console.log('📦 AdminMessaging: Messages array:', response.data.messages)
      setMessages(response.data.messages || [])
      console.log('✅ AdminMessaging: Messages set to state:', response.data.messages?.length || 0, 'messages')
    } catch (error) {
      console.error('❌ AdminMessaging: Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await adminMessaging.getUnreadCount()
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.clientId || !newMessage.message.trim()) return

    try {
      setSending(true)
      await adminMessaging.sendMessage(newMessage)
      setNewMessage({
        clientId: '',
        subject: '',
        message: '',
        priority: 'NORMAL'
      })
      loadMessages()
      loadUnreadCount()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await adminMessaging.markAsRead(messageId)
      loadMessages()
      loadUnreadCount()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'NORMAL': return 'text-blue-600 bg-blue-50'
      case 'LOW': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRoleColor = (role) => {
    return role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Messaging</h2>
          <p className="text-gray-600">Communicate with clients</p>
        </div>
        <div className="flex items-center space-x-4">
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Send Message to Client</h3>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={newMessage.clientId}
                onChange={(e) => setNewMessage({ ...newMessage, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Message subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newMessage.priority}
                onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message here..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Recent Messages</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No messages yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(message.sender.role)}`}>
                            {message.sender.role}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                          {!message.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-900 font-medium">
                          {message.sender.name}
                        </div>
                        
                        {message.subject && (
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {message.subject}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600">
                          {message.message}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(message.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      {!message.isRead && message.receiver.role === 'ADMIN' && (
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMessaging
