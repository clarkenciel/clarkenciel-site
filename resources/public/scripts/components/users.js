var Common = require('./common');
var X = module.exports = {};

/* MODELS */
X.model = {};

X.model.new = function (formData) {
  return  m.request({method: 'PUT',
                     url: '/api/users/new',
                     data: formData});
};

X.model.delete = function (formData) {

};

X.model.logout = function (formData) {
  return m.request({method: 'POST',
                    url: '/api/auth/logout',
                    config: Common.model.setAJAXToken
                   }).
    then(function (resp) {
      sessionStorage.clear();
      m.route('/');
    });
};

X.model.login = function (formData) {
  return m.request({method: 'POST',
                    url: '/api/auth/login',
                    data: formData
                   }).
    then(function (resp) {
      console.log(resp);
      Common.model.setToken(resp.token);
      X.model.toStorage(resp.user);
    }).catch(function (e) {
      console.log(e);
      sessionStorage.clear();
      m.route('/');
    });
};

X.model.emptyUser = function () {
  return  new X.vms.user({'email':'', 'first-name': '', 'last-name':'', 'password':''});
};

X.model.toStorage = function (user) {
  for (var param in user) {
    sessionStorage.setItem(param, JSON.stringify(user[param]));
  }
};

X.model.fromStorage = function () {
  var tmp = ['first_name', 'last_name', 'email', 'id'].reduce(function (acc, param) {
    var val = sessionStorage.getItem(param);
    if (acc && val) {
      acc[param] = val;
      return acc;
    }
    else return null;
  }, {});

  if (tmp) return new X.vms.user(tmp);
  else return null;
};

/* CONTROLLERS */

X.controllers = {};

X.controllers.login = function () {
  return {
    user: m.prop(X.model.emptyUser())
  };
};

X.controllers.logout = function () {
  var user = X.model.fromStorage();
  if (!user) m.route('/');
  return {
    user: m.prop(user)
  };
};

/* VIEW MODELS */

X.vms = {};

X.vms.user = function (params) {
  for (var key in params) {
    this[key] = m.prop(params[key]);
  }
};

/* VIEWS */

X.views = {};

var userNameField = function (nameType) {
  return function (vm) {
    return Common.views.formField('input', 'text', nameType+'-name', vm);
  };
};

var emailField = function (vm) {
  return Common.views.formField('input', 'text', 'email', vm);
};

var passwordField = function (vm) {
  return Common.views.formField('input', 'text', 'password', vm);
};

X.views.logInForm = function (vm) {
  return Common.views.formBuilder(
    [emailField, passwordField])(
    'loginForm', vm,
    function (formData) {
      return X.model.login(formData);
    });
};

X.views.logOutForm = function (vm) {
  return Common.views.formBuilder([
    function (vm) {
      return m('div', 'Click Submit to Logout');
    }])(
    'logoutForm', vm,
    function (data) {
      return X.model.logout(data);
  });
};

X.views.createForm = function (vm) {
  return Common.views.formBuilder(
    [userNameField('first'), userNameField('last'), emailField, passwordField])(
    'newForm', vm,
    function (formData) {
      return X.model.new(formData);
    });
};

X.views.login = function (ctl) {
  console.log(ctl.user());
  return X.views.logInForm(ctl.user());
};

X.views.logout = function (ctl) {
  return X.views.logOutForm(ctl.user());
};

X.views.create = function (ctl) {
  return X.views.createForm(ctl.user());
};
