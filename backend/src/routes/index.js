const express = require("express");

const healthController = require("../controllers/healthController");
const customerController = require("../controllers/customerController");
const deliveryOrderController = require("../controllers/deliveryOrderController");
const grayLotController = require("../controllers/grayLotController");
const dashboardController = require("../controllers/dashboardController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const organizationController = require("../controllers/organizationController");
const paymentController = require("../controllers/paymentController");
const qualityController = require("../controllers/qualityController");
const activityLogController = require("../controllers/activityLogController")
const gatePassController = require("../controllers/gatePassController");
const databaseController = require("../controllers/databaseController");

const router = express.Router();

router.get("/health", healthController.checkHealth);

router.get("/qualities", qualityController.getQualities);
router.post("/qualities", qualityController.createQuality);
router.put("/qualities/:id", qualityController.updateQuality);
router.delete("/qualities/:id", qualityController.deleteQuality);

router.get("/activity-logs", activityLogController.getActivityLogs);

router.get("/customers", customerController.getCustomers);
router.get("/customers/:id", customerController.getCustomerById);
router.post("/customers", customerController.createCustomer);
router.put("/customers/:id", customerController.updateCustomer);
router.post("/customers/:id/bulk-payment", customerController.addBulkPayment);

router.get("/delivery-orders", deliveryOrderController.getDeliveryOrders);
router.get("/delivery-orders/:id", deliveryOrderController.getDeliveryOrderById);
router.post("/delivery-orders", deliveryOrderController.createDeliveryOrder);
router.put("/delivery-orders/:id/invoice", deliveryOrderController.generateInvoice);
router.delete("/delivery-orders/:id/invoice", deliveryOrderController.deleteInvoice);
router.post("/delivery-orders/:id/payment", deliveryOrderController.addPayment);
router.delete("/delivery-orders/:id", deliveryOrderController.deleteOrder);

router.get("/gate-passes", gatePassController.getGatePasses);
router.get("/gate-passes/next-number", gatePassController.getNextGatePassNumber);
router.post("/gate-passes", gatePassController.createGatePass);
router.delete("/gate-passes/:id", gatePassController.deleteGatePass);

router.get("/payments", paymentController.getAllPayments);
router.get("/payments/stats", paymentController.getPaymentStats);
router.put("/payments/:id", paymentController.updatePayment);
router.delete("/payments/:id", paymentController.deletePayment);

router.get("/gray-lots", grayLotController.getGrayLots);
router.get("/gray-lots/next-number", grayLotController.getNextLotNumber);
router.get("/gray-lots/balances", grayLotController.getLotsWithBalance);
router.get("/gray-lots/:id", grayLotController.getGrayLotById);
router.post("/gray-lots", grayLotController.createGrayLot);
router.put("/gray-lots/:id", grayLotController.updateGrayLot);
router.delete("/gray-lots/:id", grayLotController.deleteGrayLot);

router.get("/dashboard/summary", dashboardController.getDashboardSummary);
router.get("/dashboard/charts", dashboardController.getChartsData);
router.get("/dashboard/activity", dashboardController.getRecentActivity);

router.get("/reports/ledger", dashboardController.getLedgerReport);
router.get("/reports/outstanding", dashboardController.getOutstandingReport);
router.get("/reports/stock", dashboardController.getStockReport);
router.get("/reports/stock/quality", dashboardController.getQualityStockReport);

router.post("/auth/login", authController.login);

router.get("/users", userController.getUsers);
router.get("/users/:id", userController.getUser);
router.post("/users", userController.createUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

router.get("/organization", organizationController.getOrganization);
router.put("/organization", organizationController.updateOrganization);

router.get("/database/backup", databaseController.downloadBackup);

module.exports = router;

