const { sequelize, User, Customer, DeliveryOrder, Payment, GrayLot, Quality } = require("./models");

async function seed() {
  try {
    console.log("Authenticating database connection...");
    await sequelize.authenticate();

    console.log("Syncing database (force mode)...");
    await sequelize.sync({ force: true }); // DANGER: This drops all tables!

    console.log("Database synchronized.");

    // Create Admin User
    console.log("Seeding Admin User...");
    await User.create({
      username: "admin",
      password_hash: "password123", // In a real app, this should be hashed
      full_name: "System Admin",
      email: "admin@shandyeing.com",
      role: "admin",
    });

    // Create Qualities
    console.log("Seeding Qualities...");
    const qualitiesData = [
      { name: "Cotton Jersey" },
      { name: "Polyester Blend" },
      { name: "Linen" },
      { name: "Silk" },
      { name: "Denim" },
      { name: "Fleece" },
    ];
    const createdQualities = await Quality.bulkCreate(qualitiesData);
    console.log(`Created ${createdQualities.length} Qualities.`);

    // Create Customers
    console.log("Seeding Customers...");
    const customersData = Array.from({ length: 15 }).map((_, i) => ({
      customer_code: `CUST-${String(1001 + i).padStart(4, '0')}`,
      name: `Customer ${i + 1} Textile`,
      phone: `0300${Math.floor(1000000 + Math.random() * 9000000)}`,
      city: `City ${String.fromCharCode(65 + (i % 5))}`,
      outstanding_amount: Math.floor(Math.random() * 50000), // Random starting balance
    }));
    const createdCustomers = await Customer.bulkCreate(customersData);
    console.log(`Created ${createdCustomers.length} Customers.`);

    // Create Gray Lots
    console.log("Seeding Gray Lots...");
    const grayLotsData = Array.from({ length: 25 }).map((_, i) => {
      const q = createdQualities[Math.floor(Math.random() * createdQualities.length)];
      return {
        entry_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        party_name: `Party ${String.fromCharCode(65 + (i % 5))}`,
        process_type: i % 2 === 0 ? "Dyeing" : "Printing",
        bill_no: `BILL-${1000 + i}`,
        lot_no: `LOT-${String(1001 + i).padStart(4, '0')}`,
        quality_id: q.id,
        measurement: i % 3 === 0 ? "Meter" : "Yard",
        than: Math.floor(Math.random() * 50) + 10,
        gazana: Math.floor(Math.random() * 5000) + 1000,
        notes: `Sample seed lot ${i + 1}`,
      };
    });
    const createdLots = await GrayLot.bulkCreate(grayLotsData);
    console.log(`Created ${createdLots.length} Gray Lots.`);

    // Create Delivery Orders
    console.log("Seeding Delivery Orders...");
    const deliveryOrdersData = [];
    let doCounter = 1;

    for (let i = 0; i < 40; i++) {
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const lot = createdLots[Math.floor(Math.random() * createdLots.length)];
      
      const totalGray = Math.floor(Math.random() * 500) + 100;
      const totalReady = Math.floor(totalGray * (0.85 + Math.random() * 0.1)); // 85-95% yield

      const amount = totalReady * (Math.floor(Math.random() * 30) + 15);

      deliveryOrdersData.push({
        order_no: `DO-${String(doCounter++).padStart(4, '0')}`,
        order_date: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        customer_id: customer.id,
        gray_lot_id: lot.id,
        total_gray_gazana: totalGray,
        total_ready_gazana: totalReady,
        rate: amount / totalReady,
        total_amount: amount,
        status: i % 4 === 0 ? "pending" : "delivered",
      });
    }
    const createdOrders = await DeliveryOrder.bulkCreate(deliveryOrdersData);
    console.log(`Created ${createdOrders.length} Delivery Orders.`);

    // Create Payments
    console.log("Seeding Payments...");
    const paymentsData = [];
    for (let i = 0; i < 30; i++) {
      const order = createdOrders[Math.floor(Math.random() * createdOrders.length)];
      
      paymentsData.push({
        delivery_order_id: order.id,
        amount: Math.floor(Math.random() * 10000) + 1000,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: i % 3 === 0 ? "Bank Transfer" : "Cash",
        reference_no: `REF-${Math.floor(Math.random() * 100000)}`,
      });
    }
    await Payment.bulkCreate(paymentsData);
    console.log(`Created ${paymentsData.length} Payments.`);

    console.log("Seeding complete! ✨");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
