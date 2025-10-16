import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/apiService'
import toast from 'react-hot-toast'
import { 
  BarChart3, 
  TrendingUp, 
  Users as UsersIcon, 
  MessageSquare, 
  CreditCard,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-analytics', selectedPeriod],
    queryFn: async () => {
      const response = await api.get(`/admin/analytics?period=${selectedPeriod}`)
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Analytics refreshed!')
    } catch (error) {
      toast.error('Failed to refresh analytics')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Always render the analytics layout, handle loading/error states per section

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Comprehensive overview of system performance and user activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mb-1"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.totalUsers || 0}</p>
                  <p className="text-sm text-green-600">+{analytics?.userGrowth || 0}% from last period</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mb-1"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{(analytics?.totalMessages || 0).toLocaleString()}</p>
                  <p className="text-sm text-green-600">+{analytics?.messageGrowth || 0}% from last period</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mb-1"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">NPR {(analytics?.revenue || 0).toLocaleString()}</p>
                  <p className="text-sm text-green-600">+{analytics?.revenueGrowth || 0}% from last period</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mb-1"></div>
              ) : error ? (
                <p className="text-2xl font-bold text-red-500">Error</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{analytics?.activeProjects || 0}</p>
                  <p className="text-sm text-green-600">+{analytics?.projectGrowth || 0}% from last period</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Trends</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">Failed to load chart</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.messageTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">Failed to load chart</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenueTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trends</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">Failed to load chart</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.userTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Channel Distribution</h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">Failed to load chart</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.channelDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.channelDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Clients */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Clients</h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-1/3 rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                  </div>
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-6 w-12 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">Failed to load client data</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(analytics?.topClients || []).length > 0 ? (
                  (analytics?.topClients || []).map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">{client.name.charAt(0)}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.messages.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        NPR {client.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {client.growth >= 0 ? '+' : ''}{client.growth}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No client data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
