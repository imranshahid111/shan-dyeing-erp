import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { LedgerEntry } from '../services/dashboardService';

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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  infoLabel: { fontSize: 9, fontWeight: 'bold', color: '#333' },
  infoValue: { fontSize: 10, fontWeight: 'bold' },
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
});

const COL = {
  date: '15%',
  desc: '45%',
  debit: '13%',
  credit: '13%',
  balance: '14%',
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

export const PDFLedger = ({
  data,
  customerName,
  org,
  fromDate,
  toDate,
}: {
  data: LedgerEntry[];
  customerName: string;
  org: Organization;
  fromDate: string;
  toDate: string;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = new Date().toLocaleString('en-PK');
  const totalDebit = data.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = data.reduce((sum, e) => sum + e.credit, 0);
  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0;

  return (
    <Document title={`Ledger - ${customerName}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.brandingBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Account Ledger Statement</Text>
            <Text style={styles.metaText}>Print Date: {printDate}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Customer Name</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Period</Text>
            <Text style={styles.infoValue}>
              {fromDate} — {toDate}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width={COL.date} bold>Date</Cell>
            <Cell width={COL.desc} variant="left" bold>Description</Cell>
            <Cell width={COL.debit} variant="right" bold>Debit</Cell>
            <Cell width={COL.credit} variant="right" bold>Credit</Cell>
            <Cell width={COL.balance} variant="right" last bold>Balance</Cell>
          </View>

          {data.map((row, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
              wrap={false}
            >
              <Cell width={COL.date}>{row.date}</Cell>
              <Cell width={COL.desc} variant="left">{row.description}</Cell>
              <Cell width={COL.debit} variant="right">
                {row.debit > 0 ? row.debit.toLocaleString() : '-'}
              </Cell>
              <Cell width={COL.credit} variant="right">
                {row.credit > 0 ? row.credit.toLocaleString() : '-'}
              </Cell>
              <Cell width={COL.balance} variant="right" last bold>
                {row.balance.toLocaleString()}
              </Cell>
            </View>
          ))}

          <View style={[styles.tableRow, styles.tableHeader]} wrap={false}>
            <Cell width={COL.date} bold></Cell>
            <Cell width={COL.desc} variant="left" bold>GRAND TOTAL</Cell>
            <Cell width={COL.debit} variant="right" bold>{totalDebit.toLocaleString()}</Cell>
            <Cell width={COL.credit} variant="right" bold>{totalCredit.toLocaleString()}</Cell>
            <Cell width={COL.balance} variant="right" last bold>
              {currentBalance.toLocaleString()} {currentBalance > 0 ? '(Dr)' : '(Cr)'}
            </Cell>
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
