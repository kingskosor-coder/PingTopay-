import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Business,
  Channel,
  Product,
  KnowledgeDocument,
  AIAgentConfig,
  Customer,
  Conversation,
  Message,
  Lead,
  Order,
  FollowUpAutomation,
  TeamMember,
  Subscription,
  AuditLog,
  IndustryType,
} from './types';

export interface DatabaseSchema {
  users: User[];
  businesses: Business[];
  channels: Channel[];
  products: Product[];
  knowledgeDocuments: KnowledgeDocument[];
  aiAgents: AIAgentConfig[];
  customers: Customer[];
  conversations: Conversation[];
  messages: Message[];
  leads: Lead[];
  orders: Order[];
  automations: FollowUpAutomation[];
  teamMembers: TeamMember[];
  subscriptions: Subscription[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pingtopay_db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    businesses: [],
    channels: [],
    products: [],
    knowledgeDocuments: [],
    aiAgents: [],
    customers: [],
    conversations: [],
    messages: [],
    leads: [],
    orders: [],
    automations: [],
    teamMembers: [],
    subscriptions: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...this.data, ...JSON.parse(raw) };
      } else {
        this.seedInitialPlatformAdmin();
        this.save();
      }
    } catch (err) {
      console.error('Database load error, initializing fresh:', err);
      this.seedInitialPlatformAdmin();
      this.save();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  private seedInitialPlatformAdmin() {
    // Platform super administrator
    const adminUser: User = {
      id: 'usr_platform_admin',
      email: 'admin@pingtopay.com',
      passwordHash: this.hashPassword('Admin12345!'),
      name: 'PingTopay SuperAdmin',
      role: 'platform_admin',
      businessId: 'biz_platform',
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(adminUser);
  }

  public hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd + 'pingtopay_secret_salt').digest('hex');
  }

  // --- Users & Auth ---
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // --- Businesses (Multi-tenant workspaces) ---
  public getBusiness(businessId: string): Business | undefined {
    return this.data.businesses.find(b => b.id === businessId);
  }

  public getAllBusinesses(): Business[] {
    return this.data.businesses;
  }

  public createBusiness(business: Business): Business {
    this.data.businesses.push(business);
    
    // Initialize default channels for WhatsApp & Telegram
    const waChannel: Channel = {
      id: `chan_wa_${business.id}`,
      businessId: business.id,
      type: 'whatsapp',
      status: 'not_connected',
      webhookUrl: `/api/webhooks/whatsapp`,
      updatedAt: new Date().toISOString(),
    };

    const tgChannel: Channel = {
      id: `chan_tg_${business.id}`,
      businessId: business.id,
      type: 'telegram',
      status: 'not_connected',
      webhookUrl: `/api/webhooks/telegram/${business.id}`,
      updatedAt: new Date().toISOString(),
    };

    this.data.channels.push(waChannel, tgChannel);

    // Initialize Default AI Agent
    const agent: AIAgentConfig = {
      id: `agent_${business.id}`,
      businessId: business.id,
      agentName: `${business.name} Sales Rep`,
      tone: 'professional',
      greeting: `Hello! Welcome to ${business.name}. How can I assist you with our products and services today?`,
      language: 'English',
      salesBehavior: {
        recommendProducts: true,
        upsellEnabled: true,
        crossSellEnabled: true,
        objectionHandling: true,
        paymentAssistance: true,
        followUpEnabled: true,
      },
      qualificationQuestions: [
        {
          id: 'q_requirement',
          question: 'What specific product or style are you looking for?',
          field: 'requirement',
          isRequired: true,
        },
        {
          id: 'q_budget',
          question: 'What is your estimated budget or quantity?',
          field: 'budget',
          isRequired: false,
        },
        {
          id: 'q_location',
          question: 'Where should this be delivered (City/State)?',
          field: 'location',
          isRequired: true,
        },
      ],
      rules: {
        maxDiscountPercent: 5,
        businessHoursStart: '08:00',
        businessHoursEnd: '19:00',
        outOfHoursBehavior: 'respond_with_hours',
        escalationKeywords: ['human', 'manager', 'agent', 'complaint', 'fraud', 'refund', 'speak to someone'],
        escalateIfUnknown: true,
      },
      isActive: false, // Activated once onboarding is done
      updatedAt: new Date().toISOString(),
    };
    this.data.aiAgents.push(agent);

    // Default Subscription
    const sub: Subscription = {
      id: `sub_${business.id}`,
      businessId: business.id,
      planId: 'growth',
      planName: 'Growth SME Plan',
      status: 'active',
      conversationsThisMonth: 0,
      conversationsLimit: 2500,
      productsLimit: 100,
      teamMembersLimit: 5,
      aiGenerationsCount: 0,
      renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
    this.data.subscriptions.push(sub);

    // Default Follow-Up Automation
    const defaultAuto: FollowUpAutomation = {
      id: `auto_${business.id}_1`,
      businessId: business.id,
      name: 'Unpaid Product Enquiry Re-engagement',
      trigger: 'product_enquiry_no_purchase',
      delayHours: 24,
      condition: 'Lead engaged but no order created or paid within 24 hours',
      messageTemplate: "Hi! We noticed you were checking out our products earlier at {{business_name}}. Do you have any questions or would you like help placing your order? We're right here to help!",
      action: 'send_message',
      stopOnPurchase: true,
      stopOnHumanTakeover: true,
      isActive: true,
      sentCount: 0,
      convertedCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.automations.push(defaultAuto);

    this.save();
    return business;
  }

  public updateBusiness(businessId: string, updates: Partial<Business>): Business | undefined {
    const idx = this.data.businesses.findIndex(b => b.id === businessId);
    if (idx === -1) return undefined;
    this.data.businesses[idx] = {
      ...this.data.businesses[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.businesses[idx];
  }

  // --- Channels ---
  public getChannels(businessId: string): Channel[] {
    return this.data.channels.filter(c => c.businessId === businessId);
  }

  public getChannel(businessId: string, type: 'whatsapp' | 'telegram'): Channel | undefined {
    return this.data.channels.find(c => c.businessId === businessId && c.type === type);
  }

  public updateChannel(
    businessId: string,
    type: 'whatsapp' | 'telegram',
    updates: Partial<Channel>
  ): Channel | undefined {
    const idx = this.data.channels.findIndex(c => c.businessId === businessId && c.type === type);
    if (idx === -1) return undefined;
    this.data.channels[idx] = {
      ...this.data.channels[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.channels[idx];
  }

  // --- Products ---
  public getProducts(businessId: string): Product[] {
    return this.data.products.filter(p => p.businessId === businessId);
  }

  public getProductById(businessId: string, productId: string): Product | undefined {
    return this.data.products.find(p => p.businessId === businessId && p.id === productId);
  }

  public createProduct(product: Product): Product {
    this.data.products.push(product);
    this.save();
    return product;
  }

  public updateProduct(businessId: string, productId: string, updates: Partial<Product>): Product | undefined {
    const idx = this.data.products.findIndex(p => p.businessId === businessId && p.id === productId);
    if (idx === -1) return undefined;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(businessId: string, productId: string): boolean {
    const lenBefore = this.data.products.length;
    this.data.products = this.data.products.filter(p => !(p.businessId === businessId && p.id === productId));
    const deleted = this.data.products.length !== lenBefore;
    if (deleted) this.save();
    return deleted;
  }

  // --- Knowledge Documents ---
  public getKnowledgeDocs(businessId: string): KnowledgeDocument[] {
    return this.data.knowledgeDocuments.filter(k => k.businessId === businessId);
  }

  public createKnowledgeDoc(doc: KnowledgeDocument): KnowledgeDocument {
    this.data.knowledgeDocuments.push(doc);
    this.save();
    return doc;
  }

  public updateKnowledgeDoc(businessId: string, docId: string, updates: Partial<KnowledgeDocument>): KnowledgeDocument | undefined {
    const idx = this.data.knowledgeDocuments.findIndex(k => k.businessId === businessId && k.id === docId);
    if (idx === -1) return undefined;
    this.data.knowledgeDocuments[idx] = {
      ...this.data.knowledgeDocuments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.knowledgeDocuments[idx];
  }

  public deleteKnowledgeDoc(businessId: string, docId: string): boolean {
    const lenBefore = this.data.knowledgeDocuments.length;
    this.data.knowledgeDocuments = this.data.knowledgeDocuments.filter(k => !(k.businessId === businessId && k.id === docId));
    const deleted = this.data.knowledgeDocuments.length !== lenBefore;
    if (deleted) this.save();
    return deleted;
  }

  // --- AI Agent Config ---
  public getAIAgentConfig(businessId: string): AIAgentConfig | undefined {
    return this.data.aiAgents.find(a => a.businessId === businessId);
  }

  public updateAIAgentConfig(businessId: string, updates: Partial<AIAgentConfig>): AIAgentConfig | undefined {
    let agent = this.data.aiAgents.find(a => a.businessId === businessId);
    if (!agent) {
      agent = {
        id: `agent_${businessId}`,
        businessId,
        agentName: 'AI Sales Rep',
        tone: 'professional',
        greeting: 'Hello! How can I assist you today?',
        language: 'English',
        salesBehavior: {
          recommendProducts: true,
          upsellEnabled: true,
          crossSellEnabled: true,
          objectionHandling: true,
          paymentAssistance: true,
          followUpEnabled: true,
        },
        qualificationQuestions: [],
        rules: {
          maxDiscountPercent: 5,
          businessHoursStart: '08:00',
          businessHoursEnd: '18:00',
          outOfHoursBehavior: 'respond_with_hours',
          escalationKeywords: ['human', 'agent'],
          escalateIfUnknown: true,
        },
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
      this.data.aiAgents.push(agent);
    }
    const idx = this.data.aiAgents.findIndex(a => a.businessId === businessId);
    this.data.aiAgents[idx] = {
      ...this.data.aiAgents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.aiAgents[idx];
  }

  // --- Customers ---
  public getCustomers(businessId: string): Customer[] {
    return this.data.customers.filter(c => c.businessId === businessId);
  }

  public findCustomerByIdentifier(businessId: string, channel: 'whatsapp' | 'telegram', channelIdentifier: string): Customer | undefined {
    return this.data.customers.find(
      c => c.businessId === businessId && c.channel === channel && c.channelIdentifier === channelIdentifier
    );
  }

  public getOrCreateCustomer(businessId: string, channel: 'whatsapp' | 'telegram', channelIdentifier: string, name?: string): Customer {
    let customer = this.findCustomerByIdentifier(businessId, channel, channelIdentifier);
    if (!customer) {
      customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        channel,
        channelIdentifier,
        name: name || (channel === 'whatsapp' ? channelIdentifier : `@${channelIdentifier}`),
        contact: channelIdentifier,
        tags: ['New Lead'],
        totalOrdersCount: 0,
        totalSpent: 0,
        lastInteractionAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.data.customers.push(customer);
      this.save();
    } else {
      customer.lastInteractionAt = new Date().toISOString();
      if (name && !customer.name) {
        customer.name = name;
      }
      this.save();
    }
    return customer;
  }

  // --- Conversations ---
  public getConversations(businessId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.businessId === businessId)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  public getConversationById(businessId: string, conversationId: string): Conversation | undefined {
    return this.data.conversations.find(c => c.businessId === businessId && c.id === conversationId);
  }

  public getOrCreateConversation(businessId: string, customer: Customer): Conversation {
    let conv = this.data.conversations.find(
      c => c.businessId === businessId && c.customerId === customer.id
    );
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        customerId: customer.id,
        channel: customer.channel,
        channelIdentifier: customer.channelIdentifier,
        customerName: customer.name,
        isHumanHandled: false,
        leadStage: 'new',
        summary: 'Inquiry started',
        tags: ['Automated'],
        internalNotes: '',
        lastMessageText: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.data.conversations.push(conv);
      this.save();
    }
    return conv;
  }

  public updateConversation(businessId: string, conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
    const idx = this.data.conversations.findIndex(c => c.businessId === businessId && c.id === conversationId);
    if (idx === -1) return undefined;
    this.data.conversations[idx] = {
      ...this.data.conversations[idx],
      ...updates,
    };
    this.save();
    return this.data.conversations[idx];
  }

  // --- Messages ---
  public getMessages(businessId: string, conversationId: string): Message[] {
    return this.data.messages
      .filter(m => m.businessId === businessId && m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addMessage(message: Message): Message {
    this.data.messages.push(message);

    // Update parent conversation
    const convIdx = this.data.conversations.findIndex(c => c.id === message.conversationId);
    if (convIdx !== -1) {
      this.data.conversations[convIdx].lastMessageText = message.content;
      this.data.conversations[convIdx].lastMessageAt = message.timestamp;
      if (message.sender === 'customer') {
        this.data.conversations[convIdx].unreadCount = (this.data.conversations[convIdx].unreadCount || 0) + 1;
      }
    }

    this.save();
    return message;
  }

  // --- Leads ---
  public getLeads(businessId: string): Lead[] {
    return this.data.leads
      .filter(l => l.businessId === businessId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getOrCreateLead(businessId: string, customerId: string, conversationId: string, channel: 'whatsapp' | 'telegram', customerName?: string, contact?: string): Lead {
    let lead = this.data.leads.find(l => l.businessId === businessId && l.customerId === customerId);
    if (!lead) {
      lead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        businessId,
        customerId,
        conversationId,
        channel,
        customerName: customerName || 'Prospective Buyer',
        contactDetails: contact || '',
        requirement: 'Awaiting customer specification',
        productsInterested: [],
        estimatedValue: 0,
        currency: 'NGN',
        leadStage: 'new',
        notes: 'Lead initiated via ' + channel,
        qualificationAnswers: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.leads.push(lead);
      this.save();
    }
    return lead;
  }

  public updateLead(businessId: string, leadId: string, updates: Partial<Lead>): Lead | undefined {
    const idx = this.data.leads.findIndex(l => l.businessId === businessId && l.id === leadId);
    if (idx === -1) return undefined;
    this.data.leads[idx] = {
      ...this.data.leads[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.leads[idx];
  }

  // --- Orders ---
  public getOrders(businessId: string): Order[] {
    return this.data.orders
      .filter(o => o.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.data.orders.find(o => o.id === orderId);
  }

  public getOrderByReference(reference: string): Order | undefined {
    return this.data.orders.find(o => o.paymentReference === reference);
  }

  public createOrder(order: Order): Order {
    this.data.orders.push(order);

    // Update customer spend stats
    const customer = this.data.customers.find(c => c.id === order.customerId);
    if (customer) {
      customer.totalOrdersCount = (customer.totalOrdersCount || 0) + 1;
    }

    this.save();
    return order;
  }

  public updateOrder(orderId: string, updates: Partial<Order>): Order | undefined {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return undefined;
    this.data.orders[idx] = {
      ...this.data.orders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.paymentStatus === 'paid' && this.data.orders[idx].customerId) {
      const cust = this.data.customers.find(c => c.id === this.data.orders[idx].customerId);
      if (cust) {
        cust.totalSpent = (cust.totalSpent || 0) + this.data.orders[idx].totalAmount;
      }
    }

    this.save();
    return this.data.orders[idx];
  }

  // --- Follow-Up Automations ---
  public getAutomations(businessId: string): FollowUpAutomation[] {
    return this.data.automations.filter(a => a.businessId === businessId);
  }

  public createAutomation(auto: FollowUpAutomation): FollowUpAutomation {
    this.data.automations.push(auto);
    this.save();
    return auto;
  }

  public updateAutomation(businessId: string, autoId: string, updates: Partial<FollowUpAutomation>): FollowUpAutomation | undefined {
    const idx = this.data.automations.findIndex(a => a.businessId === businessId && a.id === autoId);
    if (idx === -1) return undefined;
    this.data.automations[idx] = {
      ...this.data.automations[idx],
      ...updates,
    };
    this.save();
    return this.data.automations[idx];
  }

  public deleteAutomation(businessId: string, autoId: string): boolean {
    const lenBefore = this.data.automations.length;
    this.data.automations = this.data.automations.filter(a => !(a.businessId === businessId && a.id === autoId));
    const deleted = this.data.automations.length !== lenBefore;
    if (deleted) this.save();
    return deleted;
  }

  // --- Team Members ---
  public getTeamMembers(businessId: string): TeamMember[] {
    return this.data.teamMembers.filter(t => t.businessId === businessId);
  }

  public addTeamMember(member: TeamMember): TeamMember {
    this.data.teamMembers.push(member);
    this.save();
    return member;
  }

  public removeTeamMember(businessId: string, memberId: string): boolean {
    const lenBefore = this.data.teamMembers.length;
    this.data.teamMembers = this.data.teamMembers.filter(t => !(t.businessId === businessId && t.id === memberId));
    const deleted = this.data.teamMembers.length !== lenBefore;
    if (deleted) this.save();
    return deleted;
  }

  // --- Subscription ---
  public getSubscription(businessId: string): Subscription | undefined {
    return this.data.subscriptions.find(s => s.businessId === businessId);
  }

  public incrementUsage(businessId: string, type: 'conversations' | 'ai') {
    const sub = this.data.subscriptions.find(s => s.businessId === businessId);
    if (sub) {
      if (type === 'conversations') sub.conversationsThisMonth += 1;
      if (type === 'ai') sub.aiGenerationsCount += 1;
      this.save();
    }
  }

  // --- Audit Logs ---
  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public getAuditLogs(businessId?: string): AuditLog[] {
    if (!businessId) return this.data.auditLogs.slice(0, 100);
    return this.data.auditLogs.filter(l => l.businessId === businessId).slice(0, 100);
  }

  // --- Real Metrics Analytics (Zero fake data) ---
  public getAnalytics(businessId: string, timeRange: 'today' | 'yesterday' | '7d' | '30d' | 'month') {
    const now = Date.now();
    let filterMs = 7 * 24 * 3600 * 1000;
    if (timeRange === 'today') filterMs = 24 * 3600 * 1000;
    else if (timeRange === 'yesterday') filterMs = 48 * 3600 * 1000;
    else if (timeRange === '30d' || timeRange === 'month') filterMs = 30 * 24 * 3600 * 1000;

    const threshold = new Date(now - filterMs).toISOString();

    const convs = this.data.conversations.filter(c => c.businessId === businessId && c.createdAt >= threshold);
    const leads = this.data.leads.filter(l => l.businessId === businessId && l.createdAt >= threshold);
    const orders = this.data.orders.filter(o => o.businessId === businessId && o.createdAt >= threshold);

    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const revenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingPayments = orders.filter(o => o.paymentStatus === 'payment_pending' || o.paymentStatus === 'unpaid');
    const pendingRevenue = pendingPayments.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const whatsappConvs = convs.filter(c => c.channel === 'whatsapp').length;
    const telegramConvs = convs.filter(c => c.channel === 'telegram').length;

    const humanEscalations = convs.filter(c => c.isHumanHandled).length;
    const aiHandled = convs.length - humanEscalations;

    const qualifiedLeads = leads.filter(l => ['qualified', 'proposal', 'payment_pending', 'won'].includes(l.leadStage)).length;
    const conversionRate = convs.length > 0 ? ((paidOrders.length / convs.length) * 100).toFixed(1) : '0.0';

    return {
      timeRange,
      totalConversations: convs.length,
      whatsappConversations: whatsappConvs,
      telegramConversations: telegramConvs,
      newLeads: leads.length,
      qualifiedLeads,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      revenue,
      pendingRevenue,
      conversionRate: `${conversionRate}%`,
      humanEscalations,
      aiHandled: Math.max(0, aiHandled),
    };
  }
}

export const db = new DatabaseService();
