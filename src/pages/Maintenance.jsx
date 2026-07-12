import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Check, X, Play, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import useAuthStore from '../store/authStore';

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState({});
  const { user } = useAuthStore();

  useEffect(() => { fetchRequests(); fetchAssets(); }, []);

  const fetchRequests = async () => {
    try { const res = await api.get('/maintenance'); setRequests(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAssets = async () => {
    try { const res = await api.get('/assets'); setAssets(res.data.data); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/maintenance', form); setModalOpen(false); fetchRequests(); }
    catch (err) { console.error(err); }
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await api.put(`/maintenance/${requestId}/status`, { status });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const priorityColors = { Low: 'secondary', Medium: 'default', High: 'warning', Critical: 'destructive' };
  const statusColors = { Pending: 'warning', Approved: 'success', Rejected: 'destructive', Technician_Assigned: 'default', In_Progress: 'default', Resolved: 'success', Closed: 'secondary' };

  const canApprove = ['Admin', 'Asset_Manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Track and manage maintenance requests</p>
        </div>
        <button onClick={() => { setForm({}); setModalOpen(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> Raise Request
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12">Loading...</div> : (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Asset</th><th>Title</th><th>Priority</th><th>Status</th><th>Requested By</th><th>Actions</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.request_id}>
                      <td><p className="font-medium">{r.asset_name}</p><p className="text-xs text-muted-foreground">{r.asset_tag}</p></td>
                      <td>{r.title}</td>
                      <td><Badge variant={priorityColors[r.priority] || 'default'}>{r.priority}</Badge></td>
                      <td><Badge variant={statusColors[r.status] || 'default'}>{r.status.replace('_', ' ')}</Badge></td>
                      <td>{r.requested_by_name}</td>
                      <td>
                        <div className="flex gap-1">
                          {canApprove && r.status === 'Pending' && (
                            <><button onClick={() => handleStatusChange(r.request_id, 'Approved')} className="btn-primary p-1"><Check className="h-4 w-4" /></button>
                            <button onClick={() => handleStatusChange(r.request_id, 'Rejected')} className="btn-destructive p-1"><X className="h-4 w-4" /></button></>
                          )}
                          {canApprove && r.status === 'Approved' && (
                            <button onClick={() => handleStatusChange(r.request_id, 'Technician_Assigned')} className="btn-primary p-1"><Play className="h-4 w-4" /></button>
                          )}
                          {canApprove && r.status === 'In_Progress' && (
                            <button onClick={() => handleStatusChange(r.request_id, 'Resolved')} className="btn-primary p-1"><CheckCircle className="h-4 w-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Raise Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Asset *</label>
            <select className="input" value={form.assetId || ''} onChange={e => setForm({...form, assetId: e.target.value})} required>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_tag} - {a.asset_name}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Title *</label>
            <input className="input" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} required /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Description *</label>
            <textarea className="input min-h-[100px]" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} required /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Priority</label>
            <select className="input" value={form.priority || 'Medium'} onChange={e => setForm({...form, priority: e.target.value})}>
              <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
            </select></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;
