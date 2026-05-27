import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { User, Mail, Lock, Shield, Save, X, Settings } from 'lucide-react';
import { userService } from '../services/userService';
import { toast } from 'sonner';

export default function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = !!id && location.pathname.includes('/edit/');
  const isView = !!id && location.pathname.includes('/view/');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    privileges: {
      can_view_dashboard: true,
      can_view_gray_lots: false,
      can_view_delivery_orders: false,
      can_view_billing: false,
      can_view_payments: false,
      can_view_customers: false,
      can_view_qualities: false,
      can_view_gate_pass: false,
      can_view_staff: false,
      can_view_activity_logs: false,
      can_view_reports: false,
      can_delete: false,
    }
  });

  useEffect(() => {
    if (id) {
      const loadUser = async () => {
        try {
          setLoading(true);
          const user = await userService.getUser(id);
          setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: '', // blank by default on edit
            role: user.role || 'staff',
            privileges: {
              can_view_dashboard: (user.privilege || user.Privilege)?.can_view_dashboard ?? true,
              can_view_gray_lots: (user.privilege || user.Privilege)?.can_view_gray_lots ?? false,
              can_view_delivery_orders: (user.privilege || user.Privilege)?.can_view_delivery_orders ?? false,
              can_view_billing: (user.privilege || user.Privilege)?.can_view_billing ?? false,
              can_view_payments: (user.privilege || user.Privilege)?.can_view_payments ?? false,
              can_view_customers: (user.privilege || user.Privilege)?.can_view_customers ?? false,
              can_view_qualities: (user.privilege || user.Privilege)?.can_view_qualities ?? false,
              can_view_gate_pass: (user.privilege || user.Privilege)?.can_view_gate_pass ?? false,
              can_view_staff: (user.privilege || user.Privilege)?.can_view_staff ?? false,
              can_view_activity_logs: (user.privilege || user.Privilege)?.can_view_activity_logs ?? false,
              can_view_reports: (user.privilege || user.Privilege)?.can_view_reports ?? false,
              can_delete: (user.privilege || user.Privilege)?.can_delete ?? false,
            }
          });
        } catch (err) {
          console.error("Failed to load staff details", err);
          setErrorMsg("Failed to load staff details.");
        } finally {
          setLoading(false);
        }
      };
      loadUser();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;

    if (!formData.full_name || !formData.email || (!isEdit && !formData.password)) {
      setErrorMsg('All fields are required.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (isEdit && id) {
        const payload: any = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          privileges: formData.privileges
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await userService.updateUser(id, payload);
        toast.success('Staff member updated successfully!');
      } else {
        await userService.createUser(formData);
        toast.success('Staff member registered successfully!');
      }
      navigate('/staff');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save staff member. Check backend connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePrivilege = (key: string, checked: boolean) => {
    if (isView) return;
    setFormData(prev => ({
      ...prev,
      privileges: {
        ...prev.privileges,
        [key]: checked
      }
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <div className="animate-spin text-blue-600 font-bold" style={{ fontSize: '1.5rem' }}>⚙️</div>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', fontWeight: 600 }}>Loading staff profile details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
            {isView ? 'Staff Member Details' : isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem', marginBottom: 0 }}>
            {isView 
              ? 'View staff credentials and module-specific usage permissions.' 
              : isEdit 
                ? 'Update staff credentials and module-specific usage permissions.' 
                : 'Create system credentials and allocate module-specific usage permissions.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/staff')}
          style={{
            padding: '0.625rem',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: '12px',
            color: 'var(--gray-500)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--gray-50)';
            e.currentTarget.style.color = 'var(--gray-800)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = 'var(--gray-500)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main card */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Basic Info Section */}
        <div>
          <h3 style={{
            fontSize: '0.8125rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--brand-600)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid var(--gray-100)',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
            marginTop: 0
          }}>
            <User size={16} /> Basic Credentials
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Full Name</label>
              <div className="input-wrapper">
                <div className="input-icon-left"><User size={16} /></div>
                <input
                  type="text"
                  required
                  disabled={isView}
                  placeholder="Enter employee full name"
                  className="input-field input-with-icon-left"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Email Address</label>
              <div className="input-wrapper">
                <div className="input-icon-left"><Mail size={16} /></div>
                <input
                  type="email"
                  required
                  disabled={isView}
                  placeholder="email@shandyeing.com"
                  className="input-field input-with-icon-left"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {!isView && (
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                  {isEdit ? 'Password (Leave blank to keep current)' : 'Account Password'}
                </label>
                <div className="input-wrapper">
                  <div className="input-icon-left"><Lock size={16} /></div>
                  <input
                    type="password"
                    required={!isEdit}
                    placeholder={isEdit ? "••••••••" : "Set secure password"}
                    className="input-field input-with-icon-left"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>System Access Role</label>
              <div className="input-wrapper">
                <div className="input-icon-left"><Shield size={16} /></div>
                <select
                  className="input-field input-with-icon-left"
                  style={{ appearance: 'none', cursor: isView ? 'default' : 'pointer' }}
                  disabled={isView}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="staff">Staff / Operator (Standard Permissions)</option>
                  <option value="manager">Manager (Intermediate Permissions)</option>
                  <option value="admin">Administrator (Unlimited Access)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Privileges Configuration */}
        <div>
          <h3 style={{
            fontSize: '0.8125rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--brand-600)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid var(--gray-100)',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
            marginTop: 0
          }}>
            <Settings size={16} /> Privilege Assignment & Module Access
          </h3>

          {formData.role === 'admin' ? (
            <div style={{
              background: '#eff6ff',
              border: '1.5px dashed var(--brand-300)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--brand-700)',
            }}>
              <Shield size={20} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>Full Administration Authority Enabled</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.85 }}>
                  Administrators bypass module locks and can view/delete any transaction records.
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              border: '1.5px solid var(--gray-150)',
              borderRadius: '16px',
              padding: '1.5rem',
              background: 'var(--gray-25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { key: 'can_view_dashboard', label: 'Access Overview Dashboard' },
                  { key: 'can_view_gray_lots', label: 'Access Gray Lot Inventory' },
                  { key: 'can_view_delivery_orders', label: 'Access Delivery Orders' },
                  { key: 'can_view_billing', label: 'Access Billing & Invoices' },
                  { key: 'can_view_payments', label: 'Access Payments & Ledgers' },
                  { key: 'can_view_customers', label: 'Access Customer Accounts' },
                  { key: 'can_view_qualities', label: 'Access Fabric Qualities' },
                  { key: 'can_view_gate_pass', label: 'Access Gate Passes' },
                  { key: 'can_view_staff', label: 'Access Staff Management' },
                  { key: 'can_view_activity_logs', label: 'Access Activity Logs' },
                  { key: 'can_view_reports', label: 'Access Reports' },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      cursor: isView ? 'default' : 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--gray-700)',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                    }}
                    className={isView ? "" : "hover-bg-gray-50"}
                  >
                    <input
                      type="checkbox"
                      disabled={isView}
                      style={{ cursor: isView ? 'default' : 'pointer', width: '15px', height: '15px' }}
                      checked={(formData.privileges as any)[item.key]}
                      onChange={e => togglePrivilege(item.key, e.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              {/* Danger Zone Privilege */}
              <div style={{
                borderTop: '1.5px solid var(--gray-150)',
                paddingTop: '1rem',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}>
                <input
                  type="checkbox"
                  disabled={isView}
                  id="chk-can-delete"
                  style={{ cursor: isView ? 'default' : 'pointer', width: '16px', height: '16px', marginTop: '3px' }}
                  checked={formData.privileges.can_delete}
                  onChange={e => togglePrivilege('can_delete', e.target.checked)}
                />
                <label htmlFor="chk-can-delete" style={{ cursor: isView ? 'default' : 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--error)' }}>
                    Allow Record Deletion Capabilities
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.125rem' }}>
                    Authorizes this member to permanently delete lots, delivery orders, gate passes, or invoices.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '12px',
            padding: '0.875rem 1.125rem',
            color: 'var(--error)',
            fontSize: '0.8125rem',
            fontWeight: 600,
          }}>
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: '0.75rem', borderTop: '1px solid var(--gray-100)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/staff')}
            style={{ minWidth: '7.5rem' }}
          >
            {isView ? 'Back' : 'Cancel'}
          </button>
          {!isView && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '10rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Save size={16} />
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Member'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
