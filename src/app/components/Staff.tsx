import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2, Users, Eye, Pencil } from 'lucide-react';
import { userService, UserItem } from '../services/userService';
import { toast } from 'sonner';

export default function Staff() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Staff Management</h2>
          <p>Manage team members and access roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/staff/new')}>
          <Plus size={16} />
          Add Staff Member
        </button>
      </div>

      {/* Card */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading staff...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={26} /></div>
              <p className="empty-state-title">No Staff Members</p>
              <p className="empty-state-desc">Add your first staff member to manage system access.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/staff/new')}>
                <Plus size={15} /> Add Staff Member
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Privileges</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '2.25rem', height: '2.25rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, var(--brand-500), var(--accent-500))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8125rem', fontWeight: 700, color: 'white',
                          flexShrink: 0,
                        }}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{user.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{user.email}</td>
                    <td>
                      {user.role === 'admin' ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-600)' }}>Full Access (Admin)</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '22rem' }}>
                          {(user as any).privilege?.can_view_dashboard && <span className="badge badge-blue" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Dashboard</span>}
                          {(user as any).privilege?.can_view_gray_lots && <span className="badge badge-blue" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Lots</span>}
                          {(user as any).privilege?.can_view_delivery_orders && <span className="badge badge-green" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Orders</span>}
                          {(user as any).privilege?.can_view_billing && <span className="badge badge-purple" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Billing</span>}
                          {(user as any).privilege?.can_view_payments && <span className="badge badge-blue" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Payments</span>}
                          {(user as any).privilege?.can_view_customers && <span className="badge badge-orange" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Customers</span>}
                          {(user as any).privilege?.can_view_gate_pass && <span className="badge badge-green" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>Gate Pass</span>}
                          {(user as any).privilege?.can_delete ? (
                            <span className="badge" style={{ fontSize: '0.625rem', padding: '1px 5px', background: '#fee2e2', color: 'var(--error)', fontWeight: 700 }}>Can Delete</span>
                          ) : (
                            <span className="badge" style={{ fontSize: '0.625rem', padding: '1px 5px', background: 'var(--gray-100)', color: 'var(--gray-400)' }}>View Only</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge badge-green">
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                        Active
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          className="icon-btn"
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: 'none',
                            padding: '0.4rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                          title="View Staff Details"
                          onClick={() => navigate(`/staff/view/${user.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{
                            background: '#fffbeb',
                            color: '#d97706',
                            border: 'none',
                            padding: '0.4rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fffbeb'}
                          title="Edit Staff Member"
                          onClick={() => navigate(`/staff/edit/${user.id}`)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Remove Staff Member"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
