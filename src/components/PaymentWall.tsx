import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, CreditCard, Building2, Smartphone, ArrowRight } from 'lucide-react';
import { api } from '../api';

interface PaymentWallProps {
  orderId: string;
}

export const PaymentWall: React.FC<PaymentWallProps> = ({ orderId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.getPaymentWallData(orderId);
      setData(res);
      if (res.order.paymentStatus === 'paid') {
        setPaySuccess(true);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Order not found');
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      // If live Paystack URL is provided, redirect or open Paystack checkout
      const initRes = await api.initializePayment(orderId, email || undefined);
      if (initRes.data?.authorization_url && initRes.status) {
        window.location.href = initRes.data.authorization_url;
        return;
      }

      // If in sandbox mode, verify directly
      const verifyRes = await api.verifyPayment(orderId);
      if (verifyRes.success) {
        setPaySuccess(true);
        fetchOrder();
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading secure payment wall...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">
            The order request might have expired or the link is invalid. Please contact the merchant on WhatsApp or Telegram.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition"
          >
            Go to PingTopay Home
          </a>
        </div>
      </div>
    );
  }

  const { order, business } = data;
  const isPaid = order.paymentStatus === 'paid' || paySuccess;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 py-8">
      {/* Brand Header */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            P
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">Ping</span>
            <span className="font-extrabold text-emerald-600 text-lg tracking-tight">Topay</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-3 py-1 rounded-full shadow-xs border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Paystack Secured</span>
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Merchant Banner */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">Merchant Store</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
              isPaid
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isPaid ? 'Payment Confirmed' : 'Payment Pending'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">{business.name}</h1>
          <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
            <span>{business.location}</span>
            <span>•</span>
            <span>Ref: {order.id}</span>
          </p>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          {isPaid ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Successful!</h2>
              <p className="text-slate-600 text-sm mb-4">
                Thank you for your order. We have verified your transaction through Paystack and notified {business.name}.
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left mb-6 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono font-bold text-slate-800">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-slate-900">{business.currencySymbol}{order.totalAmount.toLocaleString()} {business.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium text-slate-800">{order.customerName}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">You can safely return to your WhatsApp or Telegram chat.</p>
            </div>
          ) : (
            <div>
              {/* Order Items Summary */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">Order Summary</h3>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 bg-slate-50/50">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-700">Qty: {item.quantity} × {business.currencySymbol}{item.unitPrice.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {business.currencySymbol}{item.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-700">Total Amount Due</span>
                  <span className="text-2xl font-black text-slate-900">
                    {business.currencySymbol}{order.totalAmount.toLocaleString()} <span className="text-xs font-medium text-slate-700">{business.currency}</span>
                  </span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address for Receipt
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Payment Methods */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 mb-6">
                <p className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Available Paystack Channels:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-xs flex flex-col items-center gap-1">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">Debit Card</span>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-xs flex flex-col items-center gap-1">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">Bank Transfer</span>
                  </div>
                  <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-xs flex flex-col items-center gap-1">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-700">USSD / OPay</span>
                  </div>
                </div>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-base shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Paystack...</span>
                  </>
                ) : (
                  <>
                    <span>Pay {business.currencySymbol}{order.totalAmount.toLocaleString()} Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-600 mt-4">
                Secured by 256-bit SSL encryption. Transaction is automatically verified with {business.name}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
