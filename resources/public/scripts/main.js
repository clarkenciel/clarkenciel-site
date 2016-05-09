(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  var data = inputs.concat(textareas).reduce(function (acc, x) {
    acc[x.name] = x.value;
    return acc;
  }, {});
  return data;
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

},{}],2:[function(require,module,exports){
var Common = require('./common');
var Users = require('./users.js');
var Tags = require('./tags.js');
var X = module.exports = {};

/* MODEL */

X.model = {};

X.model.get = function (postId) {
  console.log(postId);
  return m.request({ method: 'GET',
                     url: '/api/posts/'+postId }).
    then(function (data) {
      console.log(data);
      return new X.vms.post(data.post);
    }).catch(function (e) {
      console.log(e);
    });
};

X.model.all = function () {
  
};

X.model.forUser = function (userId) {

};

X.model.forTag = function (tagName) {

};

X.model.new = function (data) {
  console.log(data);
  return m.request({ method: 'PUT',
                     url: '/api/posts/new',
                     data: { 'title': data.title,
                             'body':  data.body,
                             'author-id': data['author-id'] },
                     config: Common.model.setAJAXToken}).
    then(function (resp) {
      console.log('response', resp);
    }).
    catch(function (e) {
      console.log('error', e);
    });  
};

X.model.edit = function (data) {
  console.log(data);
  return m.request({ method: 'POST',
                     url: '/api/posts/update/' + data.id,
                     data: { 'title': data.title,
                             'body': data.body,
                             'author-id': data['author-id'] },
                     config: Common.model.setAJAXToken });
};

/* VIEW MODELS */

X.vms = {};

X.vms.post = function (params) {
  for (var key in params) {
    if (key === 'author') {
      this[key] = new Users.vms.user(params[key]);
    }
    else if (key === 'tags') {
      this[key] = new Tags.vms.tag(params[key]);
    }
    else {
      this[key] = m.prop(params[key]);
    }
  };
};

X.vms.list = function (coll) {
  this.items = m.prop(coll);
};

X.vms.blank = function (author) {
  return {
    'title': m.prop(''),
    'body':m.prop(''),
    'author': author ? author : null,
    'tags': null
  };
};

/* CONTROLLERS */
X.controllers = {};

X.controllers.full = function () {
  var postId = m.route.param('id');
  return {
    post: X.model.get(postId)
  };
};

X.controllers.new = function () {
  var author = Users.model.fromStorage();
  if (!author) m.route('/login');
  return {
    post: m.prop(X.vms.blank(author))
  };
};

X.controllers.edit = function () {
  var author = Users.model.fromStorage();
  var post = X.model.get(m.route.param('id'));
  console.log(post());
  if (!author) m.route('/login');
  if (post.author.id() != author.id()) m.route('/login');
  return {
    post: m.prop(post)
  };  
};

/* View Helpers */

/* VIEWING */

var postDisplay = function (type, components){
  return function (ctl) {
    return m('div.' + type + '.holder',
             m('div.' + type + '.content',
               m('article', components.map(function (f) { return f(ctl.post()); }))));
  };
};

var postHeader = function (vm) {
  return m("header",
           [postTitle(vm),
            postAuthor(vm)]);
};

var postTitle = function (vm) {
  return m("div.title_text",
           m("title", vm.title));
};

var postAuthor = function (vm) {
  console.log(vm);
  return m("div.subtitle_text",
           m("p", vm.author.first_name() + " " + vm.author.last_name()));
};

var postBody = function (vm) {
  return m("div.post_text",
           vm.body());
};

/* EDITING */

var postEditTitleField = function (vm) {
  return Common.views.formField('input', 'text', 'title', vm);
};

var postEditBodyField= function (vm) {
  return Common.views.formField('textarea', null, 'body', vm);
};

var postAuthorField = function (vm) {
  return m('div.form_group',
           m('input', {id:'author-id',
                       style:'display:none;',
                       value:vm.author.id()}));
};

var postForm = Common.views.formBuilder([postEditTitleField, postEditBodyField]);

/* VIEWS */

X.views = {};

X.views.postEditForm = function (vm) {
  return postForm('postEdit',
                  vm,
                  function (formData) {
                    formData['author-id'] = vm.author.id();
                    return X.mode.edit(formData);                                      
                  });
};

X.views.postCreateForm = function (vm) {
  return postForm('postEdit',
                  vm,
                  function (formData) {
                    formData['author-id'] = vm.author.id();
                    return X.model.new(formData);
                  });
};

X.views.preview = postDisplay('preview', [postHeader, postBody]);

X.views.full = postDisplay('full_view', [postHeader, postBody]);

X.views.new = postDisplay('full_view', [X.views.postCreateForm]);

X.views.edit = postDisplay('full_view', [X.views.postEditform]);

},{"./common":1,"./tags.js":3,"./users.js":4}],3:[function(require,module,exports){
var X = module.exports = {};

/* VIEW MODELS */

X.vms = {};

X.vms.tag = function (params) {
  for (var key in params) {
    this[key] = m.prop(params[key]);
  }
};

},{}],4:[function(require,module,exports){
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
      localStorage.clear();
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
      localStorage.clear();
      m.route('/');
    });
};

