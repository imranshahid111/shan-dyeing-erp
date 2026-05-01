const { Organization } = require("../models");

exports.getOrganization = async (req, res, next) => {
  try {
    let org = await Organization.findOne();
    if (!org) {
      org = await Organization.create({
        name: "Shan Dyeing",
        address: "Sheikhupura Road, Faisalabad",
        phone: "+92 300 1234567",
        email: "info@shandyeing.com",
        currency: "Rs"
      });
    }
    return res.json(org);
  } catch (error) {
    return next(error);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findOne();
    if (org) {
      await org.update(req.body);
      return res.json(org);
    }
    const newOrg = await Organization.create(req.body);
    return res.json(newOrg);
  } catch (error) {
    return next(error);
  }
};
