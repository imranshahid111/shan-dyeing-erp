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

const router = express.Router();

router.get("/health", healthController.checkHealth);

router.get("/qualities", qualityController.getQualities);
router.post("/qualities", qualityController.createQuality);
router.put("/qualities/:id", qualityController.updateQuality);
router.delete("/qualities/:id", qualityController.deleteQuality);

router.get("/customers", customerController.getCustomers);
router.get("/customers/:id", customerController.getCustomerById);
router.post("/customers", customerController.createCustomer);
router.post("/customers/:id/bulk-payment", customerController.addBulkPayment);

router.get("/delivery-orders", deliveryOrderController.getDeliveryOrders);
router.get("/delivery-orders/:id", deliveryOrderController.getDeliveryOrderById);
router.post("/delivery-orders", deliveryOrderController.createDeliveryOrder);
router.put("/delivery-orders/:id/invoice", deliveryOrderController.generateInvoice);
router.delete("/delivery-orders/:id/invoice", deliveryOrderController.deleteInvoice);
router.post("/delivery-orders/:id/payment", deliveryOrderController.addPayment);
router.delete("/delivery-orders/:id", deliveryOrderController.deleteOrder);

router.get("/payments", paymentController.getAllPayments);
router.get("/payments/stats", paymentController.getPaymentStats);

router.get("/gray-lots", grayLotController.getGrayLots);
router.get("/gray-lots/next-number", grayLotController.getNextLotNumber);
router.get("/gray-lots/balances", grayLotController.getLotsWithBalance);
router.post("/gray-lots", grayLotController.createGrayLot);
router.delete("/gray-lots/:id", grayLotController.deleteGrayLot);

router.get("/dashboard/summary", dashboardController.getDashboardSummary);

router.post("/auth/login", authController.login);

router.get("/users", userController.getUsers);
router.post("/users", userController.createUser);
router.delete("/users/:id", userController.deleteUser);

router.get("/organization", organizationController.getOrganization);
router.put("/organization", organizationController.updateOrganization);

module.exports = router;
