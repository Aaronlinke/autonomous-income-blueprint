import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  // Simulierte Analytics-Daten (in der echten Anwendung würde das vom Server kommen)
  const mockAnalyticsData = {
    summary: {
      total_events: 15420,
      total_conversions: 342,
      total_revenue: 8750.50,
      conversion_rate: 2.22,
      revenue_per_day: 291.68,
      events_per_day: 514
    },
    daily_performance: {
      '2024-01-01': { events: 450, conversions: 12, revenue: 280 },
      '2024-01-02': { events: 520, conversions: 15, revenue: 320 },
      '2024-01-03': { events: 480, conversions: 11, revenue: 250 },
      '2024-01-04': { events: 600, conversions: 18, revenue: 410 },
      '2024-01-05': { events: 550, conversions: 14, revenue: 350 },
      '2024-01-06': { events: 490, conversions: 13, revenue: 290 },
      '2024-01-07': { events: 580, conversions: 16, revenue: 380 }
    },
    platform_distribution: [
      { platform: 'WordPress', count: 5200, percentage: 33.7 },
      { platform: 'Twitter', count: 4100, percentage: 26.6 },
      { platform: 'LinkedIn', count: 3800, percentage: 24.6 },
      { platform: 'Email', count: 2320, percentage: 15.1 }
    ],
    revenue_by_source: [
      { source: 'Affiliate Marketing', revenue: 3200 },
      { source: 'Digital Products', revenue: 2800 },
      { source: 'Sponsored Content', revenue: 1950 },
      { source: 'Consulting', revenue: 800.50 }
    ],
    top_opportunities: [
      { opportunity_id: 1, title: 'KI-Prompt Bibliothek', revenue: 2800, roi: 4.90 },
      { opportunity_id: 2, title: 'Online-Kurse Affiliate', revenue: 2200, roi: 4.00 },
      { opportunity_id: 3, title: 'WordPress Plugin', revenue: 1500, roi: 3.50 }
    ],
    performance_grade: 'A',
    growth_rate: 15.3,
    recommendations: [
      {
        type: 'conversion_optimization',
        priority: 'medium',
        title: 'Landing Page A/B Test',
        description: 'Testen Sie verschiedene Call-to-Action Buttons um die Conversion-Rate zu steigern.'
      },
      {
        type: 'content_optimization',
        priority: 'high',
        title: 'Top-Content skalieren',
        description: 'Ihre KI-Prompt Bibliothek performt sehr gut. Erstellen Sie ähnliche Produkte.'
      }
    ]
  };

  useEffect(() => {
    // Simuliere API-Aufruf
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);
  }, [timeframe]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('de-DE').format(value);
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100'
    };
    return colors[grade] || colors['C'];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600 bg-red-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'low': 'text-green-600 bg-green-100'
    };
    return colors[priority] || colors['medium'];
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Keine Analytics-Daten verfügbar</p>
      </div>
    );
  }

  const dailyData = Object.entries(analyticsData.daily_performance).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
    revenue: data.revenue,
    conversions: data.conversions,
    events: data.events
  }));

  return (
    <div className="space-y-6">
      {/* Header mit Zeitraum-Auswahl */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="90d">Letzte 90 Tage</option>
        </select>
      </div>

      {/* Performance-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt-Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.summary.total_revenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">+{analyticsData.growth_rate}%</span>
            <span className="text-sm text-gray-500 ml-1">vs. vorherige Periode</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.summary.total_conversions)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Rate: {analyticsData.summary.conversion_rate.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.summary.total_events)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">{formatNumber(analyticsData.summary.events_per_day)} pro Tag</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">Note</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(analyticsData.performance_grade)}`}>
                  {analyticsData.performance_grade}
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Ausgezeichnete Performance</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue-Entwicklung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue (€)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic-Verteilung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.platform_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ platform, percentage }) => `${platform} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.platform_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Source */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue nach Quelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenue_by_source}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversions Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion-Entwicklung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversions" stroke="#ffc658" strokeWidth={2} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top-Performance Opportunities</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.top_opportunities.map((opportunity) => (
                <tr key={opportunity.opportunity_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(opportunity.revenue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{opportunity.roi.toFixed(2)}x</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Aktiv
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empfehlungen */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">KI-Empfehlungen</h3>
        <div className="space-y-4">
          {analyticsData.recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                  Umsetzen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
