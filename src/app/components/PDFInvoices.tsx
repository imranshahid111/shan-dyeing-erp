import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { InvoiceReportEntry } from '../services/dashboardService';

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f7f7f7';
const BORDER = '#000000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 44,
    paddingHorizontal: 22,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#000',
  },
  brandingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: GRAY_HEADER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  companyDetail: { fontSize: 9, color: '#333', marginBottom: 1 },
  titleBlock: { alignItems: 'flex-end' },
  reportTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaText: { fontSize: 9, color: '#444', marginTop: 2 },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 18,
  },
  tableHeader: {
    backgroundColor: GRAY_HEADER,
    fontWeight: 'bold',
  },
  cell: {
    padding: 4,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 4,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 4,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: {
    padding: 4,
    fontSize: 8.5,
    textAlign: 'right',
  },
  rowAlt: { backgroundColor: GRAY_ALT },
  pageNumber: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

const COL = {
  date: '10%',
  invoice: '12%',
  customer: '22%',
  lot: '10%',
  qty: '12%',
  unit: '8%',
  rate: '10%',
  amount: '16%',
};

const Cell = ({
  children,
  width,
  variant = 'center',
  last = false,
  bold = false,
}: {
  children: string;
  width: string;
  variant?: 'center' | 'left' | 'right';
  last?: boolean;
  bold?: boolean;
}) => {
  const base =
    variant === 'left' ? styles.cellLeft : variant === 'right' ? styles.cellRight : styles.cell;
  return (
    <Text style={[last ? styles.cellLast : base, { width }, bold ? { fontWeight: 'bold' } : {}]}>
      {children}
    </Text>
  );
};

export const PDFInvoices = ({
  data,
  org,
  fromDate,
  toDate,
}: {
  data: InvoiceReportEntry[];
  org: Organization;
  fromDate: string;
  toDate: string;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = new Date().toLocaleString('en-PK');
  const totalAmount = data.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Document title="Invoices Log">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.brandingBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Invoices Log</Text>
            <Text style={styles.metaText}>
              Period: {fromDate} — {toDate}
            </Text>
            <Text style={styles.metaText}>Print Date: {printDate}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width={COL.date} bold>Date</Cell>
            <Cell width={COL.invoice} bold>Invoice No</Cell>
            <Cell width={COL.customer} variant="left" bold>Customer</Cell>
            <Cell width={COL.lot} bold>Lot No</Cell>
            <Cell width={COL.qty} variant="right" bold>Ready Qty</Cell>
            <Cell width={COL.unit} bold>Unit</Cell>
            <Cell width={COL.rate} variant="right" bold>Rate</Cell>
            <Cell width={COL.amount} variant="right" last bold>Amount</Cell>
          </View>

          {data.map((row, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
              wrap={false}
            >
              <Cell width={COL.date}>{row.date}</Cell>
              <Cell width={COL.invoice}>{row.invoiceNo}</Cell>
              <Cell width={COL.customer} variant="left">{row.customer}</Cell>
              <Cell width={COL.lot}>{row.lotNo}</Cell>
              <Cell width={COL.qty} variant="right">{row.readyStock.toLocaleString()}</Cell>
              <Cell width={COL.unit}>{row.unit}</Cell>
              <Cell width={COL.rate} variant="right">{row.rate.toLocaleString()}</Cell>
              <Cell width={COL.amount} variant="right" last bold>{row.amount.toLocaleString()}</Cell>
            </View>
          ))}

          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <Cell width={COL.date} bold></Cell>
            <Cell width={COL.invoice} bold></Cell>
            <Cell width={COL.customer} variant="left" bold>TOTAL BILLED</Cell>
            <Cell width={COL.lot} bold></Cell>
            <Cell width={COL.qty} variant="right" bold></Cell>
            <Cell width={COL.unit} bold></Cell>
            <Cell width={COL.rate} variant="right" bold></Cell>
            <Cell width={COL.amount} variant="right" last bold>{totalAmount.toLocaleString()}</Cell>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
