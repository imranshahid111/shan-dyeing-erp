import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import GrayLotManagement from "./components/GrayLotManagement";
import DeliveryOrders from "./components/DeliveryOrders";
import Billing from "./components/Billing";
import GatePass from "./components/GatePass";
import Customers from "./components/Customers";
import Payments from "./components/Payments";
import Reports from "./components/Reports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "gray-lots", Component: GrayLotManagement },
      { path: "delivery-orders", Component: DeliveryOrders },
      { path: "billing", Component: Billing },
      { path: "gate-pass", Component: GatePass },
      { path: "customers", Component: Customers },
      { path: "payments", Component: Payments },
      { path: "reports", Component: Reports },
    ],
  },
]);
