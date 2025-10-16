import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const EmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const { verifyEmail } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      handleVerification()
    }
  }, [token])

  const handleVerification = async () => {
    if (!token) return

    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      await verifyEmail(token)
      setIsVerified(true)
      setMessage('Your email has been successfully verified!')
    } catch (err) {
      setError(err.response?.data?.error || 'Email verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      // This would need to be implemented in the backend
      setMessage('Verification email has been resent.')
    } catch (err) {
      setError('Failed to resend verification email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isVerified ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          ) : (
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isVerified ? 'Email Verified!' : 'Verify Your Email'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isVerified
              ? 'Your email has been successfully verified. You can now access your account.'
              : 'Please check your email and click the verification link to activate your account.'}
          </p>
        </div>

        {token && (
          <div className="mt-8 space-y-6">
            {isLoading && (
              <div className="flex justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{message}</div>
                  </div>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continue to Login
                </button>
              </div>
            )}

            {!isVerified && !token && (
              <div className="text-center">
                <button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Resend Verification Email
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailVerification
