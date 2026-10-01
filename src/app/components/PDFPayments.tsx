import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { PaymentItem } from '../services/paymentService';

export interface PaymentReportEntry {
  date: string;
  customer: string;
  invoiceNo?: string;
  method: string;
  reference?: string;
  amount: number;
}

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f7f7f7';
const BORDER = '#000000';

function numberToWords(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = inWords(integerPart).trim() + ' Rupees';
  if (decimalPart > 0) {
    words += ' and ' + inWords(decimalPart).trim() + ' Paisa';
  }
  return words + ' Only';
}

const styles = StyleSheet.create({
  // Bulk Payments Log styles
  page: {
    paddingTop: 24,
    paddingBottom: 44,
    paddingHorizontal: 22,
    fontFamily: 'Helvetica',
    fontSize: 10,
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
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 4,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: {
    padding: 4,
    fontSize: 9,
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

  // Professional Single Payment Receipt Styles
  receiptPage: {
    padding: 35,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    marginBottom: 16,
  },
  receiptCompanyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  receiptCompanySub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
    marginBottom: 4,
  },
  receiptContactText: {
    fontSize: 8.5,
    color: '#64748b',
    lineHeight: 1.3,
  },
  receiptBadgeSection: {
    alignItems: 'flex-end',
  },
  receiptTitleBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  receiptMetaRow: {
    fontSize: 9,
    color: '#334155',
    marginBottom: 2,
  },
  receiptMetaBold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },

  // Details Table
  detailsTable: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  detailsTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 24,
    alignItems: 'center',
  },
  detailsTableRowLast: {
    flexDirection: 'row',
    minHeight: 24,
    alignItems: 'center',
  },
  detailsLabelCell: {
    width: '28%',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  detailsValueCell: {
    width: '72%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  detailsValueCellRegular: {
    width: '72%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 9.5,
    color: '#334155',
  },

  // Amount Card
  amountContainer: {
    borderWidth: 1.5,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#047857',
  },
  amountWordsRow: {
    borderTopWidth: 1,
    borderTopColor: '#a7f3d0',
    paddingTop: 6,
    marginTop: 4,
  },
  amountWordsText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#065f46',
    fontStyle: 'italic',
  },

  // Remarks Section
  remarksBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  remarksLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remarksValue: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
  },

  // Signatures
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 45,
    paddingHorizontal: 10,
  },
  signatureBox: {
    width: '28%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    width: '100%',
    marginBottom: 6,
  },
  signatureText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center',
  },

  // Footer
  footerText: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    fontSize: 7.5,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
});

