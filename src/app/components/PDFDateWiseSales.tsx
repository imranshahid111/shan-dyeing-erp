import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { DateWiseSalesReport } from '../services/dashboardService';
import {
  formatCurrency,
  formatNumber,
  formatReportDate,
  getPrintDateTime,
} from '../utils/dateWiseSalesUtils';

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f7f7f7';
const BORDER = '#000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 8,
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
  companyName: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  companyDetail: { fontSize: 7, color: '#333', marginTop: 2 },
  titleBlock: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  metaText: { fontSize: 7, color: '#444', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  table: { borderWidth: 1, borderColor: BORDER },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 16 },
  tableHeader: { backgroundColor: GRAY_HEADER, fontWeight: 'bold' },
  tableFooter: { backgroundColor: GRAY_HEADER, fontWeight: 'bold' },
  cell: {
    padding: 4,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 4,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 4,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: { padding: 4, fontSize: 7, textAlign: 'right' },
  rowAlt: { backgroundColor: GRAY_ALT },
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
  date: '10%',
  bill: '10%',
  challan: '10%',
  party: '18%',
  quality: '14%',
  qty: '12%',
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

export const PDFDateWiseSales = ({
  report,
  org,
}: {
  report: DateWiseSalesReport;
  org: Organization;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = getPrintDateTime();
  const ROWS_PER_PAGE = 28;
  const pages: typeof report.data[] = [];
  for (let i = 0; i < report.data.length; i += ROWS_PER_PAGE) {
    pages.push(report.data.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title="Date Wise Sales Report">
      {pages.map((pageRows, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="portrait" style={styles.page} wrap>
          <View style={styles.brandingBar}>
            <View>
              <Text style={styles.companyName}>{companyName}</Text>
              {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
              {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.reportTitle}>Date Wise Sales Report</Text>
              <Text style={styles.metaText}>Print: {printDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
              From: {report.fromDate ? formatReportDate(report.fromDate) : '—'}
            </Text>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
              To: {report.toDate ? formatReportDate(report.toDate) : '—'}
            </Text>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#5b21b6' }}>
              Quality: {report.selectedQuality?.name || 'All Qualities'}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]} fixed>
              <Cell width={COL.date} bold>Date</Cell>
              <Cell width={COL.bill} bold>Bill No</Cell>
              <Cell width={COL.challan} bold>Challan No</Cell>
              <Cell width={COL.party} variant="left" bold>Party Name</Cell>
              <Cell width={COL.quality} variant="left" bold>Quality</Cell>
              <Cell width={COL.qty} variant="right" bold>Qty (Gaz)</Cell>
              <Cell width={COL.rate} variant="right" bold>Rate</Cell>
              <Cell width={COL.amount} variant="right" last bold>Amount</Cell>
            </View>

            {pageRows.map((row, idx) => (
              <View
                key={`${row.billNo}-${row.challanNo}-${idx}`}
                style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
                wrap={false}
              >
                <Cell width={COL.date}>{formatReportDate(row.date)}</Cell>
                <Cell width={COL.bill}>{String(row.billNo)}</Cell>
                <Cell width={COL.challan}>{String(row.challanNo)}</Cell>
                <Cell width={COL.party} variant="left">{row.partyName}</Cell>
                <Cell width={COL.quality} variant="left">{row.qualityName}</Cell>
                <Cell width={COL.qty} variant="right">{formatNumber(row.quantity, 2)}</Cell>
                <Cell width={COL.rate} variant="right">{formatNumber(row.rate, 2)}</Cell>
                <Cell width={COL.amount} variant="right" last>{formatCurrency(row.amount)}</Cell>
              </View>
            ))}

            {pageIdx === pages.length - 1 && (
              <View style={[styles.tableRow, styles.tableFooter]}>
                <Cell width={COL.date} bold>TOTAL</Cell>
                <Cell width={COL.bill} bold></Cell>
                <Cell width={COL.challan} bold></Cell>
                <Cell width={COL.party} bold></Cell>
                <Cell width={COL.quality} bold></Cell>
                <Cell width={COL.qty} variant="right" bold>
                  {formatNumber(report.totals.quantity, 2)}
                </Cell>
                <Cell width={COL.rate} bold></Cell>
                <Cell width={COL.amount} variant="right" last bold>
                  {formatCurrency(report.totals.amount)}
                </Cell>
              </View>
            )}
          </View>

          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
        </Page>
      ))}
    </Document>
  );
};
