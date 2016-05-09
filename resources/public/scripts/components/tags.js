var X = module.exports = {};

/* VIEW MODELS */

X.vms = {};

X.vms.tag = function (params) {
  for (var key in params) {
    this[key] = m.prop(params[key]);
  }
};
