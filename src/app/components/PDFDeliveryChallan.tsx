import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Organization } from '../services/organizationService';
import {
  computeDeliveryChallan,
  DeliveryOrderWithGrid,
  displayCell,
  formatQty,
} from '../utils/deliveryChallanCalculations';

const GRAY_HEADER = '#d9d9d9';
const GRAY_LIGHT = '#f0f0f0';
const BORDER = '#000000';

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 48,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000',
  },
  brandingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: GRAY_HEADER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 0,
  },
  brandingLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  companyDetail: {
    fontSize: 7,
    color: '#333',
    marginBottom: 1,
  },
  brandingRight: {
    alignItems: 'flex-end',
    minWidth: 140,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  printMeta: {
    fontSize: 6.5,
    color: '#444',
    textAlign: 'right',
  },
  headerInfo: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: BORDER,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerRowLast: {
    flexDirection: 'row',
  },
  headerCell: {
    flex: 1,
    flexDirection: 'row',
    borderRightWidth: 1,
    borderRightColor: BORDER,
    padding: 5,
  },
  headerCellLast: {
    flex: 1,
    flexDirection: 'row',
    padding: 5,
  },
  headerLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    width: '38%',
    color: '#333',
  },
  headerValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '62%',
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: GRAY_HEADER,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 4,
    marginBottom: 0,
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: GRAY_HEADER,
    fontWeight: 'bold',
  },
  tableFooter: {
    backgroundColor: GRAY_LIGHT,
    fontWeight: 'bold',
  },
  cell: {
    padding: 4,
    fontSize: 7,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cellLast: {
    padding: 4,
    fontSize: 7,
    textAlign: 'center',
  },
  cellLeft: {
    padding: 4,
    fontSize: 7,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  summaryItem: {
    width: '33.33%',
    flexDirection: 'row',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    padding: 5,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    width: '55%',
    color: '#333',
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '45%',
    textAlign: 'right',
  },
  finalTotals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  finalTotalsBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: BORDER,
  },
  finalTotalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    padding: 5,
    backgroundColor: GRAY_LIGHT,
  },
  finalTotalRowLast: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: GRAY_HEADER,
    fontWeight: 'bold',
  },
  finalTotalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '60%',
  },
  finalTotalValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'right',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 8,
  },
  signatureBox: {
    width: '30%',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 7,
    fontWeight: 'bold',
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 6.5,
    color: '#555',
    textAlign: 'right',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
  },
  colorListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    gap: 4,
  },
  colorChip: {
    fontSize: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
  },
});

interface PDFDeliveryChallanProps {
  order: DeliveryOrderWithGrid;
  org: Organization;
  showGrayDetails?: boolean;
}

const Cell = ({
  children,
  width,
  last = false,
  left = false,
  bold = false,
}: {
  children: string | number;
  width: string;
  last?: boolean;
  left?: boolean;
  bold?: boolean;
}) => (
  <Text
    style={[
      last ? styles.cellLast : left ? styles.cellLeft : styles.cell,
      { width },
      bold ? { fontWeight: 'bold' } : {},
    ]}
  >
    {children}
  </Text>
);