const COL = {
  date: '15%',
  customer: '25%',
  invoice: '15%',
  method: '15%',
  reference: '15%',
  amount: '15%',
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

export const PDFPayments = ({
  data,
  org,
  fromDate,
  toDate,
}: {
  data: PaymentReportEntry[];
  org: Organization | null;
  fromDate: string;
  toDate: string;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = new Date().toLocaleString('en-PK');
  const totalAmount = data.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Document title="Payments Log">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.brandingBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Payments Log</Text>
            <Text style={styles.metaText}>
              Period: {fromDate} — {toDate}
            </Text>
            <Text style={styles.metaText}>Print Date: {printDate}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width={COL.date} bold>Date</Cell>
            <Cell width={COL.customer} variant="left" bold>Customer</Cell>
            <Cell width={COL.invoice} bold>Invoice No</Cell>
            <Cell width={COL.method} bold>Method</Cell>
            <Cell width={COL.reference} bold>Reference</Cell>
            <Cell width={COL.amount} variant="right" last bold>Amount</Cell>
          </View>

          {data.map((row, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
              wrap={false}
            >
              <Cell width={COL.date}>{row.date}</Cell>
              <Cell width={COL.customer} variant="left">{row.customer}</Cell>
              <Cell width={COL.invoice}>{row.invoiceNo || '—'}</Cell>
              <Cell width={COL.method}>{row.method}</Cell>
              <Cell width={COL.reference}>{row.reference || '—'}</Cell>
              <Cell width={COL.amount} variant="right" last bold>{row.amount.toLocaleString()}</Cell>
            </View>
          ))}

          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <Cell width={COL.date} bold></Cell>
            <Cell width={COL.customer} variant="left" bold>TOTAL PAYMENTS</Cell>
            <Cell width={COL.invoice} bold></Cell>
            <Cell width={COL.method} bold></Cell>
            <Cell width={COL.reference} bold></Cell>
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

export const PDFPaymentReceipt = ({
  payment,
  org,
}: {
  payment: PaymentItem;
  org?: Organization | null;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const customerName = payment.customer?.name || payment.delivery_order?.customer?.name || 'Customer';
  const receiptNo = `PAY-${String(payment.id).padStart(5, '0')}`;
  const formattedDate = payment.payment_date 
    ? new Date(payment.payment_date).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : '';
  const printDate = new Date().toLocaleString('en-PK');
  const amountNum = typeof payment.amount === 'number' ? payment.amount : parseFloat(String(payment.amount)) || 0;
  const amountInWords = numberToWords(amountNum);
  const doOrderNo = payment.delivery_order?.order_no ? `DO #${payment.delivery_order.order_no}` : null;

  return (
    <Document title={`Payment_Receipt_${receiptNo}`}>
      <Page size="A4" orientation="portrait" style={styles.receiptPage}>
        {/* Header Branding */}
        <View style={styles.receiptHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.receiptCompanyTitle}>{companyName}</Text>
            <Text style={styles.receiptCompanySub}>TEXTILE PROCESSING & DYEING MILLS</Text>
            {org?.address ? <Text style={styles.receiptContactText}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.receiptContactText}>Tel: {org.phone}</Text> : null}
          </View>

          <View style={styles.receiptBadgeSection}>
            <Text style={styles.receiptTitleBadge}>PAYMENT RECEIPT</Text>
            <Text style={styles.receiptMetaRow}>
              Voucher No: <Text style={styles.receiptMetaBold}>{receiptNo}</Text>
            </Text>
            <Text style={styles.receiptMetaRow}>
              Date: <Text style={styles.receiptMetaBold}>{formattedDate}</Text>
            </Text>
          </View>
        </View>

        {/* Structured Details Table */}
        <View style={styles.detailsTable}>
          <View style={styles.detailsTableRow}>
            <Text style={styles.detailsLabelCell}>Received From</Text>
            <Text style={styles.detailsValueCell}>{customerName}</Text>
          </View>

          <View style={styles.detailsTableRow}>
            <Text style={styles.detailsLabelCell}>Payment Method</Text>
            <Text style={styles.detailsValueCellRegular}>{(payment.mode || 'CASH').toUpperCase()}</Text>
          </View>

          {payment.reference_no ? (
            <View style={styles.detailsTableRow}>
              <Text style={styles.detailsLabelCell}>Reference / Cheque #</Text>
              <Text style={styles.detailsValueCellRegular}>{payment.reference_no}</Text>
            </View>
          ) : null}

          {doOrderNo ? (
            <View style={styles.detailsTableRowLast}>
              <Text style={styles.detailsLabelCell}>Delivery Order #</Text>
              <Text style={styles.detailsValueCell}>{doOrderNo}</Text>
            </View>
          ) : null}
        </View>

        {/* Amount Box */}
        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount Received</Text>
            <Text style={styles.amountValue}>
              PKR {amountNum.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.amountWordsRow}>
            <Text style={styles.amountWordsText}>
              In Words: {amountInWords}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        {payment.notes ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Remarks / Internal Notes</Text>
            <Text style={styles.remarksValue}>{payment.notes}</Text>
          </View>
        ) : null}

        {/* Signatures */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Received By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Thank you for your business! This is an official computer-generated receipt issued by Shan Dyeing ERP. (Printed on {printDate})
        </Text>
      </Page>
    </Document>
  );
};
