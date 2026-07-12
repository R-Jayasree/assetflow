import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Eye, QrCode } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const AssetDirectory = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', categoryId: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { fetchAssets(); fetchCategories(); fetchDepartments(); }, []);

  const fetchAssets = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      const res = await api.get('/assets', { params });
      setAssets(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const res = await api.get('/organization/categories');
    setCategories(res.data.data);
  };

  const fetchDepartments = async () => {
    const res = await api.get('/organization/departments');
    setDepartments(res.data.data);
  };

  const handleSearch = () => { fetchAssets(); };

  const openDetail = async (asset) => {
    try {
      const res = await api.get(`/assets/${asset.asset_id}`);
      setSelectedAsset(res.data.data);
      setDetailModal(true);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assets', form);
      setModalOpen(false); fetchAssets();
    } catch (err) { console.error(err); }
  };

  const statusColors = {
    Available: 'success', Allocated: 'default', Reserved: 'secondary',
    Under_Maintenance: 'warning', Lost: 'destructive', Retired: 'secondary', Disposed: 'secondary',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Directory</h1>
          <p className="text-muted-foreground mt-1">Register and track all assets</p>
        </div>
        <button onClick={() => { setForm({}); setModalOpen(true); }} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> Register Asset
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="input pl-10" placeholder="Search by tag, name, or serial..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <select className="input w-full sm:w-40" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Under_Maintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
        </select>
        <select className="input w-full sm:w-40" value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value})}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
        </select>
        <button onClick={handleSearch} className="btn-outline"><Filter className="mr-2 h-4 w-4" /> Filter</button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (
            <div className="table-container border-0">
              <table className="table">
                <thead><tr><th>Asset Tag</th><th>Name</th><th>Category</th><th>Status</th><th>Condition</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.asset_id}>
                      <td><div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{asset.asset_tag}</span></div></td>
                      <td className="font-medium">{asset.asset_name}</td>
                      <td>{asset.category_name}</td>
                      <td><Badge variant={statusColors[asset.status] || 'default'}>{asset.status.replace('_', ' ')}</Badge></td>
                      <td>{asset.current_condition}</td>
                      <td>{asset.location || '—'}</td>
                      <td><button onClick={() => openDetail(asset)} className="btn-ghost p-1"><Eye className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register New Asset">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Asset Name *</label>
            <input className="input" value={form.assetName || ''} onChange={e => setForm({...form, assetName: e.target.value})} required /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Category *</label>
            <select className="input" value={form.categoryId || ''} onChange={e => setForm({...form, categoryId: e.target.value})} required>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Serial Number</label>
              <input className="input" value={form.serialNumber || ''} onChange={e => setForm({...form, serialNumber: e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Model</label>
              <input className="input" value={form.model || ''} onChange={e => setForm({...form, model: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Manufacturer</label>
            <input className="input" value={form.manufacturer || ''} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Acquisition Date</label>
              <input className="input" type="date" value={form.acquisitionDate || ''} onChange={e => setForm({...form, acquisitionDate: e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Acquisition Cost</label>
              <input className="input" type="number" step="0.01" value={form.acquisitionCost || ''} onChange={e => setForm({...form, acquisitionCost: e.target.value})} /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Location</label>
            <input className="input" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Department</label>
            <select className="input" value={form.departmentId || ''} onChange={e => setForm({...form, departmentId: e.target.value})}>
              <option value="">None</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isBookable" checked={form.isBookable || false}
              onChange={e => setForm({...form, isBookable: e.target.checked})} className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="isBookable" className="text-sm">Available for booking (shared resource)</label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Register Asset</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Asset Details" className="max-w-2xl">
        {selectedAsset && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Asset Tag</p>
                <p className="font-mono font-medium text-lg">{selectedAsset.asset_tag}</p></div>
              <div><p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusColors[selectedAsset.status] || 'default'} className="mt-1">{selectedAsset.status.replace('_', ' ')}</Badge></div>
            </div>
            <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{selectedAsset.asset_name}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{selectedAsset.category_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Condition</p><p className="font-medium">{selectedAsset.current_condition}</p></div>
            </div>
            {selectedAsset.serial_number && <div><p className="text-sm text-muted-foreground">Serial Number</p><p className="font-medium">{selectedAsset.serial_number}</p></div>}
            {selectedAsset.location && <div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium">{selectedAsset.location}</p></div>}
            {selectedAsset.allocationHistory?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Allocation History</h4>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>To</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {selectedAsset.allocationHistory.map(h => (
                        <tr key={h.allocation_id}>
                          <td>{h.allocated_to_name || 'Department'}</td>
                          <td>{new Date(h.allocation_date).toLocaleDateString()}</td>
                          <td><Badge variant={h.status === 'Active' ? 'success' : 'secondary'}>{h.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {selectedAsset.maintenanceHistory?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Maintenance History</h4>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
                    <tbody>
                      {selectedAsset.maintenanceHistory.map(h => (
                        <tr key={h.request_id}>
                          <td>{h.title}</td>
                          <td><Badge variant={h.priority === 'Critical' ? 'destructive' : h.priority === 'High' ? 'warning' : 'default'}>{h.priority}</Badge></td>
                          <td>{h.status.replace('_', ' ')}</td>
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

export default AssetDirectory;
