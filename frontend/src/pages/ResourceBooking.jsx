import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, X, Clock } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const ResourceBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [bookableAssets, setBookableAssets] = useState([]);
  const [calendarView, setCalendarView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchBookings(); fetchBookableAssets(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBookableAssets = async () => {
    try {
      const res = await api.get('/bookings/bookable-assets');
      setBookableAssets(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bookings', form);
      setModalOpen(false); fetchBookings();
    } catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      fetchBookings();
    } catch (err) { console.error(err); }
  };

  const statusColors = { Upcoming: 'default', Ongoing: 'success', Completed: 'secondary', Cancelled: 'destructive' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resource Booking</h1>
          <p className="text-muted-foreground mt-1">Book shared resources by time slot</p>
        </div>
        <button onClick={() => { setForm({}); setModalOpen(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> New Booking
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12">Loading...</div> : (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Resource</th><th>Booked By</th><th>Start Time</th><th>End Time</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.booking_id}>
                      <td><p className="font-medium">{b.asset_name}</p><p className="text-xs text-muted-foreground">{b.asset_tag}</p></td>
                      <td>{b.booked_by_name}</td>
                      <td>{new Date(b.start_time).toLocaleString()}</td>
                      <td>{new Date(b.end_time).toLocaleString()}</td>
                      <td>{b.purpose || '—'}</td>
                      <td><Badge variant={statusColors[b.status] || 'default'}>{b.status}</Badge></td>
                      <td>{b.status === 'Upcoming' && (
                        <button onClick={() => handleCancel(b.booking_id)} className="btn-ghost p-1 text-destructive"><X className="h-4 w-4" /></button>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Booking">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Resource *</label>
            <select className="input" value={form.assetId || ''} onChange={e => setForm({...form, assetId: e.target.value})} required>
              <option value="">Select resource</option>
              {bookableAssets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_name} ({a.location || 'No location'})</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Start Time *</label>
              <input className="input" type="datetime-local" value={form.startTime || ''} onChange={e => setForm({...form, startTime: e.target.value})} required /></div>
            <div><label className="text-sm font-medium mb-1.5 block">End Time *</label>
              <input className="input" type="datetime-local" value={form.endTime || ''} onChange={e => setForm({...form, endTime: e.target.value})} required /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Purpose</label>
            <textarea className="input min-h-[80px]" value={form.purpose || ''} onChange={e => setForm({...form, purpose: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Book Resource</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceBooking;
