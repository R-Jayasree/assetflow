import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Check, X, RotateCcw } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const AssetAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('allocations');
  const [modalOpen, setModalOpen] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { fetchData(); fetchAssets(); fetchEmployees(); }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeView === 'allocations') {
        const res = await api.get('/allocations');
        setAllocations(res.data.data);
      } else {
        const res = await api.get('/allocations/transfers');
        setTransfers(res.data.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAssets = async () => {
    const res = await api.get('/assets', { params: { status: 'Available' } });
    setAssets(res.data.data);
  };

  const fetchEmployees = async () => {
    const res = await api.get('/auth/employees', { params: { status: 'Active' } });
    setEmployees(res.data.data);
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/allocations', form);
      setModalOpen(false); fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to allocate'); }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/allocations/${selectedAllocation.allocation_id}/return`, form);
      setReturnModal(false); fetchData();
    } catch (err) { console.error(err); }
  };

  const handleTransferAction = async (transferId, action) => {
    try {
      await api.put(`/allocations/transfers/${transferId}/approve`, { action });
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Allocation</h1>
          <p className="text-muted-foreground mt-1">Manage asset assignments and transfers</p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg bg-muted p-1">
            <button onClick={() => setActiveView('allocations')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'allocations' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Allocations</button>
            <button onClick={() => setActiveView('transfers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'transfers' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Transfers</button>
          </div>
          {activeView === 'allocations' && (
            <button onClick={() => { setForm({}); setModalOpen(true); }} className="btn-primary"><ArrowRightLeft className="mr-2 h-4 w-4" /> Allocate</button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12">Loading...</div> : activeView === 'allocations' ? (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Asset</th><th>Allocated To</th><th>Date</th><th>Expected Return</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {allocations.map(all => (
                    <tr key={all.allocation_id}>
                      <td><p className="font-medium">{all.asset_name}</p><p className="text-xs text-muted-foreground">{all.asset_tag}</p></td>
                      <td>{all.allocated_to_name || all.allocated_to_department || '—'}</td>
                      <td>{new Date(all.allocation_date).toLocaleDateString()}</td>
                      <td>{all.expected_return_date ? new Date(all.expected_return_date).toLocaleDateString() : '—'}</td>
                      <td><Badge variant={all.status === 'Active' ? 'success' : all.status === 'Overdue' ? 'destructive' : 'secondary'}>{all.status}</Badge></td>
                      <td>{all.status === 'Active' && (
                        <button onClick={() => { setSelectedAllocation(all); setReturnModal(true); }} className="btn-ghost p-1" title="Return Asset"><RotateCcw className="h-4 w-4" /></button>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Asset</th><th>From</th><th>To</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.transfer_id}>
                      <td><p className="font-medium">{t.asset_name}</p><p className="text-xs text-muted-foreground">{t.asset_tag}</p></td>
                      <td>{t.from_employee_name || '—'}</td>
                      <td>{t.to_employee_name || t.to_department_name || '—'}</td>
                      <td><Badge variant={t.status === 'Requested' ? 'warning' : t.status === 'Approved' ? 'success' : 'secondary'}>{t.status}</Badge></td>
                      <td>{t.status === 'Requested' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleTransferAction(t.transfer_id, 'approve')} className="btn-primary p-1"><Check className="h-4 w-4" /></button>
                          <button onClick={() => handleTransferAction(t.transfer_id, 'reject')} className="btn-destructive p-1"><X className="h-4 w-4" /></button>
                        </div>
                      )}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Allocate Asset">
        <form onSubmit={handleAllocate} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Asset *</label>
            <select className="input" value={form.assetId || ''} onChange={e => setForm({...form, assetId: e.target.value})} required>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a.asset_id} value={a.asset_id}>{a.asset_tag} - {a.asset_name}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Allocate To Employee</label>
            <select className="input" value={form.allocatedToEmployeeId || ''} onChange={e => setForm({...form, allocatedToEmployeeId: e.target.value})}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.first_name} {e.last_name}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Expected Return Date</label>
            <input className="input" type="date" value={form.expectedReturnDate || ''} onChange={e => setForm({...form, expectedReturnDate: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Allocate</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={returnModal} onClose={() => setReturnModal(false)} title="Return Asset">
        <form onSubmit={handleReturn} className="space-y-4">
          {selectedAllocation && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-medium">{selectedAllocation.asset_name}</p>
              <p className="text-sm text-muted-foreground">{selectedAllocation.asset_tag}</p>
            </div>
          )}
          <div><label className="text-sm font-medium mb-1.5 block">Return Condition</label>
            <select className="input" value={form.returnCondition || 'Good'} onChange={e => setForm({...form, returnCondition: e.target.value})}>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Return Notes</label>
            <textarea className="input min-h-[80px]" value={form.returnNotes || ''} onChange={e => setForm({...form, returnNotes: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setReturnModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Return Asset</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssetAllocation;
