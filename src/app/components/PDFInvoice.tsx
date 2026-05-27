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
  colDesc: { width: '70%' },
  colAmt: { width: '30%', textAlign: 'right' },
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

/** Renders the inside of a single invoice page — reused by both single and multi PDF */
const InvoicePage = ({ inv, org }: { inv: DeliveryOrderItem; org: Organization }) => {
  const totalAmount = Number(inv.total_amount);
  const paidAmount  = Number(inv.paid_amount || 0);
  const dueAmount   = Math.max(totalAmount - paidAmount, 0);

  const readyMeter = Number(inv.total_ready_gazana || 0);
  const readyGaz   = readyMeter / 0.9144;

  const isRateInMeter  = inv.rate_unit !== 'yard';
  const primaryQty     = isRateInMeter ? readyMeter : readyGaz;
  const secondaryQty   = isRateInMeter ? readyGaz   : readyMeter;
  const primaryLabel   = isRateInMeter ? 'Meter'      : 'Gaz (Yard)';
  const secondaryLabel = isRateInMeter ? 'Gaz (Yard)' : 'Meter';
  const primaryShort   = isRateInMeter ? 'Mtr'  : 'Gaz';

  const processingAmount = primaryQty * Number(inv.rate || 0);

  return (
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
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>

        {/* Gazana row */}
        <View style={[styles.tableRow, { backgroundColor: '#f9f9f9' }]}>
          <Text style={[styles.colDesc, { fontWeight: 'bold', color: '#333' }]}>Gazana (Ready Qty)</Text>
          <Text style={[styles.colAmt, { fontWeight: 'bold', color: '#333' }]}>
            {readyMeter.toFixed(2)} Mtr  /  {readyGaz.toFixed(2)} Gaz
          </Text>
        </View>

        {/* Primary unit rate row */}
        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>
            {primaryLabel}:  {primaryQty.toFixed(2)} {primaryShort}  ×  Rs {inv.rate} / {primaryShort}
          </Text>
          <Text style={[styles.colAmt, { fontWeight: 'bold' }]}>
            {processingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Secondary unit reference row */}
        <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: '#ddd' }]}>
          <Text style={[styles.colDesc, { color: '#888', fontSize: 9 }]}>
            {secondaryLabel} Equivalent:  {secondaryQty.toFixed(2)} {isRateInMeter ? 'Gaz' : 'Mtr'}
          </Text>
          <Text style={styles.colAmt}></Text>
        </View>

        {Number(inv.kinar_cut_amount) > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>Kinar Cut</Text>
            <Text style={styles.colAmt}>{Number(inv.kinar_cut_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        )}
        {Number(inv.packing_amount) > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>Packing</Text>
            <Text style={styles.colAmt}>{Number(inv.packing_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        )}
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
  );
};

/** Single invoice PDF — wraps one InvoicePage in a Document */
export const PDFInvoice = ({ inv, org }: { inv: DeliveryOrderItem; org: Organization }) => (
  <Document>
    <InvoicePage inv={inv} org={org} />
  </Document>
);

/** Multi-invoice PDF — each invoice on its own separate page */
export const PDFMultiInvoice = ({ invoices, org }: { invoices: DeliveryOrderItem[]; org: Organization }) => (
  <Document>
    {invoices.map(inv => (
      <InvoicePage key={inv.id} inv={inv} org={org} />
    ))}
  </Document>
);

