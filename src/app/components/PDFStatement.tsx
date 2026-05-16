import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { DeliveryOrderItem } from '../services/deliveryOrderService';
import { Organization } from '../services/organizationService';
import { CustomerItem } from '../services/customerService';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 15,
  },
  orgInfo: { width: '60%' },
  orgName: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  titleArea: { width: '35%', textAlign: 'right' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#999' },
  subTitle: { fontSize: 10, color: '#666', marginTop: 5 },
  
  customerBox: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerName: { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  
  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    fontWeight: 'bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
    minHeight: 25,
  },
  col1: { width: '15%' }, // Date
  col2: { width: '20%' }, // Inv No
  col3: { width: '15%', textAlign: 'right' }, // Gazana
  col4: { width: '15%', textAlign: 'right' }, // Total
  col5: { width: '15%', textAlign: 'right' }, // Paid
  col6: { width: '20%', textAlign: 'right' }, // Due
  
  summarySection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: '40%',
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  }
});

interface Props {
  invoices: DeliveryOrderItem[];
  customer: CustomerItem;
  org: Organization;
  dateRange: string;
}

export const PDFStatement = ({ invoices, customer, org, dateRange }: Props) => {
  const totalBill = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
  const totalDue = totalBill - totalPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text>{org.address}</Text>
            <Text>Phone: {org.phone}</Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.title}>STATEMENT</Text>
            <Text style={styles.subTitle}>{dateRange || 'All Records'}</Text>
          </View>
        </View>

        <View style={styles.customerBox}>
          <Text style={{ fontSize: 8, color: '#999', textTransform: 'uppercase' }}>Statement For:</Text>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text>Customer Code: {customer.customer_code}</Text>
          <Text>Phone: {customer.phone}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Date</Text>
            <Text style={styles.col2}>Invoice #</Text>
            <Text style={styles.col3}>Gazana</Text>
            <Text style={styles.col4}>Amount</Text>
            <Text style={styles.col5}>Paid</Text>
            <Text style={styles.col6}>Balance</Text>
          </View>
          
          {invoices.map((inv) => {
            const due = Number(inv.total_amount) - Number(inv.paid_amount || 0);
            return (
              <View key={inv.id} style={styles.tableRow}>
                <Text style={styles.col1}>{new Date(inv.order_date).toLocaleDateString()}</Text>
                <Text style={styles.col2}>{inv.order_no}</Text>
                <Text style={styles.col3}>{inv.total_ready_gazana}</Text>
                <Text style={styles.col4}>{Number(inv.total_amount).toLocaleString()}</Text>
                <Text style={styles.col5}>{Number(inv.paid_amount || 0).toLocaleString()}</Text>
                <Text style={styles.col6}>{due.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Total Billed:</Text>
              <Text>{org.currency} {totalBill.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Total Paid:</Text>
              <Text>{org.currency} {totalPaid.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 'bold', fontSize: 12 }}>Balance Due:</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#e67e22' }}>{org.currency} {totalDue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by Shan Dyeing ERP on {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};
