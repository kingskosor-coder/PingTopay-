import crypto from 'crypto';
import { db } from './db';
import { Order, Business } from './types';

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // in kobo
    gateway_response: string;
    paid_at: string;
    channel: string;
    currency: string;
    customer?: {
      email: string;
      customer_code: string;
    };
    metadata?: Record<string, any>;
  };
}

export class PaystackService {
  /**
   * Verify HMAC SHA-512 signature for incoming Paystack webhooks
   */
  public static verifyWebhookSignature(rawBody: string, signature: string, secretKey: string): boolean {
    if (!signature || !secretKey) return false;
    const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
    return hash === signature;
  }

  /**
   * Test business's Paystack credentials
   */
  public static async testCredentials(secretKey: string): Promise<{ success: boolean; message: string; integration?: any }> {
    try {
      const res = await fetch('https://api.paystack.co/integration/payment_session_timeout', {
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.status) {
        return {
          success: true,
          message: 'Paystack Secret Key successfully authenticated with Paystack API.',
          integration: data.data,
        };
      }
      return {
        success: false,
        message: data.message || 'Paystack returned authentication failure. Check your Secret Key.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection error reaching Paystack API: ${err.message}`,
      };
    }
  }

  /**
   * Initialize a Paystack transaction for an Order
   */
  public static async initializeTransaction(
    business: Business,
    order: Order,
    customerEmail?: string
  ): Promise<PaystackInitResponse> {
    const reference = order.paymentReference || `PTP_${order.id}_${Date.now()}`;
    const email = customerEmail || `${order.customerContact.replace(/[^a-zA-Z0-9]/g, '')}@customer.pingtopay.com`;
    
    // Amount in kobo for NGN (1 NGN = 100 Kobo)
    const amountInKobo = Math.round(order.totalAmount * 100);

    const baseUrl = process.env.APP_URL || '';
    const callbackUrl = `${baseUrl}/pay/${order.id}?reference=${reference}`;

    const secretKey = business.paystackSecretKey;

    if (!secretKey) {
      // If secret key is not provided yet, generate a hosted payment reference for the Payment Wall
      return {
        status: false,
        message: 'Paystack Secret Key is not configured in Business Settings yet. Please connect Paystack in dashboard.',
        data: {
          authorization_url: `${baseUrl}/pay/${order.id}?ref=${reference}`,
          access_code: `mock_${reference}`,
          reference,
        },
      };
    }

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountInKobo,
          currency: business.currency || 'NGN',
          reference,
          callback_url: callbackUrl,
          metadata: {
            orderId: order.id,
            businessId: business.id,
            customerId: order.customerId,
            customerName: order.customerName,
            channel: order.channel,
            custom_fields: [
              {
                display_name: 'Order ID',
                variable_name: 'order_id',
                value: order.id,
              },
              {
                display_name: 'Channel',
                variable_name: 'channel',
                value: order.channel,
              },
            ],
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        return {
          status: false,
          message: data.message || 'Failed to initialize transaction on Paystack.',
        };
      }

      // Update order with reference and URLs
      db.updateOrder(order.id, {
        paymentReference: reference,
        paystackAccessCode: data.data.access_code,
        paystackAuthorizationUrl: data.data.authorization_url,
      });

      return {
        status: true,
        message: 'Paystack transaction initialized.',
        data: data.data,
      };
    } catch (err: any) {
      return {
        status: false,
        message: `Error initializing transaction: ${err.message}`,
      };
    }
  }

  /**
   * Verify transaction with Paystack API
   */
  public static async verifyTransaction(
    business: Business,
    reference: string
  ): Promise<PaystackVerifyResponse> {
    const secretKey = business.paystackSecretKey;
    if (!secretKey) {
      return {
        status: false,
        message: 'Paystack Secret Key not configured for this business.',
      };
    }

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        status: false,
        message: `Network error verifying transaction with Paystack: ${err.message}`,
      };
    }
  }
}
