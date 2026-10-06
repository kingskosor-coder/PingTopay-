import {
  User,
  Business,
  Channel,
  Product,
  KnowledgeDocument,
  AIAgentConfig,
  Conversation,
  Message,
  Lead,
  Order,
  FollowUpAutomation,
  TeamMember,
  AnalyticsData,
} from './types';

const TOKEN_KEY = 'ptp_auth_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errMessage = `Request failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errMessage = errorData.error;
      } catch {}
      throw new Error(errMessage);
    }

    return response.json();
  }

  // --- Auth ---
  public async register(data: any): Promise<{ token: string; user: User; business: Business }> {
    const res = await this.request<{ token: string; user: User; business: Business }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  public async login(data: any): Promise<{ token: string; user: User; business: Business }> {
    const res = await this.request<{ token: string; user: User; business: Business }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User; business: Business }> {
    return this.request<{ user: User; business: Business }>('/api/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // --- Business & Onboarding ---
  public async getBusiness(): Promise<Business> {
    return this.request<Business>('/api/business');
  }

  public async updateBusiness(data: Partial<Business>): Promise<Business> {
    return this.request<Business>('/api/business', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async connectPaystack(data: { publicKey: string; secretKey: string; webhookSecret?: string }) {
    return this.request<{ success: boolean; message: string; business: Business }>('/api/business/paystack', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Channels ---
  public async getChannels(): Promise<Channel[]> {
    return this.request<Channel[]>('/api/channels');
  }

  public async configureWhatsApp(data: any) {
    return this.request<{ success: boolean; channel: Channel; error?: string }>('/api/channels/whatsapp/configure', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async configureTelegram(data: { botToken: string }) {
    return this.request<{ success: boolean; message: string; channel: Channel }>('/api/channels/telegram/configure', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async disconnectChannel(type: 'whatsapp' | 'telegram') {
    return this.request<Channel>('/api/channels/disconnect', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  // --- Simulator ---
  public async sendTestMessage(data: {
    channel: 'whatsapp' | 'telegram';
    customerIdentifier?: string;
    customerName?: string;
    message: string;
  }) {
    return this.request<any>('/api/channels/test-message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Products ---
  public async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/products');
  }

  public async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  public async seedIndustryProducts(): Promise<{ success: boolean; count: number; products: Product[] }> {
    return this.request<any>('/api/products/seed-industry', {
      method: 'POST',
    });
  }

  // --- Knowledge ---
  public async getKnowledge(): Promise<KnowledgeDocument[]> {
    return this.request<KnowledgeDocument[]>('/api/knowledge');
  }

  public async createKnowledge(data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    return this.request<KnowledgeDocument>('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateKnowledge(id: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    return this.request<KnowledgeDocument>(`/api/knowledge/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async deleteKnowledge(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/knowledge/${id}`, {
      method: 'DELETE',
    });
  }

  // --- AI Agent ---
  public async getAgentConfig(): Promise<AIAgentConfig> {
    return this.request<AIAgentConfig>('/api/agent');
  }

  public async updateAgentConfig(data: Partial<AIAgentConfig>): Promise<AIAgentConfig> {
    return this.request<AIAgentConfig>('/api/agent', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Conversations & Messages ---
  public async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/conversations');
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/api/conversations/${conversationId}/messages`);
  }

  public async sendHumanMessage(conversationId: string, content: string): Promise<Message> {
    return this.request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  public async toggleTakeover(conversationId: string, isHumanHandled: boolean): Promise<Conversation> {
    return this.request<Conversation>(`/api/conversations/${conversationId}/takeover`, {
      method: 'PATCH',
      body: JSON.stringify({ isHumanHandled }),
    });
  }

  public async updateConversationNotes(conversationId: string, data: { internalNotes?: string; tags?: string[] }) {
    return this.request<Conversation>(`/api/conversations/${conversationId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- CRM Leads ---
  public async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/api/leads');
  }

  public async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Orders ---
  public async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders');
  }

  public async updateOrderStatus(id: string, data: { paymentStatus?: string; orderStatus?: string }): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Automations ---
  public async getAutomations(): Promise<FollowUpAutomation[]> {
    return this.request<FollowUpAutomation[]>('/api/automations');
  }

  public async createAutomation(data: Partial<FollowUpAutomation>): Promise<FollowUpAutomation> {
    return this.request<FollowUpAutomation>('/api/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateAutomation(id: string, data: Partial<FollowUpAutomation>): Promise<FollowUpAutomation> {
    return this.request<FollowUpAutomation>(`/api/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async deleteAutomation(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/automations/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Team ---
  public async getTeam(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>('/api/team');
  }

  public async inviteTeamMember(data: { email: string; name: string; role: string }): Promise<TeamMember> {
    return this.request<TeamMember>('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async deleteTeamMember(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/team/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Analytics ---
  public async getAnalytics(range: string = '7d'): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(`/api/analytics?range=${range}`);
  }

  // --- Admin ---
  public async getAdminOverview(): Promise<any> {
    return this.request<any>('/api/admin/overview');
  }

  // --- System Contract & Terraform ---
  public async getSystemContract(): Promise<any> {
    return this.request<any>('/api/system/contract');
  }

  // --- Public Payment Wall ---
  public async getPaymentWallData(orderId: string): Promise<any> {
    const res = await fetch(`/api/payments/order/${orderId}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  }

  public async initializePayment(orderId: string, customerEmail?: string): Promise<any> {
    const res = await fetch(`/api/payments/initialize/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerEmail }),
    });
    return res.json();
  }

  public async verifyPayment(orderId: string, reference?: string): Promise<any> {
    const res = await fetch(`/api/payments/verify/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });
    return res.json();
  }
}

export const api = new ApiClient();
