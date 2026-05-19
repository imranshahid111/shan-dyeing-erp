const { User, Privilege, sequelize } = require("../models");
const bcrypt = require("bcryptjs");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "full_name", "email", "role", "is_active", "createdAt"],
      include: [{ model: Privilege }],
    });
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { full_name, email, password, role, privileges } = req.body;

    const existing = await User.findOne({ where: { email }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password_hash,
      role: role || "staff",
    }, { transaction: t });

    const isAppAdmin = role === 'admin';
    const privPayload = {
      user_id: user.id,
      can_view_dashboard: isAppAdmin ? true : (privileges?.can_view_dashboard ?? true),
      can_view_gray_lots: isAppAdmin ? true : (privileges?.can_view_gray_lots ?? false),
      can_view_delivery_orders: isAppAdmin ? true : (privileges?.can_view_delivery_orders ?? false),
      can_view_billing: isAppAdmin ? true : (privileges?.can_view_billing ?? false),
      can_view_payments: isAppAdmin ? true : (privileges?.can_view_payments ?? false),
      can_view_customers: isAppAdmin ? true : (privileges?.can_view_customers ?? false),
      can_view_qualities: isAppAdmin ? true : (privileges?.can_view_qualities ?? false),
      can_view_gate_pass: isAppAdmin ? true : (privileges?.can_view_gate_pass ?? false),
      can_view_staff: isAppAdmin ? true : (privileges?.can_view_staff ?? false),
      can_view_activity_logs: isAppAdmin ? true : (privileges?.can_view_activity_logs ?? false),
      can_view_reports: isAppAdmin ? true : (privileges?.can_view_reports ?? false),
      can_delete: isAppAdmin ? true : (privileges?.can_delete ?? false),
    };

    const savedPrivilege = await Privilege.create(privPayload, { transaction: t });

    await t.commit();

    return res.status(201).json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      privilege: savedPrivilege,
    });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      attributes: ["id", "full_name", "email", "role", "is_active", "createdAt"],
      include: [{ model: Privilege }],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { full_name, email, password, role, privileges } = req.body;

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email }, transaction: t });
      if (existing) {
        await t.rollback();
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    if (full_name) user.full_name = full_name;
    if (role) user.role = role;
    if (password) {
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save({ transaction: t });

    const isAppAdmin = role === 'admin';
    const privPayload = {
      can_view_dashboard: isAppAdmin ? true : (privileges?.can_view_dashboard ?? true),
      can_view_gray_lots: isAppAdmin ? true : (privileges?.can_view_gray_lots ?? false),
      can_view_delivery_orders: isAppAdmin ? true : (privileges?.can_view_delivery_orders ?? false),
      can_view_billing: isAppAdmin ? true : (privileges?.can_view_billing ?? false),
      can_view_payments: isAppAdmin ? true : (privileges?.can_view_payments ?? false),
      can_view_customers: isAppAdmin ? true : (privileges?.can_view_customers ?? false),
      can_view_qualities: isAppAdmin ? true : (privileges?.can_view_qualities ?? false),
      can_view_gate_pass: isAppAdmin ? true : (privileges?.can_view_gate_pass ?? false),
      can_view_staff: isAppAdmin ? true : (privileges?.can_view_staff ?? false),
      can_view_activity_logs: isAppAdmin ? true : (privileges?.can_view_activity_logs ?? false),
      can_view_reports: isAppAdmin ? true : (privileges?.can_view_reports ?? false),
      can_delete: isAppAdmin ? true : (privileges?.can_delete ?? false),
    };

    const [privRecord, created] = await Privilege.findOrCreate({
      where: { user_id: id },
      defaults: { user_id: id, ...privPayload },
      transaction: t
    });

    if (!created) {
      await privRecord.update(privPayload, { transaction: t });
    }

    await t.commit();

    return res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      privilege: privRecord,
    });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};