X.model.emptyUser = function () {
  return  new X.vms.user({'email':'', 'first-name': '', 'last-name':'', 'password':''});
};

X.model.toStorage = function (user) {
  for (var param in user) {
    localStorage.setItem(param, JSON.stringify(user[param]));
  }
};

X.model.fromStorage = function () {
  var tmp = ['first_name', 'last_name', 'email', 'id'].reduce(function (acc, param) {
    var val = localStorage.getItem(param);
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

},{"./common":1}],5:[function(require,module,exports){
var Users = require('./components/users');
var Posts = require('./components/posts');
var appAnchor = document.getElementById('app');

var LogIn = {
  controller: function () {
  },
  view: function (ctl) {
  }
};

var Index = {
  controller: function () {

  },
  view: function (ctl) {
    return m("div",
             m("a", { 'href': '/content/1' },
               "hello!"));
  }
};

m.route.mode = 'pathname';

m.route(appAnchor, '/', {
    '/': Index
  , '/content/:id': { controller: Posts.controllers.full,
                      view: Posts.views.full }
  , '/login': { controller: Users.controllers.login,
                view: Users.views.login }
  , '/logout': { controller: Users.controllers.logout,
                 view: Users.views.logout }
  , '/posts/new' : { controller: Posts.controllers.new,
                     view: Posts.views.new }
  , '/posts/edit/:id' : { controller: Posts.controllers.edit,
                          view: Posts.views.edit }
});

},{"./components/posts":2,"./components/users":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2Jpbi9ub2RlLXY1LjQuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb21wb25lbnRzL2NvbW1vbi5qcyIsImNvbXBvbmVudHMvcG9zdHMuanMiLCJjb21wb25lbnRzL3RhZ3MuanMiLCJjb21wb25lbnRzL3VzZXJzLmpzIiwic291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBDb21tb24gbW9kZWwgc3R1ZmYgKi9cblgubW9kZWwgPSB7fTtcblxuWC5tb2RlbC5zZXRUb2tlbiA9IGZ1bmN0aW9uICh0b2spIHtcbiAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCB0b2spO1xufTtcblxuWC5tb2RlbC5nZXRUb2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJykgfHwgbnVsbDtcbn07XG5cblgubW9kZWwuc2V0QUpBWFRva2VuID0gZnVuY3Rpb24gKHJlcSkge1xuICB2YXIgdG9rZW4gPSBYLm1vZGVsLmdldFRva2VuKCk7XG4gIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgJ1Rva2VuICcgKyB0b2tlbik7XG59O1xuXG5cbi8qIENvbW1vbiBWaWV3IHN0dWZmICovXG5YLnZpZXdzID0ge307XG5cblgudmlld3MuZ2V0Rm9ybVZhbHVlcyA9IGZ1bmN0aW9uIChmb3JtSWQpIHtcbiAgdmFyIGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmb3JtSWQpO1xuICB2YXIgaW5wdXRzID0gW10uc2xpY2UuY2FsbChmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpKS5cbiAgICAgICAgZmlsdGVyKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gaW5wdXQudHlwZSAhPT0gJ3N1Ym1pdCc7IH0pO1xuICB2YXIgdGV4dGFyZWFzID0gW10uc2xpY2UuY2FsbChmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZXh0YXJlYScpKTtcbiAgdmFyIGRhdGEgPSBpbnB1dHMuY29uY2F0KHRleHRhcmVhcykucmVkdWNlKGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICBhY2NbeC5uYW1lXSA9IHgudmFsdWU7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xuICByZXR1cm4gZGF0YTtcbn07XG5cblgudmlld3MuZm9ybUZpZWxkID0gZnVuY3Rpb24gKGVsZSwgdHlwZSwgYXR0ciwgdm0pIHtcbiAgcmV0dXJuIG0oJ2Rpdi5mb3JtX2dyb3VwJyxcbiAgICAgICAgICAgW20oJ2xhYmVsJywge2ZvcjphdHRyfSwgYXR0cisnOiAnKSxcbiAgICAgICAgICAgIG0oJ2JyJyksXG4gICAgICAgICAgICBtKGVsZSwge2lkOmF0dHIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6dHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTphdHRyLFxuICAgICAgICAgICAgICAgICAgICBvbmlucHV0OiBtLndpdGhBdHRyKCd2YWx1ZScsIHZtW2F0dHJdKSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZtW2F0dHJdKCl9KV0pO1xufTtcblxuWC52aWV3cy5mb3JtQnVpbGRlciA9IGZ1bmN0aW9uIChmb3JtQ29tcG9uZW50cykge1xuICByZXR1cm4gZnVuY3Rpb24gKGZvcm1JZCwgdm0sIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIG0oJ2Rpdi5mb3JtLmhvbGRlcicsXG4gICAgICAgICAgICAgbSgnZGl2LmZvcm0uY29udGVudHMnLFxuICAgICAgICAgICAgICAgbSgnZm9ybSMnICsgZm9ybUlkLFxuICAgICAgICAgICAgICAgICBbZm9ybUNvbXBvbmVudHMubWFwKGZ1bmN0aW9uIChmKSB7IHJldHVybiBmKHZtKTsgfSksXG4gICAgICAgICAgICAgICAgICBYLnZpZXdzLnN1Ym1pdEJ1dHRvbihmb3JtSWQsIGNhbGxiYWNrKV0pKSk7XG4gIH07XG59O1xuXG5YLnZpZXdzLnN1Ym1pdEJ1dHRvbiA9IGZ1bmN0aW9uIChmb3JtSWQsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBtKCdkaXYuZm9ybV9ncm91cCcsXG4gICAgICAgICAgIG0oJ2lucHV0JyxcbiAgICAgICAgICAgICB7IHR5cGU6J3N1Ym1pdCcsXG4gICAgICAgICAgICAgICBuYW1lOidzdWJtaXQnLFxuICAgICAgICAgICAgICAgdmFsdWU6J1N1Ym1pdCcsXG4gICAgICAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBYLnZpZXdzLmdldEZvcm1WYWx1ZXMoZm9ybUlkKTtcbiAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSkpO1xufTtcbiIsInZhciBDb21tb24gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFVzZXJzID0gcmVxdWlyZSgnLi91c2Vycy5qcycpO1xudmFyIFRhZ3MgPSByZXF1aXJlKCcuL3RhZ3MuanMnKTtcbnZhciBYID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLyogTU9ERUwgKi9cblxuWC5tb2RlbCA9IHt9O1xuXG5YLm1vZGVsLmdldCA9IGZ1bmN0aW9uIChwb3N0SWQpIHtcbiAgY29uc29sZS5sb2cocG9zdElkKTtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3Bvc3RzLycrcG9zdElkIH0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgcmV0dXJuIG5ldyBYLnZtcy5wb3N0KGRhdGEucG9zdCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gIFxufTtcblxuWC5tb2RlbC5mb3JVc2VyID0gZnVuY3Rpb24gKHVzZXJJZCkge1xuXG59O1xuXG5YLm1vZGVsLmZvclRhZyA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG5cbn07XG5cblgubW9kZWwubmV3ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgY29uc29sZS5sb2coZGF0YSk7XG4gIHJldHVybiBtLnJlcXVlc3QoeyBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wb3N0cy9uZXcnLFxuICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyAndGl0bGUnOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYm9keSc6ICBkYXRhLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhdXRob3ItaWQnOiBkYXRhWydhdXRob3ItaWQnXSB9LFxuICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBDb21tb24ubW9kZWwuc2V0QUpBWFRva2VufSkuXG4gICAgdGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc3BvbnNlJywgcmVzcCk7XG4gICAgfSkuXG4gICAgY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGUpO1xuICAgIH0pOyAgXG59O1xuXG5YLm1vZGVsLmVkaXQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wb3N0cy91cGRhdGUvJyArIGRhdGEuaWQsXG4gICAgICAgICAgICAgICAgICAgICBkYXRhOiB7ICd0aXRsZSc6IGRhdGEudGl0bGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdib2R5JzogZGF0YS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXV0aG9yLWlkJzogZGF0YVsnYXV0aG9yLWlkJ10gfSxcbiAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogQ29tbW9uLm1vZGVsLnNldEFKQVhUb2tlbiB9KTtcbn07XG5cbi8qIFZJRVcgTU9ERUxTICovXG5cblgudm1zID0ge307XG5cblgudm1zLnBvc3QgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICBpZiAoa2V5ID09PSAnYXV0aG9yJykge1xuICAgICAgdGhpc1trZXldID0gbmV3IFVzZXJzLnZtcy51c2VyKHBhcmFtc1trZXldKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoa2V5ID09PSAndGFncycpIHtcbiAgICAgIHRoaXNba2V5XSA9IG5ldyBUYWdzLnZtcy50YWcocGFyYW1zW2tleV0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXNba2V5XSA9IG0ucHJvcChwYXJhbXNba2V5XSk7XG4gICAgfVxuICB9O1xufTtcblxuWC52bXMubGlzdCA9IGZ1bmN0aW9uIChjb2xsKSB7XG4gIHRoaXMuaXRlbXMgPSBtLnByb3AoY29sbCk7XG59O1xuXG5YLnZtcy5ibGFuayA9IGZ1bmN0aW9uIChhdXRob3IpIHtcbiAgcmV0dXJuIHtcbiAgICAndGl0bGUnOiBtLnByb3AoJycpLFxuICAgICdib2R5JzptLnByb3AoJycpLFxuICAgICdhdXRob3InOiBhdXRob3IgPyBhdXRob3IgOiBudWxsLFxuICAgICd0YWdzJzogbnVsbFxuICB9O1xufTtcblxuLyogQ09OVFJPTExFUlMgKi9cblguY29udHJvbGxlcnMgPSB7fTtcblxuWC5jb250cm9sbGVycy5mdWxsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcG9zdElkID0gbS5yb3V0ZS5wYXJhbSgnaWQnKTtcbiAgcmV0dXJuIHtcbiAgICBwb3N0OiBYLm1vZGVsLmdldChwb3N0SWQpXG4gIH07XG59O1xuXG5YLmNvbnRyb2xsZXJzLm5ldyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGF1dGhvciA9IFVzZXJzLm1vZGVsLmZyb21TdG9yYWdlKCk7XG4gIGlmICghYXV0aG9yKSBtLnJvdXRlKCcvbG9naW4nKTtcbiAgcmV0dXJuIHtcbiAgICBwb3N0OiBtLnByb3AoWC52bXMuYmxhbmsoYXV0aG9yKSlcbiAgfTtcbn07XG5cblguY29udHJvbGxlcnMuZWRpdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGF1dGhvciA9IFVzZXJzLm1vZGVsLmZyb21TdG9yYWdlKCk7XG4gIHZhciBwb3N0ID0gWC5tb2RlbC5nZXQobS5yb3V0ZS5wYXJhbSgnaWQnKSk7XG4gIGNvbnNvbGUubG9nKHBvc3QoKSk7XG4gIGlmICghYXV0aG9yKSBtLnJvdXRlKCcvbG9naW4nKTtcbiAgaWYgKHBvc3QuYXV0aG9yLmlkKCkgIT0gYXV0aG9yLmlkKCkpIG0ucm91dGUoJy9sb2dpbicpO1xuICByZXR1cm4ge1xuICAgIHBvc3Q6IG0ucHJvcChwb3N0KVxuICB9OyAgXG59O1xuXG4vKiBWaWV3IEhlbHBlcnMgKi9cblxuLyogVklFV0lORyAqL1xuXG52YXIgcG9zdERpc3BsYXkgPSBmdW5jdGlvbiAodHlwZSwgY29tcG9uZW50cyl7XG4gIHJldHVybiBmdW5jdGlvbiAoY3RsKSB7XG4gICAgcmV0dXJuIG0oJ2Rpdi4nICsgdHlwZSArICcuaG9sZGVyJyxcbiAgICAgICAgICAgICBtKCdkaXYuJyArIHR5cGUgKyAnLmNvbnRlbnQnLFxuICAgICAgICAgICAgICAgbSgnYXJ0aWNsZScsIGNvbXBvbmVudHMubWFwKGZ1bmN0aW9uIChmKSB7IHJldHVybiBmKGN0bC5wb3N0KCkpOyB9KSkpKTtcbiAgfTtcbn07XG5cbnZhciBwb3N0SGVhZGVyID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBtKFwiaGVhZGVyXCIsXG4gICAgICAgICAgIFtwb3N0VGl0bGUodm0pLFxuICAgICAgICAgICAgcG9zdEF1dGhvcih2bSldKTtcbn07XG5cbnZhciBwb3N0VGl0bGUgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIG0oXCJkaXYudGl0bGVfdGV4dFwiLFxuICAgICAgICAgICBtKFwidGl0bGVcIiwgdm0udGl0bGUpKTtcbn07XG5cbnZhciBwb3N0QXV0aG9yID0gZnVuY3Rpb24gKHZtKSB7XG4gIGNvbnNvbGUubG9nKHZtKTtcbiAgcmV0dXJuIG0oXCJkaXYuc3VidGl0bGVfdGV4dFwiLFxuICAgICAgICAgICBtKFwicFwiLCB2bS5hdXRob3IuZmlyc3RfbmFtZSgpICsgXCIgXCIgKyB2bS5hdXRob3IubGFzdF9uYW1lKCkpKTtcbn07XG5cbnZhciBwb3N0Qm9keSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gbShcImRpdi5wb3N0X3RleHRcIixcbiAgICAgICAgICAgdm0uYm9keSgpKTtcbn07XG5cbi8qIEVESVRJTkcgKi9cblxudmFyIHBvc3RFZGl0VGl0bGVGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgnaW5wdXQnLCAndGV4dCcsICd0aXRsZScsIHZtKTtcbn07XG5cbnZhciBwb3N0RWRpdEJvZHlGaWVsZD0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUZpZWxkKCd0ZXh0YXJlYScsIG51bGwsICdib2R5Jywgdm0pO1xufTtcblxudmFyIHBvc3RBdXRob3JGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gbSgnZGl2LmZvcm1fZ3JvdXAnLFxuICAgICAgICAgICBtKCdpbnB1dCcsIHtpZDonYXV0aG9yLWlkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6J2Rpc3BsYXk6bm9uZTsnLFxuICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTp2bS5hdXRob3IuaWQoKX0pKTtcbn07XG5cbnZhciBwb3N0Rm9ybSA9IENvbW1vbi52aWV3cy5mb3JtQnVpbGRlcihbcG9zdEVkaXRUaXRsZUZpZWxkLCBwb3N0RWRpdEJvZHlGaWVsZF0pO1xuXG4vKiBWSUVXUyAqL1xuXG5YLnZpZXdzID0ge307XG5cblgudmlld3MucG9zdEVkaXRGb3JtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBwb3N0Rm9ybSgncG9zdEVkaXQnLFxuICAgICAgICAgICAgICAgICAgdm0sXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGFbJ2F1dGhvci1pZCddID0gdm0uYXV0aG9yLmlkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBYLm1vZGUuZWRpdChmb3JtRGF0YSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIH0pO1xufTtcblxuWC52aWV3cy5wb3N0Q3JlYXRlRm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gcG9zdEZvcm0oJ3Bvc3RFZGl0JyxcbiAgICAgICAgICAgICAgICAgIHZtLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhWydhdXRob3ItaWQnXSA9IHZtLmF1dGhvci5pZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWC5tb2RlbC5uZXcoZm9ybURhdGEpO1xuICAgICAgICAgICAgICAgICAgfSk7XG59O1xuXG5YLnZpZXdzLnByZXZpZXcgPSBwb3N0RGlzcGxheSgncHJldmlldycsIFtwb3N0SGVhZGVyLCBwb3N0Qm9keV0pO1xuXG5YLnZpZXdzLmZ1bGwgPSBwb3N0RGlzcGxheSgnZnVsbF92aWV3JywgW3Bvc3RIZWFkZXIsIHBvc3RCb2R5XSk7XG5cblgudmlld3MubmV3ID0gcG9zdERpc3BsYXkoJ2Z1bGxfdmlldycsIFtYLnZpZXdzLnBvc3RDcmVhdGVGb3JtXSk7XG5cblgudmlld3MuZWRpdCA9IHBvc3REaXNwbGF5KCdmdWxsX3ZpZXcnLCBbWC52aWV3cy5wb3N0RWRpdGZvcm1dKTtcbiIsInZhciBYID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLyogVklFVyBNT0RFTFMgKi9cblxuWC52bXMgPSB7fTtcblxuWC52bXMudGFnID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgdGhpc1trZXldID0gbS5wcm9wKHBhcmFtc1trZXldKTtcbiAgfVxufTtcbiIsInZhciBDb21tb24gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBNT0RFTFMgKi9cblgubW9kZWwgPSB7fTtcblxuWC5tb2RlbC5uZXcgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgcmV0dXJuICBtLnJlcXVlc3Qoe21ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3VzZXJzL25ldycsXG4gICAgICAgICAgICAgICAgICAgICBkYXRhOiBmb3JtRGF0YX0pO1xufTtcblxuWC5tb2RlbC5kZWxldGUgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcblxufTtcblxuWC5tb2RlbC5sb2dvdXQgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7bWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvYXV0aC9sb2dvdXQnLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IENvbW1vbi5tb2RlbC5zZXRBSkFYVG9rZW5cbiAgICAgICAgICAgICAgICAgICB9KS5cbiAgICB0aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcbiAgICAgIG0ucm91dGUoJy8nKTtcbiAgICB9KTtcbn07XG5cblgubW9kZWwubG9naW4gPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7bWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvYXV0aC9sb2dpbicsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhXG4gICAgICAgICAgICAgICAgICAgfSkuXG4gICAgdGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICBDb21tb24ubW9kZWwuc2V0VG9rZW4ocmVzcC50b2tlbik7XG4gICAgICBYLm1vZGVsLnRvU3RvcmFnZShyZXNwLnVzZXIpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuICAgICAgbS5yb3V0ZSgnLycpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5lbXB0eVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAgbmV3IFgudm1zLnVzZXIoeydlbWFpbCc6JycsICdmaXJzdC1uYW1lJzogJycsICdsYXN0LW5hbWUnOicnLCAncGFzc3dvcmQnOicnfSk7XG59O1xuXG5YLm1vZGVsLnRvU3RvcmFnZSA9IGZ1bmN0aW9uICh1c2VyKSB7XG4gIGZvciAodmFyIHBhcmFtIGluIHVzZXIpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShwYXJhbSwgSlNPTi5zdHJpbmdpZnkodXNlcltwYXJhbV0pKTtcbiAgfVxufTtcblxuWC5tb2RlbC5mcm9tU3RvcmFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRtcCA9IFsnZmlyc3RfbmFtZScsICdsYXN0X25hbWUnLCAnZW1haWwnLCAnaWQnXS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgcGFyYW0pIHtcbiAgICB2YXIgdmFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0ocGFyYW0pO1xuICAgIGlmIChhY2MgJiYgdmFsKSB7XG4gICAgICBhY2NbcGFyYW1dID0gdmFsO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9XG4gICAgZWxzZSByZXR1cm4gbnVsbDtcbiAgfSwge30pO1xuXG4gIGlmICh0bXApIHJldHVybiBuZXcgWC52bXMudXNlcih0bXApO1xuICBlbHNlIHJldHVybiBudWxsO1xufTtcblxuLyogQ09OVFJPTExFUlMgKi9cblxuWC5jb250cm9sbGVycyA9IHt9O1xuXG5YLmNvbnRyb2xsZXJzLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHVzZXI6IG0ucHJvcChYLm1vZGVsLmVtcHR5VXNlcigpKVxuICB9O1xufTtcblxuWC5jb250cm9sbGVycy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB1c2VyID0gWC5tb2RlbC5mcm9tU3RvcmFnZSgpO1xuICBpZiAoIXVzZXIpIG0ucm91dGUoJy8nKTtcbiAgcmV0dXJuIHtcbiAgICB1c2VyOiBtLnByb3AodXNlcilcbiAgfTtcbn07XG5cbi8qIFZJRVcgTU9ERUxTICovXG5cblgudm1zID0ge307XG5cblgudm1zLnVzZXIgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICB0aGlzW2tleV0gPSBtLnByb3AocGFyYW1zW2tleV0pO1xuICB9XG59O1xuXG4vKiBWSUVXUyAqL1xuXG5YLnZpZXdzID0ge307XG5cbnZhciB1c2VyTmFtZUZpZWxkID0gZnVuY3Rpb24gKG5hbWVUeXBlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodm0pIHtcbiAgICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgnaW5wdXQnLCAndGV4dCcsIG5hbWVUeXBlKyctbmFtZScsIHZtKTtcbiAgfTtcbn07XG5cbnZhciBlbWFpbEZpZWxkID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUZpZWxkKCdpbnB1dCcsICd0ZXh0JywgJ2VtYWlsJywgdm0pO1xufTtcblxudmFyIHBhc3N3b3JkRmllbGQgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtRmllbGQoJ2lucHV0JywgJ3RleHQnLCAncGFzc3dvcmQnLCB2bSk7XG59O1xuXG5YLnZpZXdzLmxvZ0luRm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1CdWlsZGVyKFxuICAgIFtlbWFpbEZpZWxkLCBwYXNzd29yZEZpZWxkXSkoXG4gICAgJ2xvZ2luRm9ybScsIHZtLFxuICAgIGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICAgICAgcmV0dXJuIFgubW9kZWwubG9naW4oZm9ybURhdGEpO1xuICAgIH0pO1xufTtcblxuWC52aWV3cy5sb2dPdXRGb3JtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUJ1aWxkZXIoW1xuICAgIGZ1bmN0aW9uICh2bSkge1xuICAgICAgcmV0dXJuIG0oJ2RpdicsICdDbGljayBTdWJtaXQgdG8gTG9nb3V0Jyk7XG4gICAgfV0pKFxuICAgICdsb2dvdXRGb3JtJywgdm0sXG4gICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiBYLm1vZGVsLmxvZ291dChkYXRhKTtcbiAgfSk7XG59O1xuXG5YLnZpZXdzLmNyZWF0ZUZvcm0gPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtQnVpbGRlcihcbiAgICBbdXNlck5hbWVGaWVsZCgnZmlyc3QnKSwgdXNlck5hbWVGaWVsZCgnbGFzdCcpLCBlbWFpbEZpZWxkLCBwYXNzd29yZEZpZWxkXSkoXG4gICAgJ25ld0Zvcm0nLCB2bSxcbiAgICBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgICAgIHJldHVybiBYLm1vZGVsLm5ldyhmb3JtRGF0YSk7XG4gICAgfSk7XG59O1xuXG5YLnZpZXdzLmxvZ2luID0gZnVuY3Rpb24gKGN0bCkge1xuICBjb25zb2xlLmxvZyhjdGwudXNlcigpKTtcbiAgcmV0dXJuIFgudmlld3MubG9nSW5Gb3JtKGN0bC51c2VyKCkpO1xufTtcblxuWC52aWV3cy5sb2dvdXQgPSBmdW5jdGlvbiAoY3RsKSB7XG4gIHJldHVybiBYLnZpZXdzLmxvZ091dEZvcm0oY3RsLnVzZXIoKSk7XG59O1xuXG5YLnZpZXdzLmNyZWF0ZSA9IGZ1bmN0aW9uIChjdGwpIHtcbiAgcmV0dXJuIFgudmlld3MuY3JlYXRlRm9ybShjdGwudXNlcigpKTtcbn07XG4iLCJ2YXIgVXNlcnMgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvdXNlcnMnKTtcbnZhciBQb3N0cyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9wb3N0cycpO1xudmFyIGFwcEFuY2hvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhcHAnKTtcblxudmFyIExvZ0luID0ge1xuICBjb250cm9sbGVyOiBmdW5jdGlvbiAoKSB7XG4gIH0sXG4gIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgfVxufTtcblxudmFyIEluZGV4ID0ge1xuICBjb250cm9sbGVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgfSxcbiAgdmlldzogZnVuY3Rpb24gKGN0bCkge1xuICAgIHJldHVybiBtKFwiZGl2XCIsXG4gICAgICAgICAgICAgbShcImFcIiwgeyAnaHJlZic6ICcvY29udGVudC8xJyB9LFxuICAgICAgICAgICAgICAgXCJoZWxsbyFcIikpO1xuICB9XG59O1xuXG5tLnJvdXRlLm1vZGUgPSAncGF0aG5hbWUnO1xuXG5tLnJvdXRlKGFwcEFuY2hvciwgJy8nLCB7XG4gICAgJy8nOiBJbmRleFxuICAsICcvY29udGVudC86aWQnOiB7IGNvbnRyb2xsZXI6IFBvc3RzLmNvbnRyb2xsZXJzLmZ1bGwsXG4gICAgICAgICAgICAgICAgICAgICAgdmlldzogUG9zdHMudmlld3MuZnVsbCB9XG4gICwgJy9sb2dpbic6IHsgY29udHJvbGxlcjogVXNlcnMuY29udHJvbGxlcnMubG9naW4sXG4gICAgICAgICAgICAgICAgdmlldzogVXNlcnMudmlld3MubG9naW4gfVxuICAsICcvbG9nb3V0JzogeyBjb250cm9sbGVyOiBVc2Vycy5jb250cm9sbGVycy5sb2dvdXQsXG4gICAgICAgICAgICAgICAgIHZpZXc6IFVzZXJzLnZpZXdzLmxvZ291dCB9XG4gICwgJy9wb3N0cy9uZXcnIDogeyBjb250cm9sbGVyOiBQb3N0cy5jb250cm9sbGVycy5uZXcsXG4gICAgICAgICAgICAgICAgICAgICB2aWV3OiBQb3N0cy52aWV3cy5uZXcgfVxuICAsICcvcG9zdHMvZWRpdC86aWQnIDogeyBjb250cm9sbGVyOiBQb3N0cy5jb250cm9sbGVycy5lZGl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiBQb3N0cy52aWV3cy5lZGl0IH1cbn0pO1xuIl19
