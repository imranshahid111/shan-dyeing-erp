import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { SubLedgerReport } from '../services/dashboardService';
import {
  formatAmount,
  formatBalance,
  formatBalanceShort,
  formatCurrency,
  formatReportDate,
  getPrintDateTime,
} from '../utils/subLedgerUtils';

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f7f7f7';
const BORDER = '#000000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 44,
    paddingHorizontal: 22,
    fontFamily: 'Helvetica',
    fontSize: 7,
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
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  companyDetail: { fontSize: 7, color: '#333', marginBottom: 1 },
  titleBlock: { alignItems: 'flex-end' },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaText: { fontSize: 6.5, color: '#444', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  infoLabel: { fontSize: 7, fontWeight: 'bold', color: '#333' },
  infoValue: { fontSize: 8, fontWeight: 'bold' },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 16,
  },
  tableHeader: {
    backgroundColor: GRAY_HEADER,
    fontWeight: 'bold',
  },
  cell: {
    padding: 3,
    fontSize: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 3,
    fontSize: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 3,
    fontSize: 6,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: {
    padding: 3,
    fontSize: 6,
    textAlign: 'right',
  },
  rowAlt: { backgroundColor: GRAY_ALT },
  summaryBox: {
    marginLeft: 'auto',
    width: '42%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: GRAY_ALT,
  },
  summaryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: GRAY_HEADER,
    fontWeight: 'bold',
  },
  summaryLabel: { fontSize: 7, fontWeight: 'bold' },
  summaryValue: { fontSize: 7, fontWeight: 'bold' },
  pageNumber: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
  },
});

const COL = {
  date: '8%',
  refType: '10%',
  refNo: '8%',
  desc: '14%',
  debit: '9%',
  credit: '9%',
  balance: '10%',
  rate: '6%',
  lot: '8%',
  bundle: '7%',
  meter: '11%',
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

export const PDFSubLedger = ({
  report,
  org,
}: {
  report: SubLedgerReport;
  org: Organization;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = getPrintDateTime();

  return (
    <Document title={`Sub Ledger - ${report.customer.name}`}>
      <Page size="A4" orientation="portrait" style={styles.page} wrap>
        <View style={styles.brandingBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Sub Ledger Report</Text>
            <Text style={styles.metaText}>Print Date: {printDate}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Customer / Party Name</Text>
            <Text style={styles.infoValue}>{report.customer.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Period</Text>
            <Text style={styles.infoValue}>
              {formatReportDate(report.fromDate)} — {formatReportDate(report.toDate)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width={COL.date} bold>Date</Cell>
            <Cell width={COL.refType} variant="left" bold>Ref Type</Cell>
            <Cell width={COL.refNo} bold>Inv/DC #</Cell>
            <Cell width={COL.desc} variant="left" bold>Description</Cell>
            <Cell width={COL.debit} variant="right" bold>Debit</Cell>
            <Cell width={COL.credit} variant="right" bold>Credit</Cell>
            <Cell width={COL.balance} variant="right" bold>Balance</Cell>
            <Cell width={COL.rate} variant="right" bold>Rate</Cell>
            <Cell width={COL.lot} bold>Lot #</Cell>
            <Cell width={COL.bundle} variant="right" bold>Bundle</Cell>
            <Cell width={COL.meter} variant="right" last bold>Meters</Cell>
          </View>

          {report.transactions.map((row, idx) => (
            <View
              key={`${row.date}-${row.type}-${row.referenceNo}-${idx}`}
              style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
              wrap={false}
            >
              <Cell width={COL.date}>{formatReportDate(row.date)}</Cell>
              <Cell width={COL.refType} variant="left">{row.referenceType}</Cell>
              <Cell width={COL.refNo}>{row.referenceNo}</Cell>
              <Cell width={COL.desc} variant="left">{row.description}</Cell>
              <Cell width={COL.debit} variant="right">
                {row.debit ? formatAmount(row.debit) : '—'}
              </Cell>
              <Cell width={COL.credit} variant="right">
                {row.credit ? formatAmount(row.credit) : '—'}
              </Cell>
              <Cell width={COL.balance} variant="right" bold>
                {formatBalanceShort(row.balance)}
              </Cell>
              <Cell width={COL.rate} variant="right">
                {row.rate ? formatAmount(row.rate) : '—'}
              </Cell>
              <Cell width={COL.lot}>{row.lotNo}</Cell>
              <Cell width={COL.bundle} variant="right">
                {row.bundleQty ? String(row.bundleQty) : '—'}
              </Cell>
              <Cell width={COL.meter} variant="right" last>
                {row.meterQty ? formatAmount(row.meterQty) : '—'}
              </Cell>
            </View>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Debit Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.totalDebit)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Credit Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(report.summary.totalCredit)}</Text>
          </View>
          <View style={styles.summaryRowLast}>
            <Text style={styles.summaryLabel}>Closing Balance</Text>
            <Text style={styles.summaryValue}>
              {formatBalance(report.summary.closingBalance)}
            </Text>
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
