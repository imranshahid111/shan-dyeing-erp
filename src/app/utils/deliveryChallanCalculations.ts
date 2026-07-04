import { DeliveryOrderItem } from '../services/deliveryOrderService';

export interface GridColor {
  id: string;
  name: string;
}

export interface GridRow {
  id?: string;
  rowNumber?: number;
  values?: Record<string, { gray?: number | string; ready?: number | string }>;
}

export interface DeliveryChallanGridData {
  inputUnit?: 'meter' | 'gaz';
  colors?: GridColor[];
  rows?: GridRow[];
}

export type DeliveryOrderWithGrid = DeliveryOrderItem & {
  grid_data?: DeliveryChallanGridData | string;
  gray_lot?: {
    lot_no?: string;
    party_name?: string;
    measurement?: string;
    quality?: string;
    than?: number;
  };
  total_pcs?: number | string;
  pcs?: number | string;
  total_pcs_finish?: number | string;
  finish_pcs?: number | string;
  finish?: string;
  finish_type?: string;
  lot_no?: string;
  quality?: string;
};

export interface ProductionRow {
  srNo: number;
  colorMeters: (number | null)[];
  total: number;
}

export interface DeliveryChallanCalculations {
  colors: GridColor[];
  productionRows: ProductionRow[];
  colorFinishTotals: number[];
  productionGrandTotal: number;
  primaryUnit: string;
  primaryUnitFull: string;
  totalGrayMeters: number;
  totalFinishMeters: number;
  shortagePercent: string;
  shortageMeters: string;
  totalGrayPieces: string | number;
  totalFinishPieces: string | number;
  lotNo: string;
  fabricType: string;
  widthGsm: string;
  finishType: string;
}

const MAX_COLOR_COLUMNS = 7;

function parseGridData(order: DeliveryOrderWithGrid): DeliveryChallanGridData {
  let gridData = order.grid_data;
  if (typeof gridData === 'string') {
    try {
      gridData = JSON.parse(gridData);
    } catch {
      gridData = { rows: [], colors: [] };
    }
  }
  return gridData || { rows: [], colors: [] };
}

function getCellValue(
  rows: GridRow[],
  rowIndex: number,
  colorId: string,
  field: 'gray' | 'ready'
): number | null {
  const row = rows[rowIndex];
  if (!row?.values) return null;
  const val = row.values[colorId]?.[field];
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isNaN(num) ? null : num;
}

function countRowsWithData(rows: GridRow[], colors: GridColor[], field: 'gray' | 'ready'): number {
  let count = 0;
  for (let r = 0; r < rows.length; r++) {
    const hasData = colors.some((c) => {
      const val = getCellValue(rows, r, c.id, field);
      return val !== null && val > 0;
    });
    if (hasData) count++;
  }
  return count;
}

export function computeDeliveryChallan(order: DeliveryOrderWithGrid): DeliveryChallanCalculations {
  const gridData = parseGridData(order);
  const allColors = (gridData.colors || []).filter((c) => c.name?.trim());
  const colors = allColors.slice(0, MAX_COLOR_COLUMNS);
  const rows = gridData.rows || [];

  let gridGrayTotal = 0;
  let gridReadyTotal = 0;
  for (let r = 0; r < rows.length; r++) {
    for (const c of allColors) {
      gridGrayTotal += getCellValue(rows, r, c.id, 'gray') || 0;
      gridReadyTotal += getCellValue(rows, r, c.id, 'ready') || 0;
    }
  }

  let inputUnit = order.input_unit || gridData.inputUnit;
  if (!inputUnit && gridGrayTotal > 0) {
    const dbGray = Number(order.total_gray_gazana);
    inputUnit = dbGray > 0 && Math.abs(gridGrayTotal - dbGray) > 1 ? 'gaz' : 'meter';
  }
  if (!inputUnit) inputUnit = 'meter';

  const isGaz = inputUnit === 'gaz';
  const primaryUnit = isGaz ? 'Gaz' : 'Mtr';
  const primaryUnitFull = isGaz ? 'Gaz (Yard)' : 'Meter';

  let totalGrayMeters = gridGrayTotal;
  if (gridGrayTotal === 0) {
    totalGrayMeters = isGaz ? Number(order.total_gray_gazana || 0) : Number(order.total_gray_gazana || 0) * 0.9144;
  }

  let totalFinishMeters = gridReadyTotal;
  if (gridReadyTotal === 0) {
    totalFinishMeters = isGaz ? Number(order.total_ready_gazana || 0) : Number(order.total_ready_gazana || 0) * 0.9144;
  }

  const shortageMeters = (totalGrayMeters - totalFinishMeters).toFixed(2);
  const shortagePercent =
    totalGrayMeters > 0
      ? ((totalGrayMeters - totalFinishMeters) / totalGrayMeters * 100).toFixed(2)
      : '0.00';

  const productionRows: ProductionRow[] = [];
  const rowCount = Math.max(rows.length, 10);

  for (let r = 0; r < rowCount; r++) {
    const colorMeters: (number | null)[] = colors.map((c) => getCellValue(rows, r, c.id, 'ready'));
    const hasData = colorMeters.some((v) => v !== null && v > 0);
    if (!hasData && r >= rows.length) continue;

    const total = colorMeters.reduce((sum, v) => sum + (v || 0), 0);
    productionRows.push({ srNo: r + 1, colorMeters, total: hasData ? total : 0 });
  }

  const colorFinishTotals = colors.map((c) => {
    let total = 0;
    for (let r = 0; r < rows.length; r++) {
      total += getCellValue(rows, r, c.id, 'ready') || 0;
    }
    return total;
  });

  const productionGrandTotal = colorFinishTotals.reduce((sum, v) => sum + v, 0);

  const grayRowCount = countRowsWithData(rows, allColors, 'gray');
  const finishRowCount = countRowsWithData(rows, allColors, 'ready');

  const totalGrayPieces =
    order.total_pcs ?? order.pcs ?? (grayRowCount > 0 ? grayRowCount : order.gray_lot?.than ?? '—');
  const totalFinishPieces =
    order.total_pcs_finish ?? order.finish_pcs ?? (finishRowCount > 0 ? finishRowCount : '—');

  const lotNo = order.gray_lot?.lot_no || order.lot_no || '—';
  const fabricType = order.gray_lot?.quality || order.quality || '—';
  const widthGsm = order.gray_lot?.measurement || '—';
  const finishType = order.finish || order.finish_type || 'Finish';

  return {
    colors,
    productionRows,
    colorFinishTotals,
    productionGrandTotal,
    primaryUnit,
    primaryUnitFull,
    totalGrayMeters,
    totalFinishMeters,
    shortagePercent,
    shortageMeters,
    totalGrayPieces,
    totalFinishPieces,
    lotNo,
    fabricType,
    widthGsm,
    finishType,
  };
}

export function formatQty(value: number, decimals = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function displayCell(value: number | null | undefined, showBlank = false): string {
  if (showBlank) return '—';
  if (value === null || value === undefined || value === 0) return '—';
  return String(value);
}
