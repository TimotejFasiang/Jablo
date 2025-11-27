// DPH number validation business logic

export class DPHService {
  async validateDPHNumber(dphNumber) {
    try {
      const result = await ViesClient.checkDPH(dphNumber);
      
      return {
        valid: result.valid,
        name: result.name,
        address: result.address,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`VIES validation failed for ${dphNumber}:`, error);
      throw new Error('VIES_ERROR');
    }
  }

  // Async validation with retry logic
  async validateDPHNumberWithRetry(dphNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.validateDPHNumber(dphNumber);
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }
}
