import React, { useState } from 'react'
import { Users as UsersIcon, Wrench, CreditCard, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/apiService'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch dashboard stats
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard')
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Dashboard refreshed!')
    } catch (error) {
      toast.error('Failed to refresh dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Always render the dashboard layout, handle loading/error states per section

  const recentActivity = stats?.recentActivity || []
  const quickActions = [
    { name: 'View Users', href: '/users', icon: UsersIcon, color: 'bg-blue-500' },
    { name: 'Running Projects', href: '/running-projects', icon: Wrench, color: 'bg-orange-500' },
    { name: 'Payment Analytics', href: '/payments', icon: CreditCard, color: 'bg-green-500' },
    { name: 'System Settings', href: '/system-settings', icon: TrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-primary-100">
              Monitor all clients, manage projects, and track system performance.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running Projects</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions || 0}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">NPR {(stats?.totalRevenue || 0).toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats?.totalMessages || 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className={`p-3 ${action.color} rounded-lg mb-2`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">{action.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded mb-1"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">Failed to load activity</p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Try Again
                </button>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <activity.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-12 rounded-full"></div>
            ) : error ? (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                Error
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {stats?.duePayments || 0} alerts
              </span>
            )}
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
                <div className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 text-sm">Failed to load alerts</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Due Payments</p>
                    <p className="text-xs text-red-700">{stats?.duePayments || 0} clients have overdue payments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Wrench className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Projects in Progress</p>
                    <p className="text-xs text-yellow-700">{stats?.activeSubscriptions || 0} projects need attention</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
            ) : error ? (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Error
              </span>
            ) : (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Online
              </span>
            )}
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500 text-sm">Failed to load system status</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Services</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Gateway</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Service</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
