import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Messages = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to website messages by default
    navigate('/messages/website', { replace: true })
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )
}

export default Messages
