// Core business logic for order processing

import { DPHService } from '../dph/dph.service.js';
import { PaymentService } from '../payment/payment.service.js';
import { EmailService } from '../payment/email.service.js';

export class OrdersService {
  async createOrder(orderData) {
    // No DPH number = always pay DPH immediately
    if (!orderData.dphNumber) {
      const order = await this.ordersRepository.create({
        ...orderData,
        dphStatus: 'INVALID', // No DPH number = must pay DPH
        requiresDPH: true,
        paymentMethod: 'WEB_IMMEDIATE'
      });
      
      // Generate immediate payment link
      const paymentLink = await PaymentService.generatePaymentLink(order.id);
      return { ...order, paymentLink };
    }

    // Try synch validation with 3s timeout
    try {
      const validationResult = await Promise.race([
        DPHService.validateDPHNumber(orderData.dphNumber),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('VIES_TIMEOUT')), 3000)
        )
      ]);

      // Synch success, process immediately
      const order = await this.ordersRepository.create({
        ...orderData,
        dphStatus: validationResult.valid ? 'VALID' : 'INVALID',
        requiresDPH: !validationResult.valid,
        paymentMethod: 'WEB_IMMEDIATE'
      });

      const paymentLink = await PaymentService.generatePaymentLink(order.id);
      return { ...order, paymentLink };

    } catch (error) {
      if (error.message === 'VIES_TIMEOUT' || error.name === 'VIES_ERROR') {
        // Fallback to async processing
        return await this.handleAsyncValidation(orderData);
      }
      throw error;
    }
  }

  async handleAsyncValidation(orderData) {
    // Create order in pending state
    const order = await this.ordersRepository.create({
      ...orderData,
      dphStatus: 'PENDING_DPH_VALIDATION',
      requiresDPH: true, // Default to DPH payer until validated
      paymentMethod: 'EMAIL_PENDING'
    });

    // Queue for async processing
    await dphQueue.add('validate-dph-async', {
      orderId: order.id,
      dphNumber: orderData.dphNumber
    });

    return order; // No payment link yet, customer will get it by email
  }
}
