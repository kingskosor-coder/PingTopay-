import { ai, GEMINI_MODEL } from './gemini';
import { db } from './db';
import { Product, KnowledgeDocument, AIAgentConfig, Business, Order, Lead } from './types';

export interface AIProcessResult {
  replyText: string;
  intent: 'greeting' | 'product_inquiry' | 'pricing' | 'qualification' | 'objection' | 'ready_to_buy' | 'payment_claim' | 'human_escalation' | 'general_faq';
  leadStage?: 'new' | 'engaged' | 'qualified' | 'proposal' | 'payment_pending' | 'won' | 'lost';
  qualificationUpdates?: Record<string, string>;
  productRecommendations?: { id: string; name: string; price: number }[];
  createOrderRequest?: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  };
  shouldEscalate?: boolean;
  escalationReason?: string;
  paymentLinkProvided?: string;
}

export async function processCustomerMessageWithAI(params: {
  businessId: string;
  channel: 'whatsapp' | 'telegram';
  customerId: string;
  customerName?: string;
  customerIdentifier: string;
  conversationId: string;
  userMessage: string;
  recentMessages: { sender: string; content: string }[];
}): Promise<AIProcessResult> {
  const { businessId, channel, customerId, conversationId, userMessage, recentMessages } = params;

  const business = db.getBusiness(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  const agentConfig = db.getAIAgentConfig(businessId);
  const products = db.getProducts(businessId).filter(p => p.isActive);
  const knowledgeDocs = db.getKnowledgeDocs(businessId).filter(k => k.isActive);

  // Check out of hours behavior
  const currentHour = new Date().getHours();
  let isOutOfHours = false;
  if (agentConfig?.rules.businessHoursStart && agentConfig?.rules.businessHoursEnd) {
    const startHour = parseInt(agentConfig.rules.businessHoursStart.split(':')[0], 10) || 8;
    const endHour = parseInt(agentConfig.rules.businessHoursEnd.split(':')[0], 10) || 18;
    if (currentHour < startHour || currentHour >= endHour) {
      isOutOfHours = true;
    }
  }

  // Check escalation keywords
  const lowerMsg = userMessage.toLowerCase();
  const escalationKeywords = agentConfig?.rules.escalationKeywords || ['human', 'agent', 'manager', 'speak to someone'];
  const hasEscalationKeyword = escalationKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));

  // Prepare authorized business context for Gemini prompt
  const productCatalogText = products.length > 0
    ? products.map(p => 
        `- ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ${business.currencySymbol}${p.price.toLocaleString()} ${p.currency} | Stock: ${p.stock} | Description: ${p.description} | Features: ${p.features.join(', ') || 'N/A'}`
      ).join('\n')
    : 'No products currently active in catalog.';

  const knowledgeBaseText = knowledgeDocs.length > 0
    ? knowledgeDocs.map(k => `[Category: ${k.category.toUpperCase()} | Title: ${k.title}]\n${k.content}`).join('\n\n')
    : 'No additional knowledge base documents provided.';

  const qualificationQuestionsText = (agentConfig?.qualificationQuestions || [])
    .map(q => `- Question: "${q.question}" (captures field: ${q.field}, required: ${q.isRequired})`)
    .join('\n');

  const conversationHistoryText = recentMessages.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n');

  const systemInstruction = `
You are "${agentConfig?.agentName || 'AI Sales Representative'}", the official AI sales & customer service representative for "${business.name}".
Industry: ${business.industry} ${business.customIndustry ? `(${business.customIndustry})` : ''}.
Location: ${business.location}.
Currency: ${business.currency} (${business.currencySymbol}).
Tone: ${agentConfig?.tone || 'professional, warm, helpful African SME sales consultant'}.
Language: English.

CRITICAL RULES (NON-NEGOTIABLE):
1. SOURCE OF TRUTH: Only provide information from the AUTHORIZED PRODUCT CATALOGUE and KNOWLEDGE BASE below. NEVER invent products, prices, specifications, delivery promises, discounts, or policies.
2. IF INFORMATION IS MISSING OR UNKNOWN: Do not guess. Say politely: "I don't have that information available right now. Let me connect you with a member of our team." and set shouldEscalate=true.
3. NEVER TRUST CUSTOMER CLAIMS OF PAYMENT: If a customer says "I have paid", "I transferred money", "here is receipt", NEVER confirm payment. Tell them: "Our system automatically verifies payments through Paystack in real-time. Once the transaction is confirmed, you will immediately receive your order confirmation here."
4. LEAD QUALIFICATION: Gently ask for what they need, their budget/quantity, or their delivery city when relevant, but do NOT bombard or interrogate them.
5. READY TO BUY / ORDER GENERATION: When the customer expresses clear intent to purchase a specific product from the catalog (e.g., "I want this one", "send me the payment link", "how do I pay for it"), identify the product ID and quantity from the catalog.
6. ESCALATION: If the customer asks for a human, manager, or complains of fraud/refunds, set shouldEscalate=true and provide a reassuring handoff message.

AUTHORIZED PRODUCT CATALOGUE:
${productCatalogText}

AUTHORIZED KNOWLEDGE BASE & POLICIES:
${knowledgeBaseText}

QUALIFICATION QUESTIONS TO COLLECT IF RELEVANT:
${qualificationQuestionsText || 'Ask for product interest, quantity, and delivery location.'}

OUT OF HOURS STATUS: ${isOutOfHours ? 'Currently outside business hours (' + agentConfig?.rules.businessHoursStart + ' - ' + agentConfig?.rules.businessHoursEnd + ').' : 'Within normal business hours.'}
`;

  const userPrompt = `
CONVERSATION HISTORY:
${conversationHistoryText}
CUSTOMER: "${userMessage}"

Analyze the customer's message and generate a JSON response with:
- "replyText": string (the exact message to send to the customer on WhatsApp/Telegram)
- "intent": one of ["greeting", "product_inquiry", "pricing", "qualification", "objection", "ready_to_buy", "payment_claim", "human_escalation", "general_faq"]
- "leadStage": one of ["new", "engaged", "qualified", "proposal", "payment_pending", "won", "lost"]
- "qualificationUpdates": object with extracted key-values like { "location": "...", "budget": "...", "requirement": "..." }
- "productRecommendations": array of { id, name, price } matching exact catalog products
- "createOrderRequest": (null or object with { "productId": string, "productName": string, "quantity": number, "unitPrice": number }) if customer wants to purchase
- "shouldEscalate": boolean (true if user wants human, expresses frustration, or unknown product/service)
- "escalationReason": string or null
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        replyText: `Thank you for reaching out to ${business.name}! How may I help you today?`,
        intent: 'greeting',
      };
    }

    // Override escalation if explicit keyword detected
    if (hasEscalationKeyword) {
      parsed.shouldEscalate = true;
      parsed.escalationReason = 'Customer requested human agent or used escalation keyword';
    }

    // Check if order creation requested
    let paymentLink: string | undefined = undefined;
    if (parsed.createOrderRequest && parsed.createOrderRequest.productId) {
      const prod = products.find(p => p.id === parsed.createOrderRequest.productId);
      if (prod) {
        // Create an official order in PingTopay
        const unitPrice = prod.discountPrice || prod.price;
        const qty = parsed.createOrderRequest.quantity || 1;
        const totalAmount = unitPrice * qty;

        const newOrder: Order = {
          id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          businessId,
          customerId,
          conversationId,
          channel,
          customerName: params.customerName || (channel === 'whatsapp' ? params.customerIdentifier : `@${params.customerIdentifier}`),
          customerContact: params.customerIdentifier,
          items: [
            {
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              quantity: qty,
              unitPrice: unitPrice,
              totalPrice: totalAmount,
            },
          ],
          totalAmount,
          currency: business.currency,
          paymentStatus: 'payment_pending',
          orderStatus: 'pending',
          notes: `Created via ${channel} AI Sales Agent`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.createOrder(newOrder);

        // Formulate payment wall link
        const baseUrl = process.env.APP_URL || '';
        paymentLink = `${baseUrl}/pay/${newOrder.id}`;
        parsed.paymentLinkProvided = paymentLink;

        // Append payment instructions if not present in reply
        if (!parsed.replyText.includes(paymentLink) && !parsed.replyText.includes('/pay/')) {
          parsed.replyText += `\n\n💳 Here is your secure Paystack order payment link:\n${paymentLink}\n\nAmount: ${business.currencySymbol}${totalAmount.toLocaleString()} ${business.currency}. You can pay via Card, Bank Transfer, or USSD. Once paid, your order is verified automatically!`;
        }
      }
    }

    // Update or create lead
    const lead = db.getOrCreateLead(businessId, customerId, conversationId, channel, params.customerName, params.customerIdentifier);
    if (parsed.leadStage) {
      lead.leadStage = parsed.leadStage;
    }
    if (parsed.createOrderRequest) {
      lead.leadStage = 'payment_pending';
    }
    if (parsed.qualificationUpdates) {
      lead.qualificationAnswers = { ...lead.qualificationAnswers, ...parsed.qualificationUpdates };
    }
    if (parsed.productRecommendations?.length) {
      lead.productsInterested = parsed.productRecommendations.map((p: any) => p.name);
    }
    db.updateLead(businessId, lead.id, lead);

    // Increment AI usage in subscription
    db.incrementUsage(businessId, 'ai');

    return {
      replyText: parsed.replyText || "Thank you for contacting us. Let me know which product you're interested in!",
      intent: parsed.intent || 'product_inquiry',
      leadStage: parsed.leadStage,
      qualificationUpdates: parsed.qualificationUpdates,
      productRecommendations: parsed.productRecommendations,
      createOrderRequest: parsed.createOrderRequest,
      shouldEscalate: parsed.shouldEscalate,
      escalationReason: parsed.escalationReason,
      paymentLinkProvided: paymentLink,
    };
  } catch (error: any) {
    console.error('AI Sales Agent error:', error);
    // Graceful fallback adhering to "If required information is unavailable / error"
    return {
      replyText: `Thank you for your message! Our team at ${business.name} is currently reviewing your inquiry and a representative will follow up with you shortly.`,
      intent: 'human_escalation',
      shouldEscalate: true,
      escalationReason: `AI Service note: ${error?.message || 'Temporary AI service disruption'}`,
    };
  }
}
