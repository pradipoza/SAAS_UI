import React from 'react'
import { Bot, User } from 'lucide-react'

const MessageBubble = ({ message, channelColor = 'blue' }) => {
  const isBot = message.sender === 'bot' || message.type === 'ai'
  const isCustomer = message.sender === 'customer' || message.type === 'human'

  // Format timestamp
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

  // Color schemes for different channels
  const colorSchemes = {
    blue: {
      bot: 'bg-blue-600 text-white',
      customer: 'bg-white text-gray-900 border border-gray-200'
    },
    green: {
      bot: 'bg-green-500 text-white',
      customer: 'bg-white text-gray-900 border border-gray-200'
    },
    pink: {
      bot: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      customer: 'bg-white text-gray-900 border border-gray-200'
    },
    black: {
      bot: 'bg-black text-white',
      customer: 'bg-white text-gray-900 border border-gray-200'
    }
  }

  const colors = colorSchemes[channelColor] || colorSchemes.blue

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`flex ${isCustomer ? 'flex-row' : 'flex-row-reverse'} items-end gap-2 max-w-[75%]`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot ? 'bg-gray-200' : 'bg-blue-100'
        }`}>
          {isBot ? (
            <Bot className="h-4 w-4 text-gray-600" />
          ) : (
            <User className="h-4 w-4 text-blue-600" />
          )}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-2xl ${
              isCustomer ? colors.customer : colors.bot
            } ${isCustomer ? 'rounded-bl-sm' : 'rounded-br-sm'} shadow-sm`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          
          {/* Timestamp */}
          <p className={`text-xs text-gray-500 mt-1 px-2 ${
            isCustomer ? 'text-left' : 'text-right'
          }`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble

