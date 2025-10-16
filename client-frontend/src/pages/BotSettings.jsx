import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  RefreshCw, 
  AlertCircle,
  Save,
  Bot,
  MessageSquare,
  Database,
  Settings,
  CheckCircle
} from 'lucide-react'
import apiService from '../services/apiService'

const BotSettings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const { data: botSettings, isLoading, error, refetch } = useQuery({
    queryKey: ['botSettings'],
    queryFn: () => apiService.getBotSettings(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })

  // Debug logging
  console.log('BotSettings render - activeTab:', activeTab, 'isLoading:', isLoading, 'error:', error)

  // Ensure tab state persists
  useEffect(() => {
    console.log('Tab changed to:', activeTab)
  }, [activeTab])

  // Handle tab switching with error boundary
  const handleTabChange = (tabId) => {
    console.log('Switching to tab:', tabId)
    setActiveTab(tabId)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')

    try {
      // Collect form data
      const formData = new FormData(document.getElementById('bot-settings-form'))
      const settings = {
        general: {
          name: formData.get('botName') || botSettings?.settings?.general?.name || 'My Chatbot',
          description: formData.get('botDescription') || botSettings?.settings?.general?.description || 'AI-powered customer support chatbot',
          language: formData.get('language') || 'en',
          timezone: formData.get('timezone') || 'UTC'
        },
        channels: {
          web: {
            enabled: formData.get('webEnabled') === 'on',
            widgetColor: formData.get('widgetColor') || '#3B82F6'
          },
          facebook: {
            enabled: formData.get('facebookEnabled') === 'on',
            pageId: formData.get('facebookPageId') || ''
          },
          whatsapp: {
            enabled: formData.get('whatsappEnabled') === 'on',
            phoneNumber: formData.get('whatsappPhone') || ''
          },
          instagram: {
            enabled: formData.get('instagramEnabled') === 'on',
            accountId: formData.get('instagramAccountId') || ''
          },
          tiktok: {
            enabled: formData.get('tiktokEnabled') === 'on',
            accountId: formData.get('tiktokAccountId') || ''
          }
        },
        rag: {
          enabled: formData.get('ragEnabled') === 'on',
          model: formData.get('ragModel') || 'text-embedding-3-small',
          chunkSize: parseInt(formData.get('chunkSize')) || 1000,
          chunkOverlap: parseInt(formData.get('chunkOverlap')) || 200,
          dimensions: parseInt(formData.get('dimensions')) || 1536
        }
      }

      await apiService.put('/api/client/bot-settings', { settings })
      setSaveMessage('Settings saved successfully!')
      refetch() // Refresh the data
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Save error:', error)
      setSaveMessage('Failed to save settings')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    console.error('BotSettings error:', error)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load bot settings</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const settings = botSettings?.settings || {
    general: {
      name: 'My Chatbot',
      description: 'AI-powered customer support chatbot',
      language: 'en',
      timezone: 'UTC'
    },
    channels: {
      web: { enabled: true, widgetColor: '#3B82F6' },
      facebook: { enabled: false, pageId: '' },
      whatsapp: { enabled: true, phoneNumber: '' },
      instagram: { enabled: false, accountId: '' },
      tiktok: { enabled: false, accountId: '' }
    },
    rag: {
      enabled: true,
      model: 'text-embedding-3-small',
      chunkSize: 1000,
      chunkOverlap: 200,
      dimensions: 1536
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'channels', name: 'Channels', icon: MessageSquare },
    { id: 'rag', name: 'RAG Config', icon: Database }
  ]

  return (
    <form id="bot-settings-form" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bot Settings</h1>
          <p className="text-gray-600">Configure your chatbot behavior and capabilities</p>
        </div>
        <div className="flex items-center space-x-4">
          {saveMessage && (
            <div className={`flex items-center px-3 py-2 rounded-md text-sm ${
              saveMessage.includes('success') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {saveMessage}
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'general' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">General Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  name="botName"
                  defaultValue={settings.general.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="botDescription"
                  rows={3}
                  defaultValue={settings.general.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    defaultValue={settings.general.language}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    defaultValue={settings.general.timezone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Channel Integration</h3>
            <div className="space-y-6">
              {/* Web Widget */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Web Widget</h4>
                    <p className="text-sm text-gray-500">Embed chatbot on your website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="webEnabled"
                      defaultChecked={settings.channels.web.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Color
                    </label>
                    <input
                      type="color"
                      name="widgetColor"
                      defaultValue={settings.channels.web.widgetColor}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Facebook Messenger */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Facebook Messenger</h4>
                    <p className="text-sm text-gray-500">Connect to Facebook Messenger</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="facebookEnabled"
                      defaultChecked={settings.channels.facebook.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page ID
                  </label>
                  <input
                    type="text"
                    name="facebookPageId"
                    defaultValue={settings.channels.facebook.pageId}
                    placeholder="Enter Facebook Page ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">WhatsApp</h4>
                    <p className="text-sm text-gray-500">Connect to WhatsApp Business</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="whatsappEnabled"
                      defaultChecked={settings.channels.whatsapp.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="whatsappPhone"
                    defaultValue={settings.channels.whatsapp.phoneNumber}
                    placeholder="Enter WhatsApp Business number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Instagram</h4>
                    <p className="text-sm text-gray-500">Connect to Instagram Direct Messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="instagramEnabled"
                      defaultChecked={settings.channels.instagram.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    name="instagramAccountId"
                    defaultValue={settings.channels.instagram.accountId}
                    placeholder="Enter Instagram Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* TikTok */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">TikTok</h4>
                    <p className="text-sm text-gray-500">Connect to TikTok Direct Messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="tiktokEnabled"
                      defaultChecked={settings.channels.tiktok.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    name="tiktokAccountId"
                    defaultValue={settings.channels.tiktok.accountId}
                    placeholder="Enter TikTok Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rag' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">RAG Configuration</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Enable RAG</h4>
                  <p className="text-sm text-gray-500">Retrieval-Augmented Generation for better responses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="ragEnabled"
                    defaultChecked={settings.rag.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    name="ragModel"
                    defaultValue={settings.rag.model}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="text-embedding-3-small">text-embedding-3-small</option>
                    <option value="text-embedding-3-large">text-embedding-3-large</option>
                    <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensions
                  </label>
                  <input
                    type="number"
                    name="dimensions"
                    defaultValue={settings.rag.dimensions}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunk Size
                  </label>
                  <input
                    type="number"
                    name="chunkSize"
                    defaultValue={settings.rag.chunkSize}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunk Overlap
                  </label>
                  <input
                    type="number"
                    name="chunkOverlap"
                    defaultValue={settings.rag.chunkOverlap}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

export default BotSettings