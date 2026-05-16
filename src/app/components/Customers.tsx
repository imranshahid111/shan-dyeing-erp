import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Edit, Trash2, Search, Eye, Phone, Users } from 'lucide-react';
import { customerService } from '../services/customerService';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  outstanding: number;
  customerCode: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const response = await customerService.getCustomers(searchTerm, 1, 60);
        const mapped = response.data.map((item) => ({
          id: String(item.id),
          name: item.name,
          mobile: item.phone,
          address: item.city || '—',
          outstanding: Number(item.outstanding_amount || 0),
          customerCode: item.customer_code,
        }));
        setCustomers(mapped);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, [searchTerm]);

  const filteredCustomers = useMemo(() => customers, [customers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customers</h2>
          <p>{customers.length} registered customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="card-header">
          <div className="search-bar" style={{ maxWidth: '22rem' }}>
            <Search className="search-bar-icon" size={16} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="badge badge-gray">{filteredCustomers.length} Records</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={26} /></div>
              <p className="empty-state-title">No Customers Found</p>
              <p className="empty-state-desc">Add your first customer to start managing accounts and invoices.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/customers/new')}>
                <Plus size={15} /> Add Customer
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Company Name</th>
                  <th>Contact</th>
                  <th>City / Address</th>
                  <th style={{ textAlign: 'right' }}>Outstanding</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr
                    key={customer.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/view/${customer.id}`)}
                  >
                    <td>
                      <span className="badge badge-gray">{customer.customerCode}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                        {customer.name}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gray-600)', fontSize: '0.8125rem' }}>
                        <Phone size={13} style={{ color: 'var(--gray-400)' }} />
                        {customer.mobile}
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', maxWidth: '180px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {customer.address}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 700,
                        color: customer.outstanding > 0 ? '#b91c1c' : 'var(--success)',
                        fontSize: '0.875rem',
                      }}>
                        Rs {customer.outstanding.toLocaleString()}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <button
                          className="icon-btn primary"
                          title="View Ledger"
                          onClick={() => navigate(`/customers/view/${customer.id}`)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="icon-btn primary"
                          title="Edit Customer"
                          onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        >
                          <Edit size={15} />
                        </button>
                        <button className="icon-btn danger" title="Delete Customer">
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
