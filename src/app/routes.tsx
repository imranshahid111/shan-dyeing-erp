import { createHashRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import GrayLotManagement from "./components/GrayLotManagement";
import GrayLotForm from "./components/GrayLotForm";
import CustomerForm from "./components/CustomerForm";
import CustomerView from "./components/CustomerView";
import DeliveryOrders from "./components/DeliveryOrders";
import Billing from "./components/Billing";
import GatePass from "./components/GatePass";
import Customers from "./components/Customers";
import Payments from "./components/Payments";
import Reports from "./components/Reports";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateInvoice from "./components/CreateInvoice";
import Staff from "./components/Staff";
import CustomerInvoices from "./components/CustomerInvoices";

export const router = createHashRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          {
            path: "gray-lots",
            children: [
              { index: true, Component: GrayLotManagement },
              { path: "new", Component: GrayLotForm },
              { path: "edit/:id", Component: GrayLotForm },
            ],
          },
          { path: "delivery-orders", Component: DeliveryOrders },
          { 
            path: "billing", 
            children: [
              { index: true, Component: Billing },
              { path: "new", Component: CreateInvoice },
              { path: "customer/:id", Component: CustomerInvoices }
            ]
          },
          { path: "gate-pass", Component: GatePass },
          {
            path: "customers",
            children: [
              { index: true, Component: Customers },
              { path: "new", Component: CustomerForm },
              { path: "edit/:id", Component: CustomerForm },
              { path: "view/:id", Component: CustomerView },
            ],
          },
          { path: "payments", Component: Payments },
          { path: "staff", Component: Staff },
          { path: "reports", Component: Reports },
        ],
      },
    ],
  },
]);
