import {
  BookOpen,
  ClipboardList,
  DollarSign,
  FileText,
  Layers,
  List,
  Package,
  ShoppingCart,
  Truck,
  CheckSquare,
  LucideIcon,
} from 'lucide-react';

export type ReportTabId =
  | 'ledger'
  | 'outstanding'
  | 'stock'
  | 'payments'
  | 'invoices'
  | 'challan'
  | 'subledger'
  | 'completedlots'
  | 'partylotdelivery'
  | 'datesales';

export interface ReportTab {
  id: ReportTabId;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface ReportCategory {
  id: string;
  label: string;
  tabs: ReportTab[];
}

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'financial',
    label: 'Financial',
    tabs: [
      // { id: 'ledger', label: 'Customer Ledger', icon: List, description: 'Account statement by customer' },
      { id: 'subledger', label: 'Customer Ledger', icon: BookOpen, description: 'Detailed sub-ledger with running balance' },
      { id: 'outstanding', label: 'Outstanding', icon: DollarSign, description: 'Customer dues summary' },
      { id: 'payments', label: 'Payments', icon: CheckSquare, description: 'Payment receipts log' },
      { id: 'invoices', label: 'Invoices', icon: FileText, description: 'Billing & invoice register' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    tabs: [
      { id: 'datesales', label: 'Date Wise Sales', icon: ShoppingCart, description: 'Daily sales by bill & challan' },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    tabs: [
      { id: 'challan', label: 'Delivery Challan', icon: ClipboardList, description: 'Delivery challan document' },
      { id: 'completedlots', label: 'Completed Lots', icon: Layers, description: 'Completed production lots' },
      { id: 'partylotdelivery', label: 'Party Lot Delivery', icon: Truck, description: 'Party-wise lot deliveries' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    tabs: [
      { id: 'stock', label: 'Stock Report', icon: Package, description: 'Gray & ready stock levels' },
    ],
  },
];

export const SELF_CONTAINED_TABS: ReportTabId[] = [
  'challan',
  'subledger',
  'completedlots',
  'partylotdelivery',
  'datesales',
];

export const ALL_REPORT_TABS = REPORT_CATEGORIES.flatMap((c) => c.tabs);

export function getReportMeta(tabId: ReportTabId): ReportTab | undefined {
  return ALL_REPORT_TABS.find((t) => t.id === tabId);
}
