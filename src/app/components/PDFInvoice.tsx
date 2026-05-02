import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { DeliveryOrderItem } from '../services/deliveryOrderService';
import { Organization } from '../services/organizationService';

// Standard fonts
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.woff'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 20,
  },
  orgInfo: {
    width: '60%',
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  invoiceTitleArea: {
    width: '35%',
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  billTo: {
    width: '50%',
  },
  invoiceInfo: {
    width: '50%',
    textAlign: 'right',
  },
  label: {
    fontSize: 8,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontWeight: 'bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
    minHeight: 30,
  },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  summaryArea: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: '45%',
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e67e22',
  },
  remainingValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e67e22',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    fontSize: 8,
    color: '#999',
  }
});

export const PDFInvoice = ({ inv, org }: { inv: DeliveryOrderItem, org: Organization }) => {
  const totalAmount = Number(inv.total_amount);
  const paidAmount = Number(inv.paid_amount || 0);
  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{org.name}</Text>
            <Text>{org.address}</Text>
            <Text>Phone: {org.phone}</Text>
            <Text>Email: {org.email}</Text>
          </View>
          <View style={styles.invoiceTitleArea}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.value}>#{inv.order_no}</Text>
            <Text>Date: {new Date(inv.order_date).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.billTo}>
            <Text style={styles.label}>Bill To:</Text>
            <Text style={styles.value}>{inv.customer?.name}</Text>
            <Text>Customer Code: {inv.customer?.customer_code}</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.label}>Gray Lot Info:</Text>
            <Text style={styles.value}>Lot # {inv.gray_lot?.lot_no}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Lot #</Text>
            <Text style={styles.col3}>Quantity (Gz)</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Dyeing & Processing Services</Text>
            <Text style={styles.col2}>{inv.gray_lot?.lot_no}</Text>
            <Text style={styles.col3}>{inv.total_gray_gazana}</Text>
            <Text style={styles.col4}>{totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.tableRow}><Text style={styles.col1}/></View>
          <View style={styles.tableRow}><Text style={styles.col1}/></View>
        </View>

        <View style={styles.summaryArea}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL BILL AMOUNT:</Text>
              <Text style={styles.totalValue}>{org.currency} {totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL PAID AMOUNT:</Text>
              <Text style={styles.totalValue}>{org.currency} {paidAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.remainingLabel}>BALANCE DUE:</Text>
              <Text style={styles.remainingValue}>{org.currency} {dueAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer generated invoice and does not require a physical signature.
          Generated by Shan Dyeing ERP Software.
        </Text>
      </Page>
    </Document>
  );
};
