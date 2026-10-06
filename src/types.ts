export type IndustryType =
  | 'Fashion & Clothing'
  | 'Real Estate'
  | 'Hotels & Short Lets'
  | 'Restaurants & Food'
  | 'Schools & Education'
  | 'Clinics & Healthcare'
  | 'Event Planning'
  | 'Online Stores / E-commerce'
  | 'Auto Dealers'
  | 'Beauty & Personal Care'
  | 'Electronics'
  | 'Travel & Tourism'
  | 'Professional Services'
  | 'Logistics & Delivery'
  | 'Fitness & Wellness'
  | 'Other';

export type UserRole = 'owner' | 'admin' | 'sales' | 'support' | 'viewer' | 'platform_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  industry: IndustryType;
  customIndustry?: string;
  country: string;
  currency: string;
  currencySymbol: string;
  location: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  businessHours: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  paystackWebhookSecret?: string;
  isPaystackConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChannelType = 'whatsapp' | 'telegram';
export type ChannelStatus = 'not_connected' | 'connecting' | 'connected' | 'error' | 'disconnected';

export interface Channel {
  id: string;
  businessId: string;
  type: ChannelType;
  status: ChannelStatus;
  whatsappConfig?: {
    wabaId?: string;
    phoneNumberId?: string;
    phoneNumber?: string;
    accessToken?: string;
    verifyToken?: string;
  };
  telegramConfig?: {
    botToken?: string;
    botUsername?: string;
  };
  webhookUrl: string;
  lastConnectedAt?: string;
  lastErrorMessage?: string;
  updatedAt: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  options: string[];
  priceDelta?: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  discountPrice?: number;
  images: string[];
  variations: ProductVariation[];
  features: string[];
  benefits: string[];
  stock: number;
  isActive: boolean;
  type: 'product' | 'service';
  relatedProductIds: string[];
  upsellProductIds: string[];
  crossSellProductIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeCategory = 'faq' | 'policy' | 'delivery' | 'business_info' | 'document';

export interface KnowledgeDocument {
  id: string;
  businessId: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QualificationQuestion {
  id: string;
  question: string;
  field: string;
  isRequired: boolean;
  suggestedAnswers?: string[];
}

export interface AIAgentConfig {
  id: string;
  businessId: string;
  agentName: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'concise' | 'consultative';
  greeting: string;
  language: string;
  salesBehavior: {
    recommendProducts: boolean;
    upsellEnabled: boolean;
    crossSellEnabled: boolean;
    objectionHandling: boolean;
    paymentAssistance: boolean;
    followUpEnabled: boolean;
  };
  qualificationQuestions: QualificationQuestion[];
  rules: {
    maxDiscountPercent: number;
    businessHoursStart: string;
    businessHoursEnd: string;
    outOfHoursBehavior: 'respond_with_hours' | 'take_message' | 'continue_ai';
    escalationKeywords: string[];
    escalateIfUnknown: boolean;
  };
  isActive: boolean;
  updatedAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  channel: ChannelType;
  channelIdentifier: string;
  name?: string;
  contact?: string;
  notes?: string;
  tags: string[];
  totalOrdersCount: number;
  totalSpent: number;
  lastInteractionAt: string;
  createdAt: string;
}

export type LeadStage =
  | 'new'
  | 'engaged'
  | 'qualified'
  | 'proposal'
  | 'payment_pending'
  | 'won'
  | 'lost'
  | 'follow_up';

export interface Lead {
  id: string;
  businessId: string;
  customerId: string;
  conversationId: string;
  channel: ChannelType;
  customerName?: string;
  contactDetails: string;
  requirement: string;
  productsInterested: string[];
  estimatedValue: number;
  currency: string;
  leadStage: LeadStage;
  notes: string;
  assignedStaffId?: string;
  followUpDate?: string;
  qualificationAnswers: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  businessId: string;
  customerId: string;
  channel: ChannelType;
  channelIdentifier: string;
  customerName?: string;
  isHumanHandled: boolean;
  assignedStaffId?: string;
  leadStage: LeadStage;
  orderStatus?: string;
  summary: string;
  tags: string[];
  internalNotes: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  businessId: string;
  sender: 'customer' | 'ai' | 'human';
  senderName?: string;
  content: string;
  channel: ChannelType;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  metadata?: {
    intent?: string;
    suggestedProducts?: string[];
    paymentLink?: string;
    escalationReason?: string;
    orderId?: string;
  };
}

export type PaymentStatus =
  | 'unpaid'
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'abandoned'
  | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  conversationId: string;
  channel: ChannelType;
  customerName: string;
  customerContact: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentReference?: string;
  paystackAccessCode?: string;
  paystackAuthorizationUrl?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpAutomation {
  id: string;
  businessId: string;
  name: string;
  trigger: 'product_enquiry_no_purchase' | 'order_pending_payment' | 'lead_inactivity' | 'post_purchase_checkin';
  delayHours: number;
  condition: string;
  messageTemplate: string;
  action: 'send_message' | 'escalate_human' | 'mark_lead_lost';
  stopOnPurchase: boolean;
  stopOnHumanTakeover: boolean;
  isActive: boolean;
  sentCount: number;
  convertedCount: number;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  businessId: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'invited';
  createdAt: string;
}

export interface AnalyticsData {
  timeRange: string;
  totalConversations: number;
  whatsappConversations: number;
  telegramConversations: number;
  newLeads: number;
  qualifiedLeads: number;
  totalOrders: number;
  paidOrders: number;
  revenue: number;
  pendingRevenue: number;
  conversionRate: string;
  humanEscalations: number;
  aiHandled: number;
}
