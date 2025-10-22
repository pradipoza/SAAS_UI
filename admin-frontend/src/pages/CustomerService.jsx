import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/apiService'
import toast from 'react-hot-toast'
import AdminMessaging from '../components/AdminMessaging'
import { 
  MessageSquare, 
  Search, 
  RefreshCw,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Reply,
  Archive,
  Flag,
  MoreVertical
} from 'lucide-react'

const CustomerService = () => {
  const [activeTab, setActiveTab] = useState('messaging') // 'messaging' or 'tickets'
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')

  // Fetch customer service data
  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customer-service', selectedStatus, selectedPriority, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedPriority) params.append('priority', selectedPriority)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await api.get(`/admin/customer-service?${params.toString()}`)
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Conversations refreshed!')
    } catch (error) {
      toast.error('Failed to refresh conversations')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await axios.post('/api/admin/customer-service/send', {
        conversationId: selectedConversation.id,
        message: newMessage
      })
      
      setNewMessage('')
      toast.success('Message sent successfully!')
      refetch()
    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'CLOSED':
        return <CheckCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load conversations</h2>
          <p className="text-gray-600 mb-4">There was an error loading the customer service data.</p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Service</h1>
          <p className="text-gray-600">Manage client support conversations and inquiries</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('messaging')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messaging'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Direct Messaging
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Support Tickets
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'messaging' ? (
        <AdminMessaging />
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{conversations?.openTickets || 0}</p>
              <p className="text-sm text-red-600">Requires attention</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{conversations?.inProgressTickets || 0}</p>
              <p className="text-sm text-yellow-600">Being handled</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{conversations?.resolvedTickets || 0}</p>
              <p className="text-sm text-green-600">This month</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{conversations?.totalConversations || 0}</p>
              <p className="text-sm text-blue-600">All time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-64"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Tickets</h3>
            <div className="space-y-3">
              {(conversations?.tickets || []).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedConversation(ticket)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === ticket.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {ticket.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ticket.user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500">{ticket.user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{ticket.subject}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.subject}</h3>
                  <p className="text-sm text-gray-600">from {selectedConversation.user?.name || 'Unknown User'} ({selectedConversation.user?.email || ''})</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedConversation.priority)}`}>
                    {selectedConversation.priority}
                  </span>
                </div>
              </div>

              {/* Ticket Description */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedConversation.description}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Created: {new Date(selectedConversation.createdAt).toLocaleString()}
                  </p>
                  {selectedConversation.category && (
                    <p className="text-xs text-gray-500">
                      Category: {selectedConversation.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4 flex space-x-2">
                <button className="btn-secondary flex-1">
                  Update Status
                </button>
                <button className="btn-primary flex-1">
                  <Reply className="h-4 w-4 mr-2 inline" />
                  Reply via Email
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a ticket</h3>
                <p className="text-gray-600">Choose a support ticket from the list to view details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default CustomerService
