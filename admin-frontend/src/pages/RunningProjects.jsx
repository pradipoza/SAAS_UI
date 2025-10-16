import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/apiService'
import toast from 'react-hot-toast'
import { 
  Wrench, 
  Search, 
  Filter, 
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Users,
  DollarSign,
  Play,
  Pause,
  Square,
  Edit,
  Eye,
  Send
} from 'lucide-react'

const RunningProjects = () => {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPhase, setSelectedPhase] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch running projects data
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-running-projects', selectedStatus, selectedPhase, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedPhase) params.append('phase', selectedPhase)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await api.get(`/admin/running-projects?${params.toString()}`)
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Projects refreshed!')
    } catch (error) {
      toast.error('Failed to refresh projects')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Play className="h-5 w-5 text-green-600" />
      case 'PAUSED':
        return <Pause className="h-5 w-5 text-yellow-600" />
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'ON_HOLD':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'planning':
        return 'bg-purple-100 text-purple-800'
      case 'development':
        return 'bg-blue-100 text-blue-800'
      case 'testing':
        return 'bg-yellow-100 text-yellow-800'
      case 'deployment':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-gray-100 text-gray-800'
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
          <Wrench className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load projects</h2>
          <p className="text-gray-600 mb-4">There was an error loading the projects data.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Running Projects</h1>
          <p className="text-gray-600">Manage active chatbot development projects</p>
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

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects?.pagination?.total || 0}</p>
              <p className="text-sm text-blue-600">{projects?.projects?.filter(p => p.status === 'ACTIVE').length || 0} active</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{projects?.projects?.filter(p => p.status === 'COMPLETED').length || 0}</p>
              <p className="text-sm text-green-600">This month</p>
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
              <p className="text-2xl font-bold text-gray-900">{projects?.projects?.filter(p => p.status === 'ACTIVE').length || 0}</p>
              <p className="text-sm text-yellow-600">Development phase</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">{projects?.projects?.filter(p => p.status === 'ON_HOLD').length || 0}</p>
              <p className="text-sm text-red-600">Requires attention</p>
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
              placeholder="Search by client name or project name..."
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
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Phases</option>
            <option value="planning">Planning</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
            <option value="deployment">Deployment</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {(projects?.projects || []).map((project) => (
          <div key={project.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.clientName}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(project.status)}
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phase</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPhaseColor(project.phase)}`}>
                  {project.phase?.toUpperCase() || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">{project.progress || 0}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="text-sm text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deadline</span>
                <span className="text-sm text-gray-900">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Budget</span>
                <span className="text-sm font-medium text-gray-900">NPR {project.budget?.toLocaleString() || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Team Size</span>
                <span className="text-sm text-gray-900">{project.teamSize || 0} members</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-900">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
                <button className="btn-primary text-sm">
                  <Send className="h-4 w-4 mr-1" />
                  Update
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RunningProjects
