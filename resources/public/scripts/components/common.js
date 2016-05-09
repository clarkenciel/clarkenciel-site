var X = module.exports = {};

/* Common model stuff */
X.model = {};

X.model.setToken = function (tok) {
  sessionStorage.setItem('token', tok);
};

X.model.getToken = function () {
  return sessionStorage.getItem('token') || null;
};

X.model.setAJAXToken = function (req) {
  var token = X.model.getToken();
  req.setRequestHeader('Authorization', 'Token ' + token);
};


/* Common View stuff */
X.views = {};

X.views.getFormValues = function (formId) {
  var form = document.getElementById(formId);
  var inputs = [].slice.call(form.getElementsByTagName('input')).
        filter(function (input) { return input.type !== 'submit'; });
  var textareas = [].slice.call(form.getElementsByTagName('textarea'));
  var mces = typeof tinyMCE === 'undefined' ? {} : X.views.getTinyMCE();
  console.log(mces);
  var data = inputs.concat(textareas).concat(mces).reduce(function (acc, x) {
    acc[x.name] = x.value;
    return acc;
  }, {});
  return data;
};

X.views.getTinyMCE = function () {
  var mce = { name: 'body',
              value: tinyMCE.get('body').getContent() };
  return mce;
};

X.views.formField = function (ele, type, attr, vm) {
  return m('div.form_group',
           [m('label', {for:attr}, attr+': '),
            m('br'),
            m(ele, {id:attr,
                    type:type,
                    name:attr,
                    oninput: m.withAttr('value', vm[attr]),
                    value: vm[attr]()})]);
};

X.views.formBuilder = function (formComponents) {
  return function (formId, vm, callback) {
    return m('div.form.holder',
             m('div.form.contents',
               m('form#' + formId,
                 [formComponents.map(function (f) { return f(vm); }),
                  X.views.submitButton(formId, callback)])));
  };
};

X.views.submitButton = function (formId, callback) {
  return m('div.form_group',
           m('input',
             { type:'submit',
               name:'submit',
               value:'Submit',
               onclick: function (e) {
                 e.preventDefault();
                 if (typeof callback === 'undefined') return null;
                 else {
                   var data = X.views.getFormValues(formId);
                   return callback(data);
                 };
               }
             }));
};
