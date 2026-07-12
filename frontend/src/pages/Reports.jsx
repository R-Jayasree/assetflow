import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Wrench, Building2, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('utilization');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReport(); }, [activeReport]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/utilization';
      if (activeReport === 'maintenance') endpoint = '/reports/maintenance-frequency';
      if (activeReport === 'departments') endpoint = '/reports/department-allocation';
      if (activeReport === 'due') endpoint = '/reports/due-maintenance';
      const res = await api.get(endpoint);
      setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const reports = [
    { id: 'utilization', label: 'Asset Utilization', icon: TrendingUp },
    { id: 'maintenance', label: 'Maintenance Frequency', icon: Wrench },
    { id: 'departments', label: 'Department Allocation', icon: Building2 },
    { id: 'due', label: 'Due for Maintenance', icon: Calendar },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Actionable operational insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {reports.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)}
            className={`card p-4 text-left transition-all hover:shadow-md ${activeReport === r.id ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${activeReport === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <r.icon className="h-5 w-5" />
              </div>
              <span className="font-medium">{r.label}</span>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{reports.find(r => r.id === activeReport)?.label}</CardTitle>
            <CardDescription>Data visualization and summary</CardDescription>
          </div>
          <button className="btn-outline"><Download className="mr-2 h-4 w-4" /> Export</button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-12">Loading...</div> : (
            <div className="space-y-6">
              {activeReport === 'utilization' && (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="asset_name" tick={{fontSize: 12}} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_allocations" fill="#3b82f6" />
                      <Bar dataKey="maintenance_count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Asset</th><th>Category</th><th>Allocations</th><th>Maintenance</th><th>Value</th></tr></thead>
                      <tbody>
                        {data.slice(0, 10).map(d => (
                          <tr key={d.asset_id}>
                            <td className="font-medium">{d.asset_name}</td>
                            <td>{d.category_name}</td>
                            <td>{d.total_allocations}</td>
                            <td>{d.maintenance_count}</td>
                            <td>${d.acquisition_cost || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeReport === 'maintenance' && (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category_name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_requests" fill="#ef4444" />
                      <Bar dataKey="critical_count" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Category</th><th>Total Requests</th><th>Avg Resolution (days)</th><th>Critical</th><th>High</th></tr></thead>
                      <tbody>
                        {data.map(d => (
                          <tr key={d.category_name}>
                            <td className="font-medium">{d.category_name}</td>
                            <td>{d.total_requests}</td>
                            <td>{d.avg_resolution_days ? Math.round(d.avg_resolution_days) : 'N/A'}</td>
                            <td>{d.critical_count}</td>
                            <td>{d.high_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeReport === 'departments' && (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department_name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_assets" fill="#3b82f6" />
                      <Bar dataKey="allocated_assets" fill="#10b981" />
                      <Bar dataKey="maintenance_assets" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Department</th><th>Total</th><th>Allocated</th><th>Available</th><th>Maintenance</th><th>Total Value</th></tr></thead>
                      <tbody>
                        {data.map(d => (
                          <tr key={d.department_name}>
                            <td className="font-medium">{d.department_name}</td>
                            <td>{d.total_assets}</td>
                            <td>{d.allocated_assets}</td>
                            <td>{d.available_assets}</td>
                            <td>{d.maintenance_assets}</td>
                            <td>${d.total_value || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeReport === 'due' && (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Asset</th><th>Category</th><th>Last Maintenance</th><th>Days Since</th><th>Condition</th></tr></thead>
                    <tbody>
                      {data.map(d => (
                        <tr key={d.asset_id}>
                          <td className="font-medium">{d.asset_name}</td>
                          <td>{d.category_name}</td>
                          <td>{d.last_maintenance_date ? new Date(d.last_maintenance_date).toLocaleDateString() : 'Never'}</td>
                          <td>{d.days_since_maintenance || 'N/A'}</td>
                          <td>{d.current_condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
