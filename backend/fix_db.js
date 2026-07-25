const { sequelize, DeliveryOrder, GrayLot } = require('./src/models');

async function fixDB() {
  const transaction = await sequelize.transaction();
  try {
    const dos = await DeliveryOrder.findAll({
      include: [
        { model: GrayLot }
      ],
      transaction
    });

    for (const d of dos) {
      if (d.grid_data && d.grid_data.rows && d.grid_data.colors) {
        // Calculate total gray from grid
        let totalGray = 0;
        let totalReady = 0;

        for (const row of d.grid_data.rows) {
          if (!row.values) continue;
          for (const color of d.grid_data.colors) {
            const grayVal = Number(row.values[color.id]?.gray) || 0;
            const readyVal = Number(row.values[color.id]?.ready) || 0;
            totalGray += grayVal;
            totalReady += readyVal;
          }
        }

        if (totalGray > 0 || totalReady > 0) {
          const lot = d.gray_lot || d.GrayLot;
          const isLotMeter = String(lot?.measurement || "").toLowerCase() === "meter";
          const inputUnit = d.input_unit || d.grid_data.inputUnit || 'meter';
          const isReadyGaz = inputUnit === 'gaz';

          // Base unit for DB is Gaz (Yards)
          const totalGrayGazana = isLotMeter ? (totalGray / 0.9144).toFixed(4) : totalGray.toFixed(4);
          let totalReadyGazana = totalReady;
          if (!isReadyGaz) {
            totalReadyGazana = totalReady / 0.9144;
          }
          totalReadyGazana = totalReadyGazana.toFixed(4);

          await d.update({
            total_gray_gazana: Number(totalGrayGazana),
            total_ready_gazana: Number(totalReadyGazana)
          }, { transaction });

          console.log(`Updated DO ${d.order_no}: Gray ${d.total_gray_gazana} -> ${totalGrayGazana}, Ready ${d.total_ready_gazana} -> ${totalReadyGazana}`);
        }
      }
    }
    
    await transaction.commit();
    console.log("DB fix applied successfully!");
    process.exit(0);
  } catch (e) {
    await transaction.rollback();
    console.error("DB fix failed:", e);
    process.exit(1);
  }
}

fixDB();
