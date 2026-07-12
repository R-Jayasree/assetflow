import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Check, Eye, XCircle } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const Audit = () => {
  const [audits, setAudits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditAssets, setAuditAssets] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => { fetchAudits(); fetchEmployees(); }, []);

  const fetchAudits = async () => {
    try { const res = await api.get('/audits'); setAudits(res.data.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { const res = await api.get('/auth/employees'); setEmployees(res.data.data); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/audits', form); setModalOpen(false); fetchAudits(); }
    catch (err) { console.error(err); }
  };

  const openDetail = async (audit) => {
    setSelectedAudit(audit);
    try {
      const [assetsRes, discRes] = await Promise.all([
        api.get(`/audits/${audit.audit_cycle_id}/assets`),
        api.get(`/audits/${audit.audit_cycle_id}/discrepancies`),
      ]);
      setAuditAssets(assetsRes.data.data);
      setDiscrepancies(discRes.data.data);
      setDetailModal(true);
    } catch (err) { console.error(err); }
  };

  const handleCloseAudit = async (auditId) => {
    if (!confirm('Close this audit cycle? Missing assets will be marked as Lost.')) return;
    try { await api.post(`/audits/${auditId}/close`); fetchAudits(); }
    catch (err) { console.error(err); }
  };

  const statusColors = { Planned: 'secondary', In_Progress: 'warning', Completed: 'success', Closed: 'default' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Audits</h1>
          <p className="text-muted-foreground mt-1">Run structured verification cycles</p>
        </div>
        <button onClick={() => { setForm({}); setModalOpen(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> New Audit Cycle
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12">Loading...</div> : (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Audit Name</th><th>Scope</th><th>Start Date</th><th>Status</th><th>Auditors</th><th>Discrepancies</th><th>Actions</th></tr></thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a.audit_cycle_id}>
                      <td className="font-medium">{a.audit_name}</td>
                      <td>{a.scope_type}: {a.scope_value || 'All'}</td>
                      <td>{new Date(a.start_date).toLocaleDateString()}</td>
                      <td><Badge variant={statusColors[a.status] || 'default'}>{a.status.replace('_', ' ')}</Badge></td>
                      <td>{a.auditor_count}</td>
                      <td>{a.discrepancy_count}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openDetail(a)} className="btn-ghost p-1"><Eye className="h-4 w-4" /></button>
                          {a.status === 'In_Progress' && (
                            <button onClick={() => handleCloseAudit(a.audit_cycle_id)} className="btn-primary p-1"><Check className="h-4 w-4" /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Audit Cycle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Audit Name *</label>
            <input className="input" value={form.auditName || ''} onChange={e => setForm({...form, auditName: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Scope Type *</label>
              <select className="input" value={form.scopeType || ''} onChange={e => setForm({...form, scopeType: e.target.value})} required>
                <option value="">Select scope</option>
                <option value="Department">Department</option>
                <option value="Location">Location</option>
                <option value="Category">Category</option>
                <option value="Organization">Organization</option>
              </select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Scope Value</label>
              <input className="input" value={form.scopeValue || ''} onChange={e => setForm({...form, scopeValue: e.target.value})} placeholder="e.g., IT or Building A" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Start Date *</label>
              <input className="input" type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} required /></div>
            <div><label className="text-sm font-medium mb-1.5 block">End Date</label>
              <input className="input" type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Create Audit</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`Audit: ${selectedAudit?.audit_name}`} className="max-w-3xl">
        {selectedAudit && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
              <div><p className="text-xs text-muted-foreground">Scope</p><p className="font-medium">{selectedAudit.scope_type}</p></div>
              <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium">{new Date(selectedAudit.start_date).toLocaleDateString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={statusColors[selectedAudit.status] || 'default'}>{selectedAudit.status.replace('_', ' ')}</Badge></div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Assets ({auditAssets.length})</h4>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Asset</th><th>Expected</th><th>Audit Status</th></tr></thead>
                  <tbody>
                    {auditAssets.slice(0, 10).map(a => (
                      <tr key={a.asset_id}>
                        <td><p className="font-medium">{a.asset_name}</p><p className="text-xs text-muted-foreground">{a.asset_tag}</p></td>
                        <td>{a.status}</td>
                        <td>{a.audit_status ? <Badge variant={a.audit_status === 'Verified' ? 'success' : 'destructive'}>{a.audit_status}</Badge> : 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {discrepancies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Discrepancies ({discrepancies.length})</h4>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Asset</th><th>Status Found</th><th>Auditor</th><th>Resolved</th></tr></thead>
                    <tbody>
                      {discrepancies.map(d => (
                        <tr key={d.discrepancy_id}>
                          <td><p className="font-medium">{d.asset_name}</p></td>
                          <td><Badge variant="destructive">{d.actual_status}</Badge></td>
                          <td>{d.auditor_name}</td>
                          <td>{d.is_resolved ? <Badge variant="success">Yes</Badge> : <Badge variant="warning">No</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Audit;
