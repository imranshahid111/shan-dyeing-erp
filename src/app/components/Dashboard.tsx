import { Package, Truck, FileText, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

const stats = [
  { label: 'Total Gray Lots', value: '245', change: '+12%', trend: 'up', icon: Package, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Active Delivery Orders', value: '38', change: '+8%', trend: 'up', icon: Truck, gradient: 'from-green-500 to-green-600' },
  { label: 'Pending Billing', value: '12', change: '-5%', trend: 'down', icon: FileText, gradient: 'from-orange-500 to-orange-600' },
  { label: 'Outstanding Payments', value: 'Rs 5.2L', change: '+3%', trend: 'up', icon: DollarSign, gradient: 'from-purple-500 to-purple-600' },
];

const monthlyData = [
  { month: 'Jan', gray: 4000, ready: 3800 },
  { month: 'Feb', gray: 3500, ready: 3300 },
  { month: 'Mar', gray: 4200, ready: 4000 },
  { month: 'Apr', gray: 3800, ready: 3600 },
];

const customerData = [
  { name: 'ABC Textiles', value: 35 },
  { name: 'XYZ Industries', value: 25 },
  { name: 'Global Fabrics', value: 20 },
  { name: 'Others', value: 20 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalCustomers: 0,
    pendingOrders: 0,
    totalReceivables: 0,
    todayPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to load dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const liveStats = useMemo(
    () => [
      { label: 'Total Customers', value: loading ? '...' : `${summary.totalCustomers}`, change: 'Live', trend: 'up', icon: Package, gradient: 'from-blue-500 to-blue-600' },
      { label: 'Active Delivery Orders', value: loading ? '...' : `${summary.pendingOrders}`, change: 'Live', trend: 'up', icon: Truck, gradient: 'from-green-500 to-green-600' },
      { label: 'Today Payments', value: loading ? '...' : `Rs ${Math.round(summary.todayPayments).toLocaleString()}`, change: 'Live', trend: 'up', icon: FileText, gradient: 'from-orange-500 to-orange-600' },
      { label: 'Outstanding Payments', value: loading ? '...' : `Rs ${Math.round(summary.totalReceivables).toLocaleString()}`, change: 'Live', trend: 'up', icon: DollarSign, gradient: 'from-purple-500 to-purple-600' },
    ],
    [loading, summary]
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {liveStats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <div key={stat.label} className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg shadow-${stat.gradient.split('-')[1]}-500/30`}>
                    <Icon className="text-white" size={26} />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    <TrendIcon size={14} />
                    {stat.change}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Monthly Production</h3>
              <p className="text-sm text-gray-500 mt-1">Gray vs Ready Fabric</p>
            </div>
            <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
              Last 4 Months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="readyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="gray" fill="url(#grayGradient)" name="Gray Fabric" radius={[8, 8, 0, 0]} />
              <Bar dataKey="ready" fill="url(#readyGradient)" name="Ready Fabric" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Customer Activity</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution by customer</p>
            </div>
            <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-semibold">
              This Month
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {customerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
            <p className="text-sm text-gray-500 mt-1">Latest system updates</p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</button>
        </div>
        <div className="space-y-3">
          {[
            { action: 'New Gray Lot', detail: 'Lot #GL-2045 created for ABC Textiles', time: '2 hours ago', color: 'blue' },
            { action: 'DO Generated', detail: 'DO #DO-5623 - 250m Ready fabric', time: '4 hours ago', color: 'green' },
            { action: 'Payment Received', detail: 'Rs 45,000 from XYZ Industries', time: '5 hours ago', color: 'purple' },
            { action: 'Invoice Created', detail: 'INV-4521 for Global Fabrics', time: '1 day ago', color: 'orange' },
          ].map((activity, index) => (
            <div key={index} className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-transparent hover:from-blue-50 hover:to-transparent transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-100">
              <div className={`w-2 h-2 rounded-full bg-${activity.color}-500 mt-2 group-hover:scale-150 transition-transform`}></div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{activity.action}</p>
                <p className="text-sm text-gray-500 mt-1">{activity.detail}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
