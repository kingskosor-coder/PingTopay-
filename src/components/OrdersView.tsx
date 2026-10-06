import React, { useEffect, useState } from 'react';
import { ShoppingCart, ExternalLink, CheckCircle, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { Order, Business, PaymentStatus, OrderStatus } from '../types';
import { api } from '../api';

interface OrdersViewProps {
  business: Business;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const list = await api.getOrders();
      setOrders(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, paymentStatus?: PaymentStatus, orderStatus?: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, { paymentStatus, orderStatus });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    }
  };

  const currencySymbol = business.currencySymbol || '₦';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Orders & Paystack Commerce
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Real orders generated autonomously by your AI agent or staff on WhatsApp and Telegram.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-600">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No orders created yet</h3>
          <p className="text-xs text-slate-700 mt-1 mb-4">
            When customers say "I want to buy X" or "Give me the payment link" on WhatsApp/Telegram, PingTopay creates the order and payment link here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Fulfillment</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => {
                const isPaid = order.paymentStatus === 'paid';
                return (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-[10px] text-slate-600">{order.customerContact}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        order.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {order.channel}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="text-slate-800 font-medium">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {currencySymbol}{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPaid ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                        {order.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 capitalize font-medium text-slate-700">
                      {order.orderStatus}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <a
                        href={`/pay/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                      >
                        <span>Payment Wall</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
