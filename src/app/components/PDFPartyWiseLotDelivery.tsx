import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { PartyLotDeliveryReport } from '../services/dashboardService';
import {
  formatMeters,
  formatReportDate,
  getPrintDateTime,
  getStatusColor,
} from '../utils/partyLotDeliveryUtils';

const GRAY_HEADER = '#d9d9d9';
const GRAY_ALT = '#f5f5f5';
const BORDER = '#000000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 14,
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
  companyName: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  companyDetail: { fontSize: 6, color: '#333', marginTop: 1 },
  reportTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  metaText: { fontSize: 5.5, color: '#444', marginTop: 2 },
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
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, minHeight: 13 },
  tableHeader: { backgroundColor: GRAY_HEADER, fontWeight: 'bold' },
  cell: {
    padding: 2,
    fontSize: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 2,
    fontSize: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'left',
  },
  cellRight: {
    padding: 2,
    fontSize: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    textAlign: 'right',
  },
  cellLast: { padding: 2, fontSize: 5, textAlign: 'center' },
  rowAlt: { backgroundColor: GRAY_ALT },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER,
    backgroundColor: GRAY_HEADER,
    padding: 6,
  },
  summaryItem: { fontSize: 6, fontWeight: 'bold' },
  pageNumber: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 6,
    color: '#666',
  },
});

const COL = {
  sr: '3%',
  lot: '6%',
  partyLot: '6%',
  delDate: '6%',
  fabric: '5%',
  party: '9%',
  quality: '8%',
  sent: '7%',
  delivered: '7%',
  doNo: '6%',
  doDate: '6%',
  challan: '6%',
  challanDate: '6%',
  status: '7%',
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
    <Text style={[last ? styles.cellLast : base, { width }, bold ? { fontWeight: 'bold' } : {}, color ? { color } : {}]}>
      {children}
    </Text>
  );
};

export const PDFPartyWiseLotDelivery = ({
  report,
  org,
}: {
  report: PartyLotDeliveryReport;
  org: Organization;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = getPrintDateTime();
  const ROWS_PER_PAGE = 20;
  const pages: typeof report.lots[] = [];
  for (let i = 0; i < report.lots.length; i += ROWS_PER_PAGE) {
    pages.push(report.lots.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document title={`Party Lot Delivery - ${report.party.name}`}>
      {pages.map((pageLots, pageIdx) => (
        <Page key={pageIdx} size="A4" orientation="landscape" style={styles.page} wrap>
          <View style={styles.brandingBar}>
            <View>
              <Text style={styles.companyName}>{companyName}</Text>
              {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
              {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.reportTitle}>Party Wise Lot Delivery Report</Text>
              <Text style={styles.metaText}>Print: {printDate}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={{ fontSize: 6, fontWeight: 'bold' }}>Party: {report.party.name}</Text>
            <Text style={{ fontSize: 6 }}>
              Period:{' '}
              {report.fromDate && report.toDate
                ? `${formatReportDate(report.fromDate)} — ${formatReportDate(report.toDate)}`
                : 'All Dates'}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]} fixed>
              <Cell width={COL.sr} bold>Sr</Cell>
              <Cell width={COL.lot} bold>Lot No</Cell>
              <Cell width={COL.partyLot} bold>Party Lot</Cell>
              <Cell width={COL.delDate} bold>Del Date</Cell>
              <Cell width={COL.fabric} bold>Fab Type</Cell>
              <Cell width={COL.party} variant="left" bold>Party Name</Cell>
              <Cell width={COL.quality} variant="left" bold>Quality</Cell>
              <Cell width={COL.sent} variant="right" bold>M Sent</Cell>
              <Cell width={COL.delivered} variant="right" bold>M Del</Cell>
              <Cell width={COL.doNo} bold>D.O No</Cell>
              <Cell width={COL.doDate} bold>D.O Date</Cell>
              <Cell width={COL.challan} bold>Challan</Cell>
              <Cell width={COL.challanDate} bold>Ch Date</Cell>
              <Cell width={COL.status} last bold>Status</Cell>
            </View>

            {pageLots.map((row, idx) => (
              <View
                key={`${row.srNo}-${row.doNo}`}
                style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
                wrap={false}
              >
                <Cell width={COL.sr}>{String(row.srNo)}</Cell>
                <Cell width={COL.lot}>{row.lotNo}</Cell>
                <Cell width={COL.partyLot}>{row.partyLotNo}</Cell>
                <Cell width={COL.delDate}>{formatReportDate(row.deliveryDate)}</Cell>
                <Cell width={COL.fabric}>{row.fabricType}</Cell>
                <Cell width={COL.party} variant="left">{row.partyName}</Cell>
                <Cell width={COL.quality} variant="left">{row.quality}</Cell>
                <Cell width={COL.sent} variant="right">{formatMeters(row.metersSent)}</Cell>
                <Cell width={COL.delivered} variant="right">{formatMeters(row.metersDelivered)}</Cell>
                <Cell width={COL.doNo}>{row.doNo}</Cell>
                <Cell width={COL.doDate}>{formatReportDate(row.doDate)}</Cell>
                <Cell width={COL.challan}>{row.challanNo}</Cell>
                <Cell width={COL.challanDate}>{formatReportDate(row.challanDate)}</Cell>
                <Cell width={COL.status} last color={getStatusColor(row.status)}>{row.status}</Cell>
              </View>
            ))}
          </View>

          {pageIdx === pages.length - 1 && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryItem}>Total Lots: {report.summary.totalLots}</Text>
              <Text style={styles.summaryItem}>Sent: {formatMeters(report.summary.totalMetersSent)} M</Text>
              <Text style={styles.summaryItem}>Delivered: {formatMeters(report.summary.totalMetersDelivered)} M</Text>
              <Text style={styles.summaryItem}>Difference: {formatMeters(report.summary.totalDifference)} M</Text>
              <Text style={styles.summaryItem}>Efficiency: {report.summary.deliveryEfficiency}%</Text>
            </View>
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
