import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertTriangle, Package, Calendar, Wrench, ArrowRightLeft, ClipboardCheck } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const iconMap = {
  Asset_Assigned: Package,
  Asset_Returned: Package,
  Transfer_Requested: ArrowRightLeft,
  Transfer_Approved: ArrowRightLeft,
  Transfer_Rejected: ArrowRightLeft,
  Booking_Confirmed: Calendar,
  Booking_Cancelled: Calendar,
  Booking_Reminder: Calendar,
  Maintenance_Approved: Wrench,
  Maintenance_Rejected: Wrench,
  Maintenance_Resolved: Wrench,
  Overdue_Return: AlertTriangle,
  Audit_Assigned: ClipboardCheck,
  Audit_Discrepancy_Flagged: ClipboardCheck,
  Audit_Cycle_Closed: ClipboardCheck,
  System_Alert: AlertTriangle,
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const res = await api.get('/dashboard/notifications'); setNotifications(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try { await api.put(`/dashboard/notifications/${id}/read`); fetchNotifications(); }
    catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) { await markAsRead(n.notification_id); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay informed of all activities</p>
        </div>
        <button onClick={markAllRead} className="btn-outline">
          <Check className="mr-2 h-4 w-4" /> Mark All Read
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12">Loading...</div> : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => {
                const Icon = iconMap[n.notification_type] || Bell;
                return (
                  <div key={n.notification_id} className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{n.title}</p>
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.notification_id)} className="btn-ghost p-2 text-muted-foreground hover:text-foreground">
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
