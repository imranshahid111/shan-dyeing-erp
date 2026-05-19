const { User, Privilege } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET || "erp_secret_key",
      { expiresIn: "24h" }
    );

    const privRecord = await Privilege.findOne({ where: { user_id: user.id } });
    const privileges = privRecord ? privRecord.toJSON() : {
      can_view_dashboard: true,
      can_view_gray_lots: user.role === "admin",
      can_view_delivery_orders: user.role === "admin",
      can_view_billing: user.role === "admin",
      can_view_payments: user.role === "admin",
      can_view_customers: user.role === "admin",
      can_view_qualities: user.role === "admin",
      can_view_gate_pass: user.role === "admin",
      can_view_staff: user.role === "admin",
      can_view_activity_logs: user.role === "admin",
      can_view_reports: user.role === "admin",
      can_delete: user.role === "admin"
    };

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        privileges,
      },
    });
  } catch (error) {
    return next(error);
  }
};