export const PDFDeliveryChallan = ({
  order,
  org,
  showGrayDetails = true,
}: PDFDeliveryChallanProps) => {
  const calc = computeDeliveryChallan(order);
  const colorCount = Math.max(calc.colors.length, 1);
  const colorColWidth = `${Math.min(78 / colorCount, 12)}%`;
  const srWidth = '6%';
  const totalWidth = '10%';

  const printDateTime = new Date().toLocaleString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportDate = new Date(order.order_date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const customerName = order.customer
    ? `${order.customer.name}${order.customer.customer_code ? ` / ${order.customer.customer_code}` : ''}`
    : '—';

  const companyName = org?.name || 'SHAN DYEING';

  const grandTotalPieces = showGrayDetails
    ? calc.totalGrayPieces
    : calc.totalFinishPieces;
  const grandTotalMeters = calc.totalFinishMeters;
  const balanceMeters = Math.max(0, calc.totalGrayMeters - calc.totalFinishMeters);

  return (
    <Document title={`Delivery Challan - ${order.order_no}`}>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Company Branding */}
        <View style={styles.brandingBar}>
          <View style={styles.brandingLeft}>
            <Text style={styles.companyName}>{companyName}</Text>
            {org?.address ? <Text style={styles.companyDetail}>{org.address}</Text> : null}
            {org?.phone ? <Text style={styles.companyDetail}>Tel: {org.phone}</Text> : null}
            {org?.email ? <Text style={styles.companyDetail}>{org.email}</Text> : null}
          </View>
          <View style={styles.brandingRight}>
            <Text style={styles.reportTitle}>Delivery Challan</Text>
            <Text style={styles.printMeta}>Print Date & Time</Text>
            <Text style={styles.printMeta}>{printDateTime}</Text>
          </View>
        </View>

        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Customer Name:</Text>
              <Text style={styles.headerValue}>{customerName}</Text>
            </View>
            <View style={styles.headerCellLast}>
              <Text style={styles.headerLabel}>Lot Number:</Text>
              <Text style={styles.headerValue}>{calc.lotNo}</Text>
            </View>
          </View>
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>DC Number:</Text>
              <Text style={styles.headerValue}>{order.order_no}</Text>
            </View>
            <View style={styles.headerCellLast}>
              <Text style={styles.headerLabel}>Report Date:</Text>
              <Text style={styles.headerValue}>{reportDate}</Text>
            </View>
          </View>
          <View style={styles.headerRowLast}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Fabric Type:</Text>
              <Text style={styles.headerValue}>{calc.fabricType}</Text>
            </View>
            <View style={styles.headerCellLast}>
              <Text style={styles.headerLabel}>Width / GSM:</Text>
              <Text style={styles.headerValue}>{calc.widthGsm}</Text>
            </View>
          </View>
        </View>

        {/* Color Information */}
        <Text style={styles.sectionTitle}>Color Information</Text>
        <View style={[styles.table, { marginBottom: 10 }]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, { width: '100%', textAlign: 'left' }]}>Colors</Text>
          </View>
          <View style={styles.colorListRow}>
            {calc.colors.length > 0 ? (
              calc.colors.map((color, idx) => (
                <Text key={color.id} style={styles.colorChip}>
                  {idx + 1}. {color.name}
                </Text>
              ))
            ) : (
              <Text style={{ fontSize: 7, padding: 4 }}>—</Text>
            )}
          </View>
        </View>

        {/* Production Details */}
        <Text style={styles.sectionTitle}>Production Details ({calc.primaryUnitFull})</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width={srWidth}>Sr No</Cell>
            {calc.colors.length > 0 ? (
              calc.colors.map((color, idx) => (
                <Cell key={color.id} width={colorColWidth}>
                  {`Color ${idx + 1}\nMeters`}
                </Cell>
              ))
            ) : (
              <Cell width="12%">Color 1 Meters</Cell>
            )}
            <Cell width={totalWidth} last>
              Total
            </Cell>
          </View>

          {calc.productionRows.map((row, idx) => {
            const isLast = idx === calc.productionRows.length - 1;
            const hasData = row.colorMeters.some((v) => v !== null && v > 0);
            if (!hasData && row.srNo > (order.grid_data as any)?.rows?.length) return null;

            return (
              <View key={row.srNo} style={isLast ? styles.tableRowLast : styles.tableRow}>
                <Cell width={srWidth}>{row.srNo}</Cell>
                {calc.colors.map((color, cIdx) => (
                  <Cell key={color.id} width={colorColWidth}>
                    {displayCell(row.colorMeters[cIdx])}
                  </Cell>
                ))}
                {calc.colors.length === 0 && <Cell width="12%">—</Cell>}
                <Cell width={totalWidth} last>
                  {hasData ? (row.total || '—') : '—'}
                </Cell>
              </View>
            );
          })}

          <View style={[styles.tableRowLast, styles.tableFooter]}>
            <Cell width={srWidth} bold>
              Total
            </Cell>
            {calc.colors.map((color, idx) => (
              <Cell key={color.id} width={colorColWidth} bold>
                {calc.colorFinishTotals[idx] || '—'}
              </Cell>
            ))}
            {calc.colors.length === 0 && <Cell width="12%">—</Cell>}
            <Cell width={totalWidth} last bold>
              {calc.productionGrandTotal || '—'}
            </Cell>
          </View>
        </View>

        {/* Summary Section */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Gray Meters:</Text>
            <Text style={styles.summaryValue}>
              {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Finish Meters:</Text>
            <Text style={styles.summaryValue}>{formatQty(calc.totalFinishMeters)}</Text>
          </View>
          <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Shortage %:</Text>
            <Text style={styles.summaryValue}>
              {showGrayDetails ? `${calc.shortagePercent}%` : '—'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Gray Pieces:</Text>
            <Text style={styles.summaryValue}>
              {showGrayDetails ? String(calc.totalGrayPieces) : '—'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Finish Pieces:</Text>
            <Text style={styles.summaryValue}>{String(calc.totalFinishPieces)}</Text>
          </View>
          <View style={[styles.summaryItem, { borderRightWidth: 0, borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Finish Type:</Text>
            <Text style={styles.summaryValue}>{calc.finishType}</Text>
          </View>
        </View>

        {/* Delivery Summary */}
        <Text style={styles.sectionTitle}>Delivery Summary</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Cell width="14%">Date</Cell>
            <Cell width="14%">DC No</Cell>
            <Cell width="14%">Gray Pieces</Cell>
            <Cell width="16%">Gray Meters</Cell>
            <Cell width="14%">Finish Pieces</Cell>
            <Cell width="16%">Finish Meters</Cell>
            <Cell width="12%" last>
              Balance
            </Cell>
          </View>
          <View style={styles.tableRow}>
            <Cell width="14%">{reportDate}</Cell>
            <Cell width="14%">{order.order_no}</Cell>
            <Cell width="14%">{showGrayDetails ? String(calc.totalGrayPieces) : '—'}</Cell>
            <Cell width="16%">
              {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
            </Cell>
            <Cell width="14%">{String(calc.totalFinishPieces)}</Cell>
            <Cell width="16%">{formatQty(calc.totalFinishMeters)}</Cell>
            <Cell width="12%" last>
              {showGrayDetails ? formatQty(balanceMeters) : '—'}
            </Cell>
          </View>
          <View style={[styles.tableRowLast, styles.tableFooter]}>
            <Cell width="28%" bold>
              Total:
            </Cell>
            <Cell width="14%" bold>
              {showGrayDetails ? String(calc.totalGrayPieces) : '—'}
            </Cell>
            <Cell width="16%" bold>
              {showGrayDetails ? formatQty(calc.totalGrayMeters) : '—'}
            </Cell>
            <Cell width="14%" bold>
              {String(calc.totalFinishPieces)}
            </Cell>
            <Cell width="16%" bold>
              {formatQty(calc.totalFinishMeters)}
            </Cell>
            <Cell width="12%" last bold>
              {showGrayDetails ? formatQty(balanceMeters) : '—'}
            </Cell>
          </View>
        </View>

        {/* Final Totals */}
        <View style={styles.finalTotals}>
          <View style={styles.finalTotalsBox}>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Grand Total Pieces:</Text>
              <Text style={styles.finalTotalValue}>{String(grandTotalPieces)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Grand Total Meters:</Text>
              <Text style={styles.finalTotalValue}>{formatQty(grandTotalMeters)}</Text>
            </View>
            <View style={styles.finalTotalRowLast}>
              <Text style={styles.finalTotalLabel}>Balance Meters:</Text>
              <Text style={styles.finalTotalValue}>
                {showGrayDetails ? formatQty(balanceMeters) : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <Text style={styles.signatureBox}>Authorized Sign</Text>
          <Text style={styles.signatureBox}>Checked By</Text>
          <Text style={styles.signatureBox}>Receiver Sign</Text>
        </View>

        <Text style={styles.disclaimer}>
          Note: Report any discrepancy immediately. Complaints after cutting will not be accepted.
        </Text>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
