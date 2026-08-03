import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import { StockEntry, QualityStockEntry } from '../services/dashboardService';

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

const COL_LOTS = {
  lot: '15%',
  quality: '25%',
  received: '15%',
  gray: '15%',
  ready: '15%',
  pending: '15%',
};

const COL_QUALITY = {
  quality: '40%',
  lots: '15%',
  received: '15%',
  ready: '15%',
  pending: '15%',
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

export const PDFStock = ({
  stockData,
  qualityStockData,
  view,
  unit,
  org,
}: {
  stockData: StockEntry[];
  qualityStockData: QualityStockEntry[];
  view: 'lots' | 'quality';
  unit: 'gaz' | 'meters';
  org: Organization;
}) => {
  const companyName = org?.name || 'SHAN DYEING';
  const printDate = new Date().toLocaleString('en-PK');
  const unitLabel = unit === 'gaz' ? 'Yards' : 'Meters';

  return (
    <Document title={`Stock Report (${unitLabel})`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.brandingBar}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.reportTitle}>Inventory Status</Text>
            <Text style={styles.metaText}>View: By {view === 'lots' ? 'Lot' : 'Quality'}</Text>
            <Text style={styles.metaText}>Unit: {unitLabel}</Text>
            <Text style={styles.metaText}>Print Date: {printDate}</Text>
          </View>
        </View>

        {view === 'lots' ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Cell width={COL_LOTS.lot} bold>Lot No</Cell>
              <Cell width={COL_LOTS.quality} variant="left" bold>Quality</Cell>
              <Cell width={COL_LOTS.received} variant="right" bold>Received</Cell>
              <Cell width={COL_LOTS.gray} variant="right" bold>Gray Stock</Cell>
              <Cell width={COL_LOTS.ready} variant="right" bold>Ready Stock</Cell>
              <Cell width={COL_LOTS.pending} variant="right" last bold>Pending</Cell>
            </View>

            {stockData.map((row, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
                wrap={false}
              >
                <Cell width={COL_LOTS.lot}>{row.lotNo}</Cell>
                <Cell width={COL_LOTS.quality} variant="left">{row.quality}</Cell>
                <Cell width={COL_LOTS.received} variant="right">
                  {(unit === 'gaz' ? row.totalGazana : row.totalMeters).toLocaleString()}
                </Cell>
                <Cell width={COL_LOTS.gray} variant="right">
                  {(unit === 'gaz' ? row.grayStock : row.grayStockMeters).toLocaleString()}
                </Cell>
                <Cell width={COL_LOTS.ready} variant="right">
                  {(unit === 'gaz' ? row.readyStock : row.readyStockMeters).toLocaleString()}
                </Cell>
                <Cell width={COL_LOTS.pending} variant="right" last bold>
                  {(unit === 'gaz' ? row.pending : row.pendingMeters).toLocaleString()}
                </Cell>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Cell width={COL_QUALITY.quality} variant="left" bold>Quality</Cell>
              <Cell width={COL_QUALITY.lots} bold>Lots</Cell>
              <Cell width={COL_QUALITY.received} variant="right" bold>Total Received</Cell>
              <Cell width={COL_QUALITY.ready} variant="right" bold>Ready Stock</Cell>
              <Cell width={COL_QUALITY.pending} variant="right" last bold>Total Pending</Cell>
            </View>

            {qualityStockData.map((row, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : {}]}
                wrap={false}
              >
                <Cell width={COL_QUALITY.quality} variant="left">{row.quality}</Cell>
                <Cell width={COL_QUALITY.lots}>{String(row.lotCount)}</Cell>
                <Cell width={COL_QUALITY.received} variant="right">
                  {(unit === 'gaz' ? row.totalGaz : row.totalMeters).toLocaleString()}
                </Cell>
                <Cell width={COL_QUALITY.ready} variant="right">
                  {(unit === 'gaz' ? row.readyGaz : row.readyMeters).toLocaleString()}
                </Cell>
                <Cell width={COL_QUALITY.pending} variant="right" last bold>
                  {(unit === 'gaz' ? row.pendingGaz : row.pendingMeters).toLocaleString()}
                </Cell>
              </View>
            ))}
          </View>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
