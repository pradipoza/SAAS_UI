import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MessageSquare, 
  Users, 
  FileText, 
  UserCheck, 
  TrendingUp, 
  Clock,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import apiService from '../services/apiService'

const Dashboard = () => {
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => {
      if (!apiService.isAuthenticated()) {
        throw new Error('User not authenticated')
      }
      return apiService.getDashboard()
    },
    enabled: apiService.isAuthenticated() // Only run query if authenticated
  })

  // Always render the dashboard layout, handle loading/error states per section

  const stats = dashboardData?.stats || {
    totalMessages: 0,
    activeChats: 0,
    documents: 0,
    customers: 0,
    monthlyGrowth: 0,
    averageResponseTime: 0,
    subscriptionStatus: 'INACTIVE'
  }

  const recentActivity = dashboardData?.recentActivity || []

  // Check if user is authenticated
  if (!apiService.isAuthenticated()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Please log in to access the dashboard</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Login
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your chatbot.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Chats</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.activeChats}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documents</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">+{stats.monthlyGrowth}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}s</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subscription</p>
              <p className={`text-2xl font-bold ${
                stats.subscriptionStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.subscriptionStatus}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Messages</h3>
          <p className="text-sm text-gray-500 mt-1">Latest customer interactions across all channels</p>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load recent activity</p>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const formatTime = (timestamp) => {
                  const date = new Date(timestamp)
                  const now = new Date()
                  const diffInMs = now - date
                  const diffInMinutes = Math.floor(diffInMs / 60000)
                  const diffInHours = Math.floor(diffInMs / 3600000)
                  const diffInDays = Math.floor(diffInMs / 86400000)

                  if (diffInMinutes < 1) return 'Just now'
                  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
                  if (diffInHours < 24) return `${diffInHours}h ago`
                  if (diffInDays < 7) return `${diffInDays}d ago`
                  
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }

                return (
                  <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent messages yet</p>
              <p className="text-sm text-gray-400 mt-2">Messages will appear here when customers interact with your chatbot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
