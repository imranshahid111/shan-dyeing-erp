import { useEffect, useState } from 'react';
import { Plus, Trash2, Mail, User as UserIcon, Lock, X, Shield, Users } from 'lucide-react';
import { userService, UserItem } from '../services/userService';

export default function Staff() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
  });

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.createUser(formData);
      setShowModal(false);
      setFormData({ full_name: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (error) {
      alert('Failed to create staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setShowModal(true)}>
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
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
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

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '26rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Staff Member</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Full Name */}
                <div>
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <div className="input-icon-left"><UserIcon size={16} /></div>
                    <input
                      type="text"
                      required
                      className="input-field input-with-icon-left"
                      placeholder="Enter full name"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <div className="input-icon-left"><Mail size={16} /></div>
                    <input
                      type="email"
                      required
                      className="input-field input-with-icon-left"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="form-label">Create Password</label>
                  <div className="input-wrapper">
                    <div className="input-icon-left"><Lock size={16} /></div>
                    <input
                      type="password"
                      required
                      className="input-field input-with-icon-left"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="form-label">Assign Role</label>
                  <div className="input-wrapper">
                    <div className="input-icon-left"><Shield size={16} /></div>
                    <select
                      className="input-field input-with-icon-left"
                      style={{ appearance: 'none', cursor: 'pointer' }}
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="staff">Staff / Operator</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
