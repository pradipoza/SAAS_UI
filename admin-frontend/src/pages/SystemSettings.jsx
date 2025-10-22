import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Bell,
  X
} from 'lucide-react'

const SystemSettings = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planModalType, setPlanModalType] = useState(null) // 'subscription' or 'development'
  const [editingPlan, setEditingPlan] = useState(null)
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'monthly',
    features: ''
  })

  const queryClient = useQueryClient()

  // Fetch system settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/system-settings')
      return response.data
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Create/Update Subscription Plan
  const subscriptionPlanMutation = useMutation({
    mutationFn: async (planData) => {
      if (editingPlan) {
        return await api.put(`/admin/subscription-plans/${editingPlan.id}`, planData)
      } else {
        return await api.post('/admin/subscription-plans', planData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-system-settings'])
      toast.success(editingPlan ? 'Subscription plan updated!' : 'Subscription plan created!')
      closePlanModal()
    },
    onError: () => {
      toast.error('Failed to save subscription plan')
    }
  })

  // Create/Update Development Plan
  const developmentPlanMutation = useMutation({
    mutationFn: async (planData) => {
      if (editingPlan) {
        return await api.put(`/admin/development-plans/${editingPlan.id}`, planData)
      } else {
        return await api.post('/admin/development-plans', planData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-system-settings'])
      toast.success(editingPlan ? 'Development plan updated!' : 'Development plan created!')
      closePlanModal()
    },
    onError: () => {
      toast.error('Failed to save development plan')
    }
  })

  // Delete Plan
  const deletePlanMutation = useMutation({
    mutationFn: async ({ id, type }) => {
      if (type === 'subscription') {
        return await api.delete(`/admin/subscription-plans/${id}`)
      } else {
        return await api.delete(`/admin/development-plans/${id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-system-settings'])
      toast.success('Plan deleted successfully!')
    },
    onError: () => {
      toast.error('Failed to delete plan')
    }
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

  const openPlanModal = (type, plan = null) => {
    setPlanModalType(type)
    setEditingPlan(plan)
    if (plan) {
      setPlanFormData({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle || 'monthly',
        features: typeof plan.features === 'object' ? JSON.stringify(plan.features, null, 2) : plan.features
      })
    } else {
      setPlanFormData({
        name: '',
        description: '',
        price: '',
        billingCycle: 'monthly',
        features: ''
      })
    }
    setShowPlanModal(true)
  }

  const closePlanModal = () => {
    setShowPlanModal(false)
    setPlanModalType(null)
    setEditingPlan(null)
    setPlanFormData({
      name: '',
      description: '',
      price: '',
      billingCycle: 'monthly',
      features: ''
    })
  }

  const handlePlanSubmit = (e) => {
    e.preventDefault()
    
    const planData = {
      name: planFormData.name,
      description: planFormData.description,
      price: parseInt(planFormData.price),
      billingCycle: planFormData.billingCycle,
      features: planFormData.features ? JSON.parse(planFormData.features) : {}
    }

    if (planModalType === 'subscription') {
      subscriptionPlanMutation.mutate(planData)
    } else {
      developmentPlanMutation.mutate(planData)
    }
  }

  const handleDeletePlan = (id, type) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deletePlanMutation.mutate({ id, type })
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
            <button 
              onClick={() => openPlanModal('development')}
              className="btn-primary text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Plan
            </button>
          </div>
          <div className="space-y-3">
            {(settings?.developmentPlans || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No development plans yet</p>
            ) : (
              (settings?.developmentPlans || []).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                    <p className="text-xs text-gray-600">NPR {plan.price.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openPlanModal('development', plan)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.id, 'development')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
            <button 
              onClick={() => openPlanModal('subscription')}
              className="btn-primary text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Plan
            </button>
          </div>
          <div className="space-y-3">
            {(settings?.subscriptionPlans || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No subscription plans yet</p>
            ) : (
              (settings?.subscriptionPlans || []).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                    <p className="text-xs text-gray-600">NPR {plan.price.toLocaleString()}/{plan.billingCycle}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openPlanModal('subscription', plan)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.id, 'subscription')}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
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

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPlan ? 'Edit' : 'Add'} {planModalType === 'subscription' ? 'Subscription' : 'Development'} Plan
              </h2>
              <button
                onClick={closePlanModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handlePlanSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (NPR) *
                </label>
                <input
                  type="number"
                  value={planFormData.price}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
              </div>

              {planModalType === 'subscription' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Cycle
                  </label>
                  <select
                    value={planFormData.billingCycle}
                    onChange={(e) => setPlanFormData({ ...planFormData, billingCycle: e.target.value })}
                    className="input-field"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features (JSON format)
                </label>
                <textarea
                  value={planFormData.features}
                  onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                  className="input-field font-mono text-sm"
                  rows="6"
                  placeholder='{"feature1": "value1", "feature2": "value2"}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter features in JSON format. Leave empty for no features.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closePlanModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={subscriptionPlanMutation.isLoading || developmentPlanMutation.isLoading}
                >
                  {subscriptionPlanMutation.isLoading || developmentPlanMutation.isLoading ? (
                    'Saving...'
                  ) : (
                    editingPlan ? 'Update Plan' : 'Create Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemSettings
