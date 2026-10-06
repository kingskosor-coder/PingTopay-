import { db } from './db';
import { processCustomerMessageWithAI } from './aiAgent';
import { Channel, Message, Conversation, Customer } from './types';

export interface NormalizedIncomingMessage {
  businessId: string;
  channel: 'whatsapp' | 'telegram';
  customerIdentifier: string;
  customerName?: string;
  text: string;
  externalMessageId?: string;
}

export class ChannelService {
  /**
   * Sends an outbound message to Meta WhatsApp Cloud API
   */
  public static async sendWhatsAppMessage(
    channel: Channel,
    toPhone: string,
    messageText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = channel.whatsappConfig;
    if (!config?.phoneNumberId || !config?.accessToken) {
      return {
        success: false,
        error: 'WhatsApp Cloud API credentials (Phone Number ID or Access Token) not configured.',
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toPhone.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { preview_url: true, body: messageText },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Meta WhatsApp API error',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Network error sending WhatsApp message: ${err.message}`,
      };
    }
  }

  /**
   * Verify Telegram Bot Token by calling getMe
   */
  public static async verifyTelegramToken(botToken: string): Promise<{ success: boolean; username?: string; error?: string }> {
    try {
      const url = `https://api.telegram.org/bot${botToken.trim()}/getMe`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok && data.result?.username) {
        return {
          success: true,
          username: data.result.username,
        };
      }
      return {
        success: false,
        error: data.description || 'Invalid Telegram Bot Token',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Telegram connection error: ${err.message}`,
      };
    }
  }

  /**
   * Sends an outbound message to Telegram Bot API
   */
  public static async sendTelegramMessage(
    channel: Channel,
    chatId: string,
    messageText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = channel.telegramConfig;
    if (!config?.botToken) {
      return {
        success: false,
        error: 'Telegram Bot Token not configured in Business Settings.',
      };
    }

    try {
      const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return {
          success: false,
          error: data.description || 'Telegram API returned error',
        };
      }

      return {
        success: true,
        messageId: String(data.result?.message_id),
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Network error sending Telegram message: ${err.message}`,
      };
    }
  }

  /**
   * Omnichannel unified message processing pipeline
   */
  public static async handleIncomingMessage(incoming: NormalizedIncomingMessage): Promise<{
    conversation: Conversation;
    customerMessage: Message;
    aiMessage?: Message;
    escalated: boolean;
  }> {
    const { businessId, channel, customerIdentifier, customerName, text } = incoming;

    // 1. Find or create customer
    const customer = db.getOrCreateCustomer(businessId, channel, customerIdentifier, customerName);

    // 2. Find or create conversation
    const conversation = db.getOrCreateConversation(businessId, customer);

    // 3. Save incoming customer message
    const custMsg: Message = {
      id: `msg_c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: conversation.id,
      businessId,
      sender: 'customer',
      senderName: customer.name,
      content: text,
      channel,
      deliveryStatus: 'delivered',
      timestamp: new Date().toISOString(),
    };
    db.addMessage(custMsg);

    // Check if human agent has taken over
    if (conversation.isHumanHandled) {
      // Keep conversation in human mode, do not auto-respond with AI
      return {
        conversation,
        customerMessage: custMsg,
        escalated: true,
      };
    }

    // Retrieve recent messages for AI context
    const recentMessages = db.getMessages(businessId, conversation.id);

    // 4. Process with Gemini AI Sales Agent
    const aiResult = await processCustomerMessageWithAI({
      businessId,
      channel,
      customerId: customer.id,
      customerName: customer.name,
      customerIdentifier,
      conversationId: conversation.id,
      userMessage: text,
      recentMessages: recentMessages.map(m => ({ sender: m.sender, content: m.content })),
    });

    // 5. Save AI response message
    const aiMsg: Message = {
      id: `msg_ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: conversation.id,
      businessId,
      sender: 'ai',
      senderName: 'AI Sales Agent',
      content: aiResult.replyText,
      channel,
      deliveryStatus: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        intent: aiResult.intent,
        suggestedProducts: aiResult.productRecommendations?.map(p => p.name),
        paymentLink: aiResult.paymentLinkProvided,
        escalationReason: aiResult.escalationReason,
        orderId: aiResult.createOrderRequest?.productId,
      },
    };
    db.addMessage(aiMsg);

    // 6. Check if escalation needed
    let isEscalated = false;
    if (aiResult.shouldEscalate) {
      isEscalated = true;
      db.updateConversation(businessId, conversation.id, {
        isHumanHandled: true,
        summary: `Escalated: ${aiResult.escalationReason || 'Customer requested assistance'}`,
        internalNotes: (conversation.internalNotes ? conversation.internalNotes + '\n' : '') + `[${new Date().toLocaleTimeString()}] Escalated: ${aiResult.escalationReason}`,
      });
    }

    // 7. Dispatch outbound message to external channel if connected
    const channelConfig = db.getChannel(businessId, channel);
    if (channelConfig && channelConfig.status === 'connected') {
      if (channel === 'whatsapp') {
        await ChannelService.sendWhatsAppMessage(channelConfig, customerIdentifier, aiResult.replyText);
      } else if (channel === 'telegram') {
        await ChannelService.sendTelegramMessage(channelConfig, customerIdentifier, aiResult.replyText);
      }
    }

    return {
      conversation,
      customerMessage: custMsg,
      aiMessage: aiMsg,
      escalated: isEscalated,
    };
  }
}
