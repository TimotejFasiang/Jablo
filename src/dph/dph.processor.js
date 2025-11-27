// Queue worker for background DPH processing

export const dphProcessor = async (job) => {
  const { orderId, dphNumber } = job.data;
  
  try {
    const validationResult = await DPHService.validateDPHNumberWithRetry(dphNumber);
    
    // Update order with validation result
    const order = await OrdersRepository.update(orderId, {
      dphStatus: validationResult.valid ? 'VALID' : 'INVALID',
      requiresDPH: !validationResult.valid
    });

    // Generate and send payment email
    const paymentLink = await PaymentService.generatePaymentLink(orderId);
    await EmailService.sendPaymentEmail(order.email, paymentLink, {
      dphValid: validationResult.valid,
      companyName: validationResult.name
    });

    return { success: true, orderId };

  } catch (error) {
    // Final fallback after all retries
    const order = await OrdersRepository.update(orderId, {
      dphStatus: 'INVALID', // Safe default
      requiresDPH: true
    });

    const paymentLink = await PaymentService.generatePaymentLink(orderId);
    await EmailService.sendPaymentEmail(order.email, paymentLink, {
      dphValid: false,
      note: 'DPH validation service unavailable, DPH applied'
    });

    throw error; // Still throw for queue to track failure
  }
};
