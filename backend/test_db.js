const { DeliveryOrder, GrayLot } = require('./src/models');

async function run() {
  try {
    const dos = await DeliveryOrder.findAll({ order: [['id', 'DESC']], limit: 5 });
    console.log("Recent DOs:", JSON.stringify(dos.map(d => ({id: d.id, order_no: d.order_no, gray_lot_id: d.gray_lot_id, total_gray_gazana: d.total_gray_gazana})), null, 2));
    
    const lots = await GrayLot.findAll({ order: [['id', 'DESC']], limit: 5 });
    console.log("Recent Lots:", JSON.stringify(lots.map(l => ({id: l.id, lot_no: l.lot_no, gazana: l.gazana})), null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
