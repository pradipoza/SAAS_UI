import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  MessageSquare,
  BarChart3,
  Users,
  FileText,
  Settings,
  HelpCircle,
  CreditCard,
  User,
  X,
  Bot,
  ChevronDown,
  Globe,
  Phone,
  Facebook,
  Instagram,
  Music
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiService from '../services/apiService'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState(false)

  // Fetch bot settings to get active channels
  const { data: botSettings } = useQuery({
    queryKey: ['botSettings'],
    queryFn: () => apiService.getBotSettings(),
    enabled: !!user
  })

  // Get active channels from bot settings
  const activeChannels = botSettings?.settings?.channels || {
    web: { enabled: true },
    whatsapp: { enabled: true },
    facebook: { enabled: false },
    instagram: { enabled: false },
    tiktok: { enabled: false }
  }

  const messageChannels = [
    { name: 'Website Widget', href: '/messages/website', icon: Globe, channel: 'web' },
    { name: 'WhatsApp', href: '/messages/whatsapp', icon: Phone, channel: 'whatsapp' },
    { name: 'Facebook', href: '/messages/facebook', icon: Facebook, channel: 'facebook' },
    { name: 'Instagram', href: '/messages/instagram', icon: Instagram, channel: 'instagram' },
    { name: 'TikTok', href: '/messages/tiktok', icon: Music, channel: 'tiktok' }
  ]

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: MessageSquare, 
      hasDropdown: true,
      dropdownItems: messageChannels.filter(channel => activeChannels[channel.channel])
    },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'Knowledge Base', href: '/knowledge-base', icon: FileText },
    { name: 'Bot Settings', href: '/bot-settings', icon: Bot },
    { name: 'Help & Support', href: '/help', icon: HelpCircle },
    { name: 'Payment', href: '/payment', icon: CreditCard },
  ]

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">ChatBot</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.hasDropdown && location.pathname.startsWith('/messages/'))
              
              if (item.hasDropdown) {
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => setMessagesDropdownOpen(!messagesDropdownOpen)}
                      className={`
                        group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                        ${isActive
                          ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={`
                            mr-3 h-5 w-5 flex-shrink-0
                            ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                          `}
                        />
                        {item.name}
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          messagesDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                    
                    {messagesDropdownOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.dropdownItems.map((channel) => {
                          const isChannelActive = location.pathname === channel.href
                          return (
                            <NavLink
                              key={channel.name}
                              to={channel.href}
                              onClick={onClose}
                              className={`
                                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                                ${isChannelActive
                                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                            >
                              <channel.icon
                                className={`
                                  mr-3 h-4 w-4 flex-shrink-0
                                  ${isChannelActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                                `}
                              />
                              {channel.name}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2024 ChatBot Platform
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
