import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { DeliveryOrderItem } from '../services/deliveryOrderService';
import { Organization } from '../services/organizationService';

// Standard fonts
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.woff'
});

// A fallback font for Urdu text if possible, but for now we'll rely on default/system or leave it as is.
// NOTE: Proper Urdu rendering in @react-pdf/renderer requires a custom font like Noto Nastaliq Urdu 
// and sometimes text direction handling. We'll include the text as requested.

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000',
    flexDirection: 'row',
  },
  halfPage: {
    width: '50%',
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: '#ff9999',
    borderRightStyle: 'dashed',
    height: '100%',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    marginBottom: 15,
  },
  infoGrid: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoCol1: { width: '22%', fontWeight: 'bold' },
  infoCol2: { width: '33%' },
  infoCol3: { width: '20%', fontWeight: 'bold' },
  infoCol4: { width: '25%' },
  
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontWeight: 'bold',
  },
  th1: { width: '70%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  th2: { width: '30%', padding: 4, textAlign: 'center' },
  
  tableBodyRow: {
    flexDirection: 'row',
  },
  td1: { width: '70%', padding: 4, borderRightWidth: 1, borderRightColor: '#000' },
  td2: { width: '30%', padding: 4, alignItems: 'flex-end', justifyContent: 'flex-start' },
  
  innerGrid: {
    width: '100%',
  },
  innerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  innerCol1: { width: '33%', alignItems: 'center' },
  innerCol2: { width: '33%', alignItems: 'center' },
  innerCol3: { width: '34%', alignItems: 'center' },
  
  labelSmall: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  valueSmall: { fontSize: 8 },

  amtValue: { fontSize: 8, marginBottom: 14 }, // Adjusted to match the visual spacing of innerRows

  bottomSection: {
    marginTop: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
  },
  balanceBox: {
    width: '30%',
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'center',
  },
  conditionBox: {
    width: '30%',
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    alignItems: 'center',
  },
  totalBox: {
    width: '40%',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

const InvoiceContent = ({ inv, org }: { inv: DeliveryOrderItem; org: Organization }) => {
  const isRateMeter = inv.rate_unit !== 'yard';
  const readyGaz   = Number(inv.total_ready_gazana || 0);
  const readyMeter = readyGaz * 0.9144;
  const effectiveQty = isRateMeter ? readyMeter : readyGaz;
  
  const coraBundle = Number((inv as any).total_pcs || (inv as any).pcs || 0);
  const coraGazana = Number(inv.total_gray_gazana || 0);
  const finishBundle = Number((inv as any).total_pcs_finish || (inv as any).finish_pcs || 0);
  
  const processingAmount = effectiveQty * Number(inv.rate || 0);
  
  const kinarCutQty = Number((inv as any).kinar_cut_qty) || effectiveQty;
  const kinarCutAmount = Number(inv.kinar_cut_amount || 0);
  const kinarCutRate = kinarCutAmount > 0 && kinarCutQty > 0 ? (kinarCutAmount / kinarCutQty).toFixed(2) : '-';
  
  const packingQty = Number((inv as any).packing_qty) || effectiveQty;
  const packingAmount = Number(inv.packing_amount || 0);
  const packingRate = packingAmount > 0 && packingQty > 0 ? (packingAmount / packingQty).toFixed(2) : '-';

  const totalInvoiceAmount = Number(inv.total_amount || 0);
  const balanceCora = 0.00;

  // Typecasting to access nested quality properly if available
  const productInfo: any = inv.gray_lot?.quality || '';
  const product = typeof productInfo === 'object' ? productInfo.name : productInfo;

  return (
    <View style={styles.halfPage}>
      <View>
        <Text style={styles.orgName}>{org.name || 'SHAN DYEING'}</Text>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoCol1}>Customer Name:</Text>
          <Text style={[styles.infoCol2, { fontWeight: 'bold', fontSize: 10 }]}>{inv.customer?.name}</Text>
          <Text style={styles.infoCol3}></Text>
          <Text style={styles.infoCol4}></Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCol1}>Deliver At:</Text>
          <Text style={styles.infoCol2}>{inv.customer?.city || ' '}</Text>
          <Text style={styles.infoCol3}>Ref. DC No:</Text>
          <Text style={styles.infoCol4}>{inv.order_no}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCol1}>Invoice No:</Text>
          <Text style={styles.infoCol2}>{inv.invoice_no}</Text>
          <Text style={styles.infoCol3}>Date:</Text>
          <Text style={styles.infoCol4}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCol1}>Lot No:</Text>
          <Text style={styles.infoCol2}>{inv.gray_lot?.lot_no}</Text>
          <Text style={styles.infoCol3}>Dated:</Text>
          <Text style={styles.infoCol4}>{new Date(inv.order_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoCol1}>Product:</Text>
          <Text style={styles.infoCol2}>{product}</Text>
          <Text style={styles.infoCol3}>Cora Gazana:</Text>
          <Text style={styles.infoCol4}>{coraGazana.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.th1}>Detail is as Under:-</Text>
          <Text style={styles.th2}>Amount</Text>
        </View>
        
        <View style={styles.tableBodyRow}>
          <View style={styles.td1}>
            <View style={styles.innerGrid}>
              {/* Row 1 */}
              <View style={styles.innerRow}>
                <View style={styles.innerCol1}><Text style={styles.labelSmall}>Cora Bundle</Text><Text style={styles.valueSmall}>{coraBundle}</Text></View>
                <View style={styles.innerCol2}><Text style={styles.labelSmall}>Cora Gazana</Text><Text style={styles.valueSmall}>{coraGazana.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text></View>
                <View style={styles.innerCol3}><Text style={styles.labelSmall}>Rate</Text><Text style={styles.valueSmall}>-</Text></View>
              </View>
              
              {/* Row 2 */}
              <View style={styles.innerRow}>
                <View style={styles.innerCol1}><Text style={styles.labelSmall}>Finish Bundle</Text><Text style={styles.valueSmall}>{finishBundle}</Text></View>
                <View style={styles.innerCol2}><Text style={styles.labelSmall}>Finish Mtr</Text><Text style={styles.valueSmall}>{readyMeter.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text></View>
                <View style={styles.innerCol3}><Text style={styles.labelSmall}>Rate</Text><Text style={styles.valueSmall}>{isRateMeter ? Number(inv.rate).toFixed(2) : '-'}</Text></View>
              </View>
              
              {/* Row 3 */}
              <View style={styles.innerRow}>
                <View style={styles.innerCol1}><Text style={styles.labelSmall}> </Text><Text style={styles.valueSmall}> </Text></View>
                <View style={styles.innerCol2}><Text style={styles.labelSmall}>Finish Yard</Text><Text style={styles.valueSmall}>{readyGaz.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text></View>
                <View style={styles.innerCol3}><Text style={styles.labelSmall}>Rate</Text><Text style={styles.valueSmall}>{!isRateMeter ? Number(inv.rate).toFixed(2) : '-'}</Text></View>
              </View>

              {/* Row 4: Packing */}
              <View style={styles.innerRow}>
                <View style={styles.innerCol1}><Text style={styles.labelSmall}>Packing Qty</Text><Text style={styles.valueSmall}>{packingAmount > 0 ? packingQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : ' '}</Text></View>
                <View style={styles.innerCol2}><Text style={styles.labelSmall}> </Text><Text style={styles.valueSmall}> </Text></View>
                <View style={styles.innerCol3}><Text style={styles.labelSmall}>Rate</Text><Text style={styles.valueSmall}>{packingRate}</Text></View>
              </View>
              
              {/* Row 5: Kinar Cut */}
              {kinarCutAmount > 0 ? (
              <View style={styles.innerRow}>
                <View style={styles.innerCol1}><Text style={styles.labelSmall}>Kinar Cut Qty</Text><Text style={styles.valueSmall}>{kinarCutQty.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text></View>
                <View style={styles.innerCol2}><Text style={styles.labelSmall}> </Text><Text style={styles.valueSmall}> </Text></View>
                <View style={styles.innerCol3}><Text style={styles.labelSmall}>Rate</Text><Text style={styles.valueSmall}>{kinarCutRate}</Text></View>
              </View>
              ) : null}
            </View>
          </View>
          
          <View style={styles.td2}>
            <Text style={styles.amtValue}>-</Text>
            <Text style={styles.amtValue}>{isRateMeter ? processingAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '-'}</Text>
            <Text style={styles.amtValue}>{!isRateMeter ? processingAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '-'}</Text>
            <Text style={styles.amtValue}>{packingAmount > 0 ? packingAmount.toLocaleString() : '-'}</Text>
            {kinarCutAmount > 0 ? (
              <Text style={styles.amtValue}>{kinarCutAmount > 0 ? kinarCutAmount.toLocaleString() : '-'}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.balanceBox}>
          <Text style={styles.labelSmall}>Balance Cora</Text>
          <Text style={styles.valueSmall}>{balanceCora.toFixed(2)}</Text>
        </View>
        <View style={styles.conditionBox}>
          <Text style={styles.labelSmall}>Condition:</Text>
          <Text style={[styles.valueSmall, { color: 'blue' }]}>Complete</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.labelSmall}>Total Invoice Amount:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{totalInvoiceAmount.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.footerNote}>
        نوٹ:- ریٹ فرق یا بل میں کسی بھی قسم کی غلطی کی صورت میں 7 دن کے اندر فیکٹری پر رابطہ کریں اس کے بعد کوئی شکایت قابل قبول نہیں ہوگی۔
      </Text>
    </View>
  );
};

export const PDFInvoice = ({ inv, org }: { inv: DeliveryOrderItem; org: Organization }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <InvoiceContent inv={inv} org={org} />
    </Page>
  </Document>
);

export const PDFMultiInvoice = ({ invoices, org }: { invoices: DeliveryOrderItem[]; org: Organization }) => (
  <Document>
    {invoices.map(inv => (
      <Page key={inv.id} size="A4" orientation="landscape" style={styles.page}>
        <InvoiceContent inv={inv} org={org} />
      </Page>
    ))}
  </Document>
);
