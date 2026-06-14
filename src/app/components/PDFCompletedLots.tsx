import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { CompletedLotsReport } from '../services/dashboardService';
import {
  formatMeters,
  formatReportDate,
  getPrintDateTime,
} from '../utils/completedLotsUtils';

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f5f5f5';
const BORDER = '#000000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 36,
    paddingHorizontal: 16,
    fontFamily: 'Helvetica',
    fontSize: 6,
    color: '#000',
  },
  brandingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: GRAY_HEADER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  companyDetail: { fontSize: 6, color: '#333', marginTop: 1 },
  titleBlock: { alignItems: 'flex-end' },
  reportTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaText: { fontSize: 6, color: '#444', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 5,
    marginBottom: 6,
    backgroundColor: '#fafafa',
  },
  table: { borderWidth: 1, borderColor: BORDER },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    minHeight: 14,
  },
  tableHeader: { backgroundColor: GRAY_HEADER, fontWeight: 'bold' },
  cell: {
    padding: 2,
    fontSize: 5.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 2,
    fontSize: 5.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 2,
    fontSize: 5.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: { padding: 2, fontSize: 5.5, textAlign: 'right' },
  rowAlt: { backgroundColor: GRAY_ALT },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER,
    backgroundColor: GRAY_HEADER,
    padding: 6,
    marginTop: 0,
  },
  summaryItem: { fontSize: 6, fontWeight: 'bold' },
  grandTotal: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
    backgroundColor: '#ececec',
  },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  pageNumber: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 6,
    color: '#666',
  },
});

const COL = {
  year: '4%',
  lot: '7%',
  bilty: '7%',
  date: '7%',
  quality: '11%',
  than: '4%',
  in: '8%',
  out: '8%',
  total: '8%',
  do: '6%',
  kwapsi: '6%',
  balance: '6%',
  pct: '6%',
  remarks: '12%',
};

const Cell = ({
  children,
  width,
  variant = 'center',
  last = false,
  bold = false,
  color,
}: {
  children: string;
  width: string;
  variant?: 'center' | 'left' | 'right';
  last?: boolean;
  bold?: boolean;
  color?: string;
}) => {
  const base =
    variant === 'left' ? styles.cellLeft : variant === 'right' ? styles.cellRight : styles.cell;
  return (
    <Text
      style={[
        last ? styles.cellLast : base,
        { width },
        bold ? { fontWeight: 'bold' } : {},
        color ? { color } : {},
      ]}
    >
      {children}
    </Text>
  );
};

const pctColor = (pct: number) => (pct > 0 ? '#15803d' : pct < 0 ? '#dc2626' : '#000');

export const PDFCompletedLots = ({
  report,
  org,
}: {
  report: CompletedLotsReport;
  org: Organization;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = getPrintDateTime();
  const ROWS_PER_PAGE = 22;
  const pages: typeof report.lots[] = [];
  for (let i = 0; i < report.lots.length; i += ROWS_PER_PAGE) {
    pages.push(report.lots.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={`Completed Lots - ${report.party.name}`}>
      {pages.map((pageLots, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page} wrap>
          <View style={styles.brandingBar}>
            <View>
              <Text style={styles.companyName}>{companyName}</Text>
              {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
              {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.reportTitle}>Completed Lots Report</Text>
              <Text style={styles.metaText}>Print Date: {printDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={{ fontSize: 7, fontWeight: 'bold' }}>
              Party: {report.party.name}
            </Text>
            <Text style={{ fontSize: 7 }}>
              Period:{' '}
              {report.fromDate && report.toDate
                ? `${formatReportDate(report.fromDate)} — ${formatReportDate(report.toDate)}`
                : 'All Dates'}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]} fixed>
              <Cell width={COL.year} bold>Yr</Cell>
              <Cell width={COL.lot} bold>Lot No</Cell>
              <Cell width={COL.bilty} bold>Bilty No</Cell>
              <Cell width={COL.date} bold>Date</Cell>
              <Cell width={COL.quality} variant="left" bold>Raw Quality</Cell>
              <Cell width={COL.than} bold>Than</Cell>
              <Cell width={COL.in} variant="right" bold>Meters In</Cell>
              <Cell width={COL.out} variant="right" bold>Meters Out</Cell>
              <Cell width={COL.total} variant="right" bold>Total Mtr</Cell>
              <Cell width={COL.do} variant="right" bold>D.O</Cell>
              <Cell width={COL.kwapsi} variant="right" bold>K-Wapsi</Cell>
              <Cell width={COL.balance} variant="right" bold>Balance</Cell>
              <Cell width={COL.pct} variant="right" bold>%</Cell>
              <Cell width={COL.remarks} variant="left" last bold>Remarks</Cell>
            </View>

            {pageLots.map((lot, idx) => (
              <View
                key={`${lot.lotNo}-${idx}`}
                style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
                wrap={false}
              >
                <Cell width={COL.year}>{String(lot.year)}</Cell>
                <Cell width={COL.lot}>{lot.lotNo}</Cell>
                <Cell width={COL.bilty}>{lot.biltyNo}</Cell>
                <Cell width={COL.date}>{formatReportDate(lot.date)}</Cell>
                <Cell width={COL.quality} variant="left">{lot.quality}</Cell>
                <Cell width={COL.than}>{String(lot.than)}</Cell>
                <Cell width={COL.in} variant="right">{formatMeters(lot.metersIn)}</Cell>
                <Cell width={COL.out} variant="right">{formatMeters(lot.metersOut)}</Cell>
                <Cell width={COL.total} variant="right">{formatMeters(lot.totalMeters)}</Cell>
                <Cell width={COL.do} variant="right">{formatMeters(lot.doQty)}</Cell>
                <Cell width={COL.kwapsi} variant="right">{formatMeters(lot.kWapsi)}</Cell>
                <Cell width={COL.balance} variant="right">{formatMeters(lot.balance)}</Cell>
                <Cell width={COL.pct} variant="right" color={pctColor(lot.percentage)}>
                  {lot.percentage > 0 ? `+${lot.percentage}` : String(lot.percentage)}%
                </Cell>
                <Cell width={COL.remarks} variant="left" last>{lot.remarks || '—'}</Cell>
              </View>
            ))}
          </View>

          {pageIdx === pages.length - 1 && (
            <>
              <View style={styles.summaryBar}>
                <Text style={styles.summaryItem}>Total Lots: {report.summary.totalLots}</Text>
                <Text style={styles.summaryItem}>Bundles: {formatMeters(report.summary.totalBundles)}</Text>
                <Text style={styles.summaryItem}>Meters In: {formatMeters(report.summary.totalMetersIn)}</Text>
                <Text style={styles.summaryItem}>Meters Out: {formatMeters(report.summary.totalMetersOut)}</Text>
                <Text style={styles.summaryItem}>
                  Difference: {formatMeters(report.summary.productionDifference)}
                </Text>
              </View>
              <View style={styles.grandTotal}>
                <View style={styles.grandRow}>
                  <Text style={{ fontWeight: 'bold' }}>Grand Totals</Text>
                  <Text />
                </View>
                <View style={styles.grandRow}>
                  <Text>Bundles: {formatMeters(report.summary.totalBundles)}</Text>
                  <Text>Meters In: {formatMeters(report.summary.totalMetersIn)}</Text>
                </View>
                <View style={styles.grandRow}>
                  <Text>Meters Out: {formatMeters(report.summary.totalMetersOut)}</Text>
                  <Text style={{ color: pctColor(-report.summary.productionDifference) }}>
                    Difference: {formatMeters(report.summary.productionDifference)}
                  </Text>
                </View>
              </View>
            </>
          )}

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
