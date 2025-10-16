import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'

const prisma = new PrismaClient()

export const createPayment = async (userId, amount, planId, paymentMethod = 'khalti') => {
  try {
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        planId,
        paymentMethod,
        status: 'PENDING'
      }
    })

    return payment
  } catch (error) {
    console.error('Error creating payment:', error)
    throw new Error('Failed to create payment')
  }
}

export const processKhaltiPayment = async (paymentId, khaltiData) => {
  try {
    // Verify payment with Khalti API
    const verificationResponse = await fetch('https://khalti.com/api/v2/payment/verify/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: khaltiData.token,
        amount: khaltiData.amount
      })
    })

    const verificationResult = await verificationResponse.json()

    if (verificationResult.state.name === 'Completed') {
      // Update payment status
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          transactionId: verificationResult.idx,
          paidAt: new Date()
        }
      })

      // Create or update subscription
      await createOrUpdateSubscription(payment.userId, payment.planId)

      return { success: true, payment }
    } else {
      throw new Error('Payment verification failed')
    }
  } catch (error) {
    console.error('Error processing Khalti payment:', error)
    
    // Update payment status to failed
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' }
    })

    throw new Error('Payment processing failed')
  }
}

export const processEsewaPayment = async (paymentId, esewaData) => {
  try {
    // Verify payment with eSewa API
    const verificationResponse = await fetch('https://uat.esewa.com.np/epay/transrec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amt: esewaData.amount,
        rid: esewaData.refId,
        pid: esewaData.productId,
        scd: process.env.ESEWA_SECRET_CODE
      })
    })

    const verificationResult = await verificationResponse.text()

    if (verificationResult.includes('Success')) {
      // Update payment status
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          transactionId: esewaData.refId,
          paidAt: new Date()
        }
      })

      // Create or update subscription
      await createOrUpdateSubscription(payment.userId, payment.planId)

      return { success: true, payment }
    } else {
      throw new Error('Payment verification failed')
    }
  } catch (error) {
    console.error('Error processing eSewa payment:', error)
    
    // Update payment status to failed
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' }
    })

    throw new Error('Payment processing failed')
  }
}

const createOrUpdateSubscription = async (userId, planId) => {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      throw new Error('Plan not found')
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    })

    if (existingSubscription) {
      // Extend existing subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          endDate: new Date(existingSubscription.endDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // Add 30 days
        }
      })
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId,
          planId,
          startDate,
          endDate,
          status: 'ACTIVE'
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating/updating subscription:', error)
    throw new Error('Failed to create/update subscription')
  }
}

export const generateInvoice = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        plan: true
      }
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Create PDF invoice
    const doc = new PDFDocument()
    const chunks = []
    
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      
      // Save invoice to database
      prisma.invoice.create({
        data: {
          paymentId,
          invoiceNumber: `INV-${Date.now()}`,
          pdfData: pdfBuffer,
          amount: payment.amount,
          status: 'GENERATED'
        }
      })
    })

    // Add content to PDF
    doc.fontSize(20).text('Invoice', 100, 100)
    doc.fontSize(12).text(`Invoice Number: INV-${Date.now()}`, 100, 150)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, 170)
    doc.text(`Customer: ${payment.user.name}`, 100, 190)
    doc.text(`Email: ${payment.user.email}`, 100, 210)
    doc.text(`Plan: ${payment.plan.name}`, 100, 230)
    doc.text(`Amount: $${payment.amount}`, 100, 250)
    doc.text(`Status: ${payment.status}`, 100, 270)

    doc.end()

    return { success: true }
  } catch (error) {
    console.error('Error generating invoice:', error)
    throw new Error('Failed to generate invoice')
  }
}
