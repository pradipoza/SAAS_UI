import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Send, 
  RefreshCw, 
  AlertCircle,
  MessageSquare,
  Clock,
  User,
  MessageCircle,
  MoreVertical,
  Phone
} from 'lucide-react'
import apiService from '../services/apiService'
import MessageBubble from '../components/MessageBubble'

const WhatsAppMessages = () => {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const messagesEndRef = useRef(null)

  const { data: messagesData, isLoading, error, refetch } = useQuery({
    queryKey: ['whatsappMessages', selectedStatus, searchTerm],
    queryFn: () => apiService.getMessages({
      channel: 'whatsapp',
      status: selectedStatus,
      search: searchTerm
    })
  })

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  // Auto-select first conversation when data loads
  useEffect(() => {
    if (messagesData?.conversations?.length > 0 && !selectedConversation) {
      const firstConversation = messagesData.conversations[0]
      // Fetch full conversation details
      setSelectedConversation({
        ...firstConversation,
        messages: messagesData.selectedConversation?.messages || []
      })
    }
  }, [messagesData])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/client/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newMessage,
          channel: 'whatsapp',
          conversationId: selectedConversation.id
        })
      })

      if (response.ok) {
        setNewMessage('')
        refetch()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load WhatsApp messages</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const conversations = messagesData?.conversations || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Messages</h1>
            <p className="text-gray-600">Chat conversations from WhatsApp Business</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search WhatsApp conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                WhatsApp Conversations
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {conversations.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conversation) => {
                    const formatTime = (timestamp) => {
                      const date = new Date(timestamp)
                      const now = new Date()
                      const diffInHours = Math.floor((now - date) / 3600000)
                      const diffInDays = Math.floor((now - date) / 86400000)
                      
                      if (diffInHours < 1) return 'Just now'
                      if (diffInHours < 24) return `${diffInHours}h ago`
                      if (diffInDays < 7) return `${diffInDays}d ago`
                      return date.toLocaleDateString()
                    }
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={async () => {
                          // Fetch full conversation when clicked
                          try {
                            const fullData = await apiService.getMessages({
                              channel: 'whatsapp',
                              status: selectedStatus,
                              search: conversation.sessionId
                            })
                            setSelectedConversation({
                              ...conversation,
                              messages: fullData.selectedConversation?.messages || []
                            })
                          } catch (err) {
                            console.error('Failed to load conversation:', err)
                          }
                        }}
                        className={`p-4 hover:bg-green-50 cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.customerName || 'WhatsApp User'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                              {conversation.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(conversation.lastMessageTime)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No WhatsApp conversations found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                {selectedConversation ? selectedConversation.customerName || selectedConversation.phoneNumber : 'Select a conversation'}
              </h3>
            </div>
            <div className="h-[600px] flex flex-col bg-gray-50">
              {selectedConversation ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4">
                    {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                      <>
                        {selectedConversation.messages.map((message, index) => (
                          <MessageBubble 
                            key={message.id || index} 
                            message={message} 
                            channelColor="green"
                          />
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No messages in this conversation yet</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a WhatsApp conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppMessages
