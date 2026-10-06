import React, { useEffect, useState } from 'react';
import { User, Business, Channel } from './types';
import { api } from './api';
import { PaymentWall } from './components/PaymentWall';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { AgentBuilderView } from './components/AgentBuilderView';
import { ProductsView } from './components/ProductsView';
import { KnowledgeView } from './components/KnowledgeView';
import { CrmLeadsView } from './components/CrmLeadsView';
import { OrdersView } from './components/OrdersView';
import { ChannelsView } from './components/ChannelsView';
import { AutomationsView } from './components/AutomationsView';
import { TeamView } from './components/TeamView';
import { SimulatorView } from './components/SimulatorView';
import { AdminAndTerraformView } from './components/AdminAndTerraformView';

export default function App() {
  // 1. Detect public customer payment wall route (/pay/:orderId)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const payMatch = pathname.match(/^\/pay\/([a-zA-Z0-9_-]+)/);
  if (payMatch) {
    const orderId = payMatch[1];
    return <PaymentWall orderId={orderId} />;
  }

  // 2. Application SaaS State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  const checkAuth = async () => {
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setCurrentBusiness(res.business);
        const chans = await api.getChannels();
        setChannels(chans);
      }
    } catch {
      api.logout();
      setCurrentUser(null);
      setCurrentBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLoginSuccess = async (user: User, business: Business) => {
    setCurrentUser(user);
    setCurrentBusiness(business);
    try {
      const chans = await api.getChannels();
      setChannels(chans);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentBusiness(null);
    setChannels([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-xs">Loading PingTopay Workspace...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated: show Auth screen
  if (!currentUser || !currentBusiness) {
    return <AuthModal onSuccess={handleLoginSuccess} />;
  }

  // If business has not completed the 8-step onboarding wizard:
  if (!currentBusiness.onboardingCompleted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          user={currentUser}
          business={currentBusiness}
          channels={channels}
          onLogout={handleLogout}
          onOpenSimulator={() => setCurrentTab('simulator')}
        />
        <OnboardingWizard
          business={currentBusiness}
          onUpdateBusiness={b => setCurrentBusiness(b)}
          onComplete={() => {
            setCurrentBusiness({ ...currentBusiness, onboardingCompleted: true });
            setCurrentTab('dashboard');
          }}
        />
      </div>
    );
  }

  // Main Production Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={currentUser}
        business={currentBusiness}
        channels={channels}
        onLogout={handleLogout}
        onOpenSimulator={() => setCurrentTab('simulator')}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={t => setCurrentTab(t)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {currentTab === 'dashboard' && (
            <DashboardView business={currentBusiness} onNavigate={t => setCurrentTab(t)} />
          )}
          {currentTab === 'inbox' && <InboxView business={currentBusiness} />}
          {currentTab === 'agent' && <AgentBuilderView business={currentBusiness} />}
          {currentTab === 'products' && <ProductsView business={currentBusiness} />}
          {currentTab === 'knowledge' && <KnowledgeView business={currentBusiness} />}
          {currentTab === 'leads' && <CrmLeadsView business={currentBusiness} />}
          {currentTab === 'orders' && <OrdersView business={currentBusiness} />}
          {currentTab === 'channels' && (
            <ChannelsView
              business={currentBusiness}
              onUpdateBusiness={b => setCurrentBusiness(b)}
            />
          )}
          {currentTab === 'automations' && <AutomationsView business={currentBusiness} />}
          {currentTab === 'team' && <TeamView business={currentBusiness} />}
          {currentTab === 'simulator' && <SimulatorView business={currentBusiness} />}
          {currentTab === 'architecture' && <AdminAndTerraformView />}
        </main>
      </div>
    </div>
  );
}
