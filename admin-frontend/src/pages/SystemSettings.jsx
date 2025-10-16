import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/apiService'
import toast from 'react-hot-toast'
import { 
  Settings, 
  Save, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Server,
  Shield,
  Bell
} from 'lucide-react'

const SystemSettings = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch system settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/system-settings')
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Settings refreshed!')
    } catch (error) {
      toast.error('Failed to refresh settings')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSave = async (section) => {
    setIsSaving(true)
    try {
      // In real app, save settings to backend
      toast.success(`${section} settings saved successfully!`)
    } catch (error) {
      toast.error(`Failed to save ${section} settings`)
    } finally {
      setIsSaving(false)
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
          <Settings className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load settings</h2>
          <p className="text-gray-600 mb-4">There was an error loading the system settings.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
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

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Development Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Development Plans</h3>
            <button className="btn-primary text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Plan
            </button>
          </div>
          <div className="space-y-3">
            {(settings?.developmentPlans || []).map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                  <p className="text-xs text-gray-600">NPR {plan.price.toLocaleString()}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSave('Development Plans')}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
            <button className="btn-primary text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Plan
            </button>
          </div>
          <div className="space-y-3">
            {(settings?.subscriptionPlans || []).map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                  <p className="text-xs text-gray-600">NPR {plan.price.toLocaleString()}/month</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSave('Subscription Plans')}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* General Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Name
              </label>
              <input
                type="text"
                defaultValue="SaaS Chatbot Platform"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@chatbot.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Users
              </label>
              <input
                type="number"
                defaultValue="1000"
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSave('General Settings')}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select className="input-field">
                <option value="NPR">NPR (Nepalese Rupee)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khalti Public Key
              </label>
              <input
                type="text"
                placeholder="Enter Khalti public key"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                eSewa Secret Key
              </label>
              <input
                type="password"
                placeholder="Enter eSewa secret key"
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSave('Payment Settings')}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                defaultValue="5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Requirements
              </label>
              <select className="input-field">
                <option value="basic">Basic (6+ characters)</option>
                <option value="medium">Medium (8+ chars, numbers)</option>
                <option value="strong">Strong (8+ chars, numbers, symbols)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleSave('Security Settings')}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">API Services</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payment Gateway</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email Service</p>
              <p className="text-xs text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
