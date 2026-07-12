import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ArrowUpRight, ArrowDownRight, Wrench, Calendar, 
  AlertTriangle, Clock, TrendingUp, Plus, BookOpen, AlertCircle, Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const KPICard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link || '#'}>
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [kpisRes, overdueRes, upcomingRes, activityRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/overdue-returns'),
        api.get('/dashboard/upcoming-returns'),
        api.get('/dashboard/recent-activity'),
      ]);
      setKpis(kpisRes.data.data);
      setOverdue(overdueRes.data.data);
      setUpcoming(upcomingRes.data.data);
      setActivity(activityRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusData = kpis ? [
    { name: 'Available', value: kpis.assets_available || 0, color: '#10b981' },
    { name: 'Allocated', value: kpis.assets_allocated || 0, color: '#3b82f6' },
    { name: 'Maintenance', value: kpis.assets_under_maintenance || 0, color: '#f59e0b' },
    { name: 'Lost', value: kpis.assets_lost || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time operational overview</p>
        </div>
        <div className="flex gap-3">
          <Link to="/assets" className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> Register Asset
          </Link>
          <Link to="/bookings" className="btn-outline">
            <BookOpen className="mr-2 h-4 w-4" /> Book Resource
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Assets" value={kpis?.total_assets || 0} icon={Package} color="bg-blue-500" link="/assets" />
        <KPICard title="Available" value={kpis?.assets_available || 0} icon={Package} color="bg-emerald-500" link="/assets" />
        <KPICard title="Under Maintenance" value={kpis?.assets_under_maintenance || 0} icon={Wrench} color="bg-amber-500" link="/maintenance" />
        <KPICard title="Active Bookings" value={kpis?.active_bookings || 0} icon={Calendar} color="bg-violet-500" link="/bookings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
            <CardDescription>Current state of all registered assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                  <span>{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <div>
                  <p className="font-medium">Overdue Returns</p>
                  <p className="text-sm text-muted-foreground">{kpis?.overdue_returns || 0} assets past due date</p>
                </div>
              </div>
              <Badge variant="destructive">{kpis?.overdue_returns || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium">Pending Transfers</p>
                  <p className="text-sm text-muted-foreground">{kpis?.pending_transfers || 0} awaiting approval</p>
                </div>
              </div>
              <Badge variant="warning">{kpis?.pending_transfers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Maintenance Today</p>
                  <p className="text-sm text-muted-foreground">{kpis?.maintenance_today || 0} scheduled</p>
                </div>
              </div>
              <Badge variant="default">{kpis?.maintenance_today || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Overdue Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No overdue assets</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Asset</th><th>Holder</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {overdue.slice(0, 5).map(item => (
                      <tr key={item.allocation_id}>
                        <td><p className="font-medium">{item.asset_name}</p><p className="text-xs text-muted-foreground">{item.asset_tag}</p></td>
                        <td>{item.holder_name || 'N/A'}</td>
                        <td><Badge variant="destructive">{new Date(item.expected_return_date).toLocaleDateString()}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Upcoming Returns (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming returns</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Asset</th><th>Holder</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {upcoming.slice(0, 5).map(item => (
                      <tr key={item.allocation_id}>
                        <td><p className="font-medium">{item.asset_name}</p><p className="text-xs text-muted-foreground">{item.asset_tag}</p></td>
                        <td>{item.holder_name || 'N/A'}</td>
                        <td><Badge variant="warning">{new Date(item.expected_return_date).toLocaleDateString()}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Action</th><th>Entity</th><th>Description</th><th>Time</th></tr></thead>
              <tbody>
                {activity.slice(0, 10).map(log => (
                  <tr key={log.log_id}>
                    <td><Badge variant={log.action === 'UPDATE' ? 'warning' : 'default'}>{log.action}</Badge></td>
                    <td>{log.entity_type}</td>
                    <td>{log.description}</td>
                    <td className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
