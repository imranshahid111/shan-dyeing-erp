import { Package, Truck, FileText, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  fontSize: '13px',
};

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    pendingOrders: 0,
    totalReceivables: 0,
    todayPayments: 0,
  });
  const [charts, setCharts] = useState<{
    monthlyData: { month: string; gray: number; ready: number }[];
    customerData: { name: string; value: number }[];
  }>({
    monthlyData: [],
    customerData: [],
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse privileges from localStorage
  const privileges = useMemo(() => {
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.role === 'admin') {
          return {
            role: 'admin',
            can_view_dashboard: true,
            can_view_gray_lots: true,
            can_view_delivery_orders: true,
            can_view_billing: true,
            can_view_payments: true,
            can_view_customers: true,
            can_view_qualities: true,
            can_view_gate_pass: true,
            can_view_staff: true,
            can_view_activity_logs: true,
            can_view_reports: true,
          };
        }
        return { role: parsed?.role || 'staff', ...(parsed?.privileges || {}) };
      }
    } catch { /* silent */ }
    return { role: 'staff' };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sumData, chartData, activityData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getCharts(),
          dashboardService.getActivity(),
        ]);
        setSummary(sumData);
        setCharts(chartData);
        setActivity(activityData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = useMemo(() => [
    {
      label: 'Total Customers',
      value: loading ? null : `${summary.totalCustomers}`,
      subtext: 'Registered accounts',
      icon: Package,
      iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      iconShadow: 'rgba(59,130,246,0.3)',
      trend: 'up',
      change: 'Live',
    },
    {
      label: 'Active Orders',
      value: loading ? null : `${summary.pendingOrders}`,
      subtext: 'Delivery orders pending',
      icon: Truck,
      iconBg: 'linear-gradient(135deg, #10b981, #059669)',
      iconShadow: 'rgba(16,185,129,0.3)',
      trend: 'up',
      change: 'Live',
    },
    {
      label: "Today's Payments",
      value: loading ? null : `Rs ${Math.round(summary.todayPayments).toLocaleString()}`,
      subtext: 'Received today',
      icon: FileText,
      iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      iconShadow: 'rgba(245,158,11,0.3)',
      trend: 'up',
      change: 'Live',
    },
    {
      label: 'Outstanding',
      value: loading ? null : `Rs ${Math.round(summary.totalReceivables).toLocaleString()}`,
      subtext: 'Total receivables',
      icon: Wallet,
      iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      iconShadow: 'rgba(139,92,246,0.3)',
      trend: 'up',
      change: 'Live',
    },
  ], [loading, summary]);

  const visibleStatCards = useMemo(() => {
    return statCards.filter(card => {
      if (privileges.role === 'admin') return true;
      if (card.label === 'Total Customers') return !!privileges.can_view_customers;
      if (card.label === 'Active Orders') return !!privileges.can_view_delivery_orders;
      if (card.label === "Today's Payments") return !!privileges.can_view_payments;
      if (card.label === 'Outstanding') return !!privileges.can_view_payments;
      return true;
    });
  }, [statCards, privileges]);

  const showMonthlyProduction = privileges.role === 'admin' || privileges.can_view_gray_lots;
  const showCustomerDistribution = privileges.role === 'admin' || privileges.can_view_customers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1rem',
      }}>
        {visibleStatCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={stat.label}
              className="stat-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '14px',
                  background: stat.iconBg,
                  boxShadow: `0 6px 16px ${stat.iconShadow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} color="white" />
                </div>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  fontSize: '0.6875rem', fontWeight: 700,
                  color: 'var(--success)',
                  background: '#f0fdf4',
                  padding: '3px 8px', borderRadius: '100px',
                }}>
                  <TrendIcon size={12} />
                  {stat.change}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gray-500)', marginBottom: '4px' }}>
                  {stat.label}
                </p>
                {stat.value === null ? (
                  <div style={{ height: '2rem', display: 'flex', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '60%', height: '1.5rem' }} />
                  </div>
                ) : (
                  <p style={{
                    fontSize: '1.625rem', fontWeight: 800, color: 'var(--gray-900)',
                    letterSpacing: '-0.02em', lineHeight: 1.2,
                  }}>{stat.value}</p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '2px' }}>{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      {(showMonthlyProduction || showCustomerDistribution) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: showMonthlyProduction && showCustomerDistribution ? '1fr 1fr' : '1fr',
          gap: '1rem'
        }}>
          {/* Monthly Production Chart */}
          {showMonthlyProduction && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                    Monthly Production
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '2px' }}>Gray vs Ready Fabric</p>
                </div>
                <span className="badge badge-blue">Last 4 Months</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={charts.monthlyData} barGap={4}>
                    <defs>
                      <linearGradient id="grayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Bar dataKey="gray" fill="url(#grayGrad)" name="Gray Fabric" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="ready" fill="url(#readyGrad)" name="Ready Fabric" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Customer Activity Chart */}
          {showCustomerDistribution && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                    Customer Distribution
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '2px' }}>By customer activity</p>
                </div>
                <span className="badge badge-purple">This Month</span>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie
                      data={charts.customerData}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.customerData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {charts.customerData.map((item, idx) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)', flex: 1 }}>{item.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-800)' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
              Recent Activity
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '2px' }}>Latest system updates</p>
          </div>
          <button style={{
            fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-600)',
            background: 'none', border: 'none', cursor: 'pointer',
          }}>View All</button>
        </div>
        <div style={{ padding: '0.5rem 0' }}>
          {activity.length === 0 && !loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No recent activity</div>
          )}
          {activity.map((activity, index) => (
            <div
              key={index}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '0.875rem 1.25rem',
                transition: 'background var(--transition-fast)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: activity.color,
                marginTop: '6px', flexShrink: 0,
                boxShadow: `0 0 0 3px ${activity.color}20`,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.875rem', margin: 0 }}>
                  {activity.action}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '2px', margin: 0 }}>
                  {activity.detail}
                </p>
              </div>
              <span style={{
                fontSize: '0.75rem', color: 'var(--gray-400)',
                whiteSpace: 'nowrap', fontWeight: 500,
              }}>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
