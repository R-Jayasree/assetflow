import React, { useState, useEffect } from 'react';
import { Building2, Tag, Users, Plus, Pencil } from 'lucide-react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 rounded-lg bg-muted p-1">
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}>
        <tab.icon className="h-4 w-4" />{tab.label}
      </button>
    ))}
  </div>
);

const OrganizationSetup = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'departments') {
        const res = await api.get('/organization/departments');
        setDepartments(res.data.data);
      } else if (activeTab === 'categories') {
        const res = await api.get('/organization/categories');
        setCategories(res.data.data);
      } else if (activeTab === 'employees') {
        const res = await api.get('/auth/employees');
        setEmployees(res.data.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (type, item = null) => {
    setModalType(type); setEditItem(item); setForm(item || {}); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'department') {
        if (editItem) await api.put(`/organization/departments/${editItem.department_id}`, form);
        else await api.post('/organization/departments', form);
      } else if (modalType === 'category') {
        if (editItem) await api.put(`/organization/categories/${editItem.category_id}`, form);
        else await api.post('/organization/categories', form);
      } else if (modalType === 'employee') {
        await api.put(`/auth/employees/${editItem.employee_id}/role`, {
          role: form.role, departmentId: form.department_id,
        });
      }
      setModalOpen(false); fetchData();
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'employees', label: 'Employees', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Setup</h1>
        <p className="text-muted-foreground mt-1">Manage departments, categories, and employee roles</p>
      </div>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {activeTab === 'departments' && 'Departments'}
            {activeTab === 'categories' && 'Asset Categories'}
            {activeTab === 'employees' && 'Employee Directory'}
          </CardTitle>
          {activeTab !== 'employees' && (
            <button onClick={() => openModal(activeTab === 'departments' ? 'department' : 'category')} className="btn-primary">
              <Plus className="mr-2 h-4 w-4" /> Add New
            </button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {activeTab === 'departments' && <><th>Name</th><th>Code</th><th>Head</th><th>Parent</th><th>Status</th><th>Actions</th></>}
                    {activeTab === 'categories' && <><th>Name</th><th>Code</th><th>Description</th><th>Status</th><th>Actions</th></>}
                    {activeTab === 'employees' && <><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></>}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'departments' && departments.map(d => (
                    <tr key={d.department_id}>
                      <td className="font-medium">{d.department_name}</td>
                      <td>{d.department_code}</td>
                      <td>{d.department_head_name || '—'}</td>
                      <td>{d.parent_department_name || '—'}</td>
                      <td><Badge variant={d.status === 'Active' ? 'success' : 'secondary'}>{d.status}</Badge></td>
                      <td><button onClick={() => openModal('department', d)} className="btn-ghost p-1"><Pencil className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                  {activeTab === 'categories' && categories.map(c => (
                    <tr key={c.category_id}>
                      <td className="font-medium">{c.category_name}</td>
                      <td>{c.category_code}</td>
                      <td>{c.description || '—'}</td>
                      <td><Badge variant={c.status === 'Active' ? 'success' : 'secondary'}>{c.status}</Badge></td>
                      <td><button onClick={() => openModal('category', c)} className="btn-ghost p-1"><Pencil className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                  {activeTab === 'employees' && employees.map(e => (
                    <tr key={e.employee_id}>
                      <td className="font-medium">{e.first_name} {e.last_name}</td>
                      <td>{e.email}</td>
                      <td>{e.department_name || '—'}</td>
                      <td><Badge variant={e.role === 'Admin' ? 'destructive' : e.role === 'Asset_Manager' ? 'warning' : 'default'}>{e.role.replace('_', ' ')}</Badge></td>
                      <td><Badge variant={e.status === 'Active' ? 'success' : 'secondary'}>{e.status}</Badge></td>
                      <td><button onClick={() => openModal('employee', e)} className="btn-ghost p-1"><Pencil className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `Edit ${modalType}` : `Add ${modalType}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalType === 'department' && (
            <>
              <div><label className="text-sm font-medium mb-1.5 block">Department Name</label>
                <input className="input" value={form.departmentName || ''} onChange={e => setForm({...form, departmentName: e.target.value})} required /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Department Code</label>
                <input className="input" value={form.departmentCode || ''} onChange={e => setForm({...form, departmentCode: e.target.value})} required /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea className="input min-h-[80px]" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Status</label>
                <select className="input" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select></div>
            </>
          )}
          {modalType === 'category' && (
            <>
              <div><label className="text-sm font-medium mb-1.5 block">Category Name</label>
                <input className="input" value={form.categoryName || ''} onChange={e => setForm({...form, categoryName: e.target.value})} required /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Category Code</label>
                <input className="input" value={form.categoryCode || ''} onChange={e => setForm({...form, categoryCode: e.target.value})} required /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea className="input min-h-[80px]" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Status</label>
                <select className="input" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option>
                </select></div>
            </>
          )}
          {modalType === 'employee' && (
            <>
              <div><label className="text-sm font-medium mb-1.5 block">Role</label>
                <select className="input" value={form.role || 'Employee'} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Employee">Employee</option>
                  <option value="Department_Head">Department Head</option>
                  <option value="Asset_Manager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Department</label>
                <select className="input" value={form.department_id || ''} onChange={e => setForm({...form, department_id: e.target.value})}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select></div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationSetup;
