// PDFGatePass.tsx - Landscape mode with 2 copies (Office Copy & Party Copy)
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { GatePassItem } from '../services/gatePassService';
import { Organization } from '../services/organizationService';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 8,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  // For 2 copies layout (side by side)
  copiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  copy: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
  },
  copyLabel: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 6,
    marginBottom: 10,
  },
  companySection: {
    flex: 1,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#000',
  },
  companySub: {
    fontSize: 6,
    color: '#555',
    marginTop: 2,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
  },
  ogpNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 6,
  },
  infoItem: {
    width: '33%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#333',
    width: '35%',
  },
  infoValue: {
    fontSize: 7,
    color: '#000',
    width: '65%',
  },
  table: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 4,
    fontSize: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  tableCellLeft: {
    padding: 4,
    fontSize: 6,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'left',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signatureBox: {
    width: '30%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 7,
  },
  printTime: {
    fontSize: 6,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  tearLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    borderLeftStyle: 'dashed',
  },
  tearText: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%) rotate(-90deg)',
    fontSize: 6,
    color: '#999',
    backgroundColor: '#fff',
    paddingHorizontal: 4,
  },
});

const GatePassCopy = ({ gp, org, copyType }: { gp: GatePassItem; org: Organization; copyType: 'OFFICE COPY' | 'PARTY COPY' }) => {
  const totalGazana = (gp.items || []).reduce((sum, item) => sum + (Number(item.gazana_total) || 0), 0);
  const totalBundles = (gp.items || []).reduce((sum, item) => sum + (Number(item.bundles) || 0), 0);
  const allComplete = (gp.items || []).every(item => item.status === 'Complete');

  return (
    <View style={styles.copy}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companySection}>
          <Text style={styles.companyName}>{copyType}</Text>
        </View>
        <View style={styles.companySection}>
          <Text style={styles.companyName}>SHAN DYEING</Text>
          <Text style={styles.companySub}>Textile Factory</Text>
        </View>
        {/* <View style={styles.companySection}>
          <Text style={styles.companyName}>SHAN DYEING</Text>
          <Text style={styles.companySub}>Textile Factory</Text>
        </View> */}
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>OUTWARD GATE PASS</Text>
        <Text style={styles.ogpNumber}>OGP #{gp.gate_pass_no}</Text>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>
            {new Date(gp.gate_pass_date).toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>OGP #:</Text>
          <Text style={styles.infoValue}>{gp.gate_pass_no}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>OGP #:</Text>
          <Text style={styles.infoValue}>{gp.gate_pass_no}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Vehicle No:</Text>
          <Text style={styles.infoValue}>{gp.vehicle_no || '—'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Vehicle No:</Text>
          <Text style={styles.infoValue}>{gp.vehicle_no || '—'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Driver Name:</Text>
          <Text style={styles.infoValue}>{gp.driver_name || '—'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Driver Name:</Text>
          <Text style={styles.infoValue}>{gp.driver_name || '—'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Driver Mobile:</Text>
          <Text style={styles.infoValue}>{gp.driver_mobile || '—'}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { width: '10%' }]}>D.O No</Text>
          <Text style={[styles.tableCell, { width: '8%' }]}>Lot No</Text>
          <Text style={[styles.tableCellLeft, { width: '23%' }]}>Party Name</Text>
          <Text style={[styles.tableCellLeft, { width: '20%' }]}>Description</Text>
          <Text style={[styles.tableCell, { width: '8%' }]}>Bundles</Text>
          <Text style={[styles.tableCell, { width: '11%' }]}>Gazana</Text>
          <Text style={[styles.tableCell, { width: '20%' }]}>Status</Text>
        </View>

        {(gp.items || []).map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={[styles.tableCell, { width: '10%' }]}>{item.delivery_order?.order_no || '—'}</Text>
            <Text style={[styles.tableCell, { width: '8%' }]}>{(item.delivery_order as any)?.gray_lot?.lot_no || '—'}</Text>
            <Text style={[styles.tableCellLeft, { width: '23%' }]}>{item.delivery_order?.customer?.name || '—'}</Text>
            <Text style={[styles.tableCellLeft, { width: '20%' }]}>{item.description || '—'}</Text>
            <Text style={[styles.tableCell, { width: '8%' }]}>{item.bundles || 0}</Text>
            <Text style={[styles.tableCell, { width: '11%' }]}>{Number(item.gazana_total || 0).toLocaleString()}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>{item.status || (allComplete ? 'Complete' : 'Pending')}</Text>
          </View>
        ))}

        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.tableCell, { width: '10%', fontWeight: 'bold' }]}>Total:</Text>
          <Text style={[styles.tableCell, { width: '8%' }]}></Text>
          <Text style={[styles.tableCellLeft, { width: '23%' }]}></Text>
          <Text style={[styles.tableCellLeft, { width: '20%' }]}></Text>
          <Text style={[styles.tableCell, { width: '8%', fontWeight: 'bold' }]}>{totalBundles}</Text>
          <Text style={[styles.tableCell, { width: '11%', fontWeight: 'bold' }]}>{totalGazana.toLocaleString()}</Text>
          <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{allComplete ? 'Complete' : 'In Progress'}</Text>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.footer}>
        <View style={styles.signatureBox}>
          <Text>Security Signature</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Authorized Signature</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text>Receiver Signature</Text>
        </View>
      </View>

      {/* Print Time */}
      <View style={styles.printTime}>
        <Text>Print Date & Time: {new Date().toLocaleString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </View>
  );
};

// Main PDF Component - Landscape with 2 copies
export const PDFGatePass = ({ gp, org }: { gp: GatePassItem; org: Organization }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.copiesContainer}>
          {/* Office Copy */}
          <GatePassCopy gp={gp} org={org} copyType="OFFICE COPY" />
          
          {/* Vertical tear line */}
          <View style={styles.tearLine}>
            <Text style={styles.tearText}>--- TEAR HERE ---</Text>
          </View>
          
          {/* Party Copy */}
          <GatePassCopy gp={gp} org={org} copyType="PARTY COPY" />
        </View>
      </Page>
    </Document>
  );
};