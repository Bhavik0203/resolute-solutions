const Queue = require('bull');
const nodemailer = require('nodemailer');

let emailQueue;

// Initialize email queue
const initializeEmailQueue = () => {
  emailQueue = new Queue('email queue', process.env.REDIS_URL || 'redis://localhost:6379');

  // Process email jobs
  emailQueue.process('send-email', async (job) => {
    const { type, userEmail, userName, orderNumber, totalAmount, orderId } = job.data;

    try {
      // Create email transporter
      const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      let subject, html;

      switch (type) {
        case 'ORDER_CONFIRMATION':
          subject = `Order Confirmation - ${orderNumber}`;
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Order Confirmation</h2>
              <p>Dear ${userName},</p>
              <p>Thank you for your order! Your order has been confirmed and payment has been processed successfully.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
                <p><strong>Status:</strong> Paid</p>
              </div>
              
              <p>We will send you another email when your order ships.</p>
              <p>If you have any questions, please contact our customer service.</p>
              
              <p>Best regards,<br>E-commerce Team</p>
            </div>
          `;
          break;

        case 'ORDER_SHIPPED':
          subject = `Order Shipped - ${orderNumber}`;
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Order Shipped</h2>
              <p>Dear ${userName},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Status:</strong> Shipped</p>
              </div>
              
              <p>You should receive your order within 3-5 business days.</p>
              <p>Thank you for shopping with us!</p>
              
              <p>Best regards,<br>E-commerce Team</p>
            </div>
          `;
          break;

        case 'ORDER_DELIVERED':
          subject = `Order Delivered - ${orderNumber}`;
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Order Delivered</h2>
              <p>Dear ${userName},</p>
              <p>Your order has been successfully delivered!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Status:</strong> Delivered</p>
              </div>
              
              <p>We hope you enjoy your purchase! If you have any feedback or need assistance, please don't hesitate to contact us.</p>
              <p>Thank you for choosing us!</p>
              
              <p>Best regards,<br>E-commerce Team</p>
            </div>
          `;
          break;

        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        html
      });

      console.log(`Email sent successfully to ${userEmail} for order ${orderNumber}`);
      return { success: true, message: 'Email sent successfully' };

    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  });

  // Handle completed jobs
  emailQueue.on('completed', (job, result) => {
    console.log(`Email job ${job.id} completed:`, result);
  });

  // Handle failed jobs
  emailQueue.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed:`, err.message);
  });

  console.log('Email queue initialized successfully');
};

// Add email job to queue
const addEmailJob = async (emailData) => {
  if (!emailQueue) {
    throw new Error('Email queue not initialized');
  }

  try {
    const job = await emailQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });

    console.log(`Email job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Failed to add email job to queue:', error);
    throw error;
  }
};

// Get queue statistics
const getQueueStats = async () => {
  if (!emailQueue) {
    return null;
  }

  const waiting = await emailQueue.getWaiting();
  const active = await emailQueue.getActive();
  const completed = await emailQueue.getCompleted();
  const failed = await emailQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
};

module.exports = {
  initializeEmailQueue,
  addEmailJob,
  getQueueStats
};

