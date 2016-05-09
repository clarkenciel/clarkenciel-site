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
      return new X.vms.post(data.post);
    }).catch(function (e) {
      console.log(e);
    });
};

X.model.all = function () {
  return m.request({ method: 'GET',
                     url: '/api/posts' }).
    then(function (resp) {
      console.log(resp);
      return new X.vms.list(
        resp.posts.map(function (p) {
          return new X.vms.post(p);
        }));
    }).catch(function (e) {
      console.log(e);
    });
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
                     url: '/api/posts/update',
                     data: { 'id': data.id,
                             'title': data.title,
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
  var ctl = {};
  var author = Users.model.fromStorage();
  X.model.get(m.route.param('id')).
    then(function (post) {
      if (!author) m.route('/login');
      if (post.author.id() != author.id()) m.route('/login');
      ctl.post = m.prop(post);
    });
  return ctl;
};

/* View Helpers */

/* VIEWING */

var postDisplay = function (type, components){
  return function (post) {
    return m('div.' + type + '.holder',
             m('div.' + type + '.content',
               m('article',
                 components.map(function(f) { return f(post); }))));
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
           { innerHTML: vm.body() });
};

/* EDITING */

var postTitleField = function (vm) {
  return Common.views.formField('input', 'text', 'title', vm);
};

var postBodyField = function (vm) {
  return Common.views.formField('textarea', null, 'body', vm);
};

var postAuthorField = function (vm) {
  return m('div.form_group',
           m('input', {id:'author-id',
                       style:'display:none;',
                       value:vm.author.id()}));
};

var postForm = Common.views.formBuilder([postTitleField, postBodyField]);

/* VIEWS */

X.views = {};

X.views.postEditForm = function (vm) {
  return postForm('postEdit',
                  vm,
                  function (formData) {
                    formData['author-id'] = vm.author.id();
                    formData['id'] = vm.id();
                    return X.model.edit(formData);
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

X.views.edit = postDisplay('full_view', [X.views.postEditForm]);

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
    var ctl = {posts: m.prop(new Posts.vms.list([]))};
    Posts.model.all().then(function (posts) {
      ctl.posts(posts);
    });
    return ctl;
  },
  view: function (ctl) {
    console.log(ctl.posts().items());
    return ctl.posts().items().map(function (p) {
      return Posts.views.preview(p);
    });
  }
};

m.route.mode = 'pathname';

m.route(appAnchor, '/', {
    '/': Index
  , '/content/:id': { controller: Posts.controllers.full,
                      view: function (ctl) {
                        return Posts.views.full(ctl.post());
                      }
                    }
  , '/login': { controller: Users.controllers.login,
                view: Users.views.login }
  , '/logout': { controller: Users.controllers.logout,
                 view: Users.views.logout }
  , '/posts/new' : { controller: Posts.controllers.new,
                     view: function (ctl) {
                       return Posts.views.new(ctl.post());
                     }
                   }
  , '/posts/edit/:id' : { controller: Posts.controllers.edit,
                          view: function (ctl) {
                            return Posts.views.edit(ctl.post());
                          }
                        }
});

},{"./components/posts":2,"./components/users":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2Jpbi9ub2RlLXY1LjQuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb21wb25lbnRzL2NvbW1vbi5qcyIsImNvbXBvbmVudHMvcG9zdHMuanMiLCJjb21wb25lbnRzL3RhZ3MuanMiLCJjb21wb25lbnRzL3VzZXJzLmpzIiwic291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBYID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLyogQ29tbW9uIG1vZGVsIHN0dWZmICovXG5YLm1vZGVsID0ge307XG5cblgubW9kZWwuc2V0VG9rZW4gPSBmdW5jdGlvbiAodG9rKSB7XG4gIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgdG9rKTtcbn07XG5cblgubW9kZWwuZ2V0VG9rZW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpIHx8IG51bGw7XG59O1xuXG5YLm1vZGVsLnNldEFKQVhUb2tlbiA9IGZ1bmN0aW9uIChyZXEpIHtcbiAgdmFyIHRva2VuID0gWC5tb2RlbC5nZXRUb2tlbigpO1xuICByZXEuc2V0UmVxdWVzdEhlYWRlcignQXV0aG9yaXphdGlvbicsICdUb2tlbiAnICsgdG9rZW4pO1xufTtcblxuXG4vKiBDb21tb24gVmlldyBzdHVmZiAqL1xuWC52aWV3cyA9IHt9O1xuXG5YLnZpZXdzLmdldEZvcm1WYWx1ZXMgPSBmdW5jdGlvbiAoZm9ybUlkKSB7XG4gIHZhciBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZm9ybUlkKTtcbiAgdmFyIGlucHV0cyA9IFtdLnNsaWNlLmNhbGwoZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKSkuXG4gICAgICAgIGZpbHRlcihmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGlucHV0LnR5cGUgIT09ICdzdWJtaXQnOyB9KTtcbiAgdmFyIHRleHRhcmVhcyA9IFtdLnNsaWNlLmNhbGwoZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dGFyZWEnKSk7XG4gIHZhciBtY2VzID0gdHlwZW9mIHRpbnlNQ0UgPT09ICd1bmRlZmluZWQnID8ge30gOiBYLnZpZXdzLmdldFRpbnlNQ0UoKTtcbiAgY29uc29sZS5sb2cobWNlcyk7XG4gIHZhciBkYXRhID0gaW5wdXRzLmNvbmNhdCh0ZXh0YXJlYXMpLmNvbmNhdChtY2VzKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIGFjY1t4Lm5hbWVdID0geC52YWx1ZTtcbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSk7XG4gIHJldHVybiBkYXRhO1xufTtcblxuWC52aWV3cy5nZXRUaW55TUNFID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbWNlID0geyBuYW1lOiAnYm9keScsXG4gICAgICAgICAgICAgIHZhbHVlOiB0aW55TUNFLmdldCgnYm9keScpLmdldENvbnRlbnQoKSB9O1xuICByZXR1cm4gbWNlO1xufTtcblxuWC52aWV3cy5mb3JtRmllbGQgPSBmdW5jdGlvbiAoZWxlLCB0eXBlLCBhdHRyLCB2bSkge1xuICByZXR1cm4gbSgnZGl2LmZvcm1fZ3JvdXAnLFxuICAgICAgICAgICBbbSgnbGFiZWwnLCB7Zm9yOmF0dHJ9LCBhdHRyKyc6ICcpLFxuICAgICAgICAgICAgbSgnYnInKSxcbiAgICAgICAgICAgIG0oZWxlLCB7aWQ6YXR0cixcbiAgICAgICAgICAgICAgICAgICAgdHlwZTp0eXBlLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOmF0dHIsXG4gICAgICAgICAgICAgICAgICAgIG9uaW5wdXQ6IG0ud2l0aEF0dHIoJ3ZhbHVlJywgdm1bYXR0cl0pLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdm1bYXR0cl0oKX0pXSk7XG59O1xuXG5YLnZpZXdzLmZvcm1CdWlsZGVyID0gZnVuY3Rpb24gKGZvcm1Db21wb25lbnRzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZm9ybUlkLCB2bSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gbSgnZGl2LmZvcm0uaG9sZGVyJyxcbiAgICAgICAgICAgICBtKCdkaXYuZm9ybS5jb250ZW50cycsXG4gICAgICAgICAgICAgICBtKCdmb3JtIycgKyBmb3JtSWQsXG4gICAgICAgICAgICAgICAgIFtmb3JtQ29tcG9uZW50cy5tYXAoZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGYodm0pOyB9KSxcbiAgICAgICAgICAgICAgICAgIFgudmlld3Muc3VibWl0QnV0dG9uKGZvcm1JZCwgY2FsbGJhY2spXSkpKTtcbiAgfTtcbn07XG5cblgudmlld3Muc3VibWl0QnV0dG9uID0gZnVuY3Rpb24gKGZvcm1JZCwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIG0oJ2Rpdi5mb3JtX2dyb3VwJyxcbiAgICAgICAgICAgbSgnaW5wdXQnLFxuICAgICAgICAgICAgIHsgdHlwZTonc3VibWl0JyxcbiAgICAgICAgICAgICAgIG5hbWU6J3N1Ym1pdCcsXG4gICAgICAgICAgICAgICB2YWx1ZTonU3VibWl0JyxcbiAgICAgICAgICAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IFgudmlld3MuZ2V0Rm9ybVZhbHVlcyhmb3JtSWQpO1xuICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9KSk7XG59O1xuIiwidmFyIENvbW1vbiA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG52YXIgVXNlcnMgPSByZXF1aXJlKCcuL3VzZXJzLmpzJyk7XG52YXIgVGFncyA9IHJlcXVpcmUoJy4vdGFncy5qcycpO1xudmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBNT0RFTCAqL1xuXG5YLm1vZGVsID0ge307XG5cblgubW9kZWwuZ2V0ID0gZnVuY3Rpb24gKHBvc3RJZCkge1xuICBjb25zb2xlLmxvZyhwb3N0SWQpO1xuICByZXR1cm4gbS5yZXF1ZXN0KHsgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvcG9zdHMvJytwb3N0SWQgfSkuXG4gICAgdGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIG5ldyBYLnZtcy5wb3N0KGRhdGEucG9zdCk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBtLnJlcXVlc3QoeyBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wb3N0cycgfSkuXG4gICAgdGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICByZXR1cm4gbmV3IFgudm1zLmxpc3QoXG4gICAgICAgIHJlc3AucG9zdHMubWFwKGZ1bmN0aW9uIChwKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBYLnZtcy5wb3N0KHApO1xuICAgICAgICB9KSk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5mb3JVc2VyID0gZnVuY3Rpb24gKHVzZXJJZCkge1xuXG59O1xuXG5YLm1vZGVsLmZvclRhZyA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG5cbn07XG5cblgubW9kZWwubmV3ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgY29uc29sZS5sb2coZGF0YSk7XG4gIHJldHVybiBtLnJlcXVlc3QoeyBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wb3N0cy9uZXcnLFxuICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyAndGl0bGUnOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYm9keSc6ICBkYXRhLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhdXRob3ItaWQnOiBkYXRhWydhdXRob3ItaWQnXSB9LFxuICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBDb21tb24ubW9kZWwuc2V0QUpBWFRva2VufSkuXG4gICAgdGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY29uc29sZS5sb2coJ3Jlc3BvbnNlJywgcmVzcCk7XG4gICAgfSkuXG4gICAgY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicsIGUpO1xuICAgIH0pOyAgXG59O1xuXG5YLm1vZGVsLmVkaXQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wb3N0cy91cGRhdGUnLFxuICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyAnaWQnOiBkYXRhLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGl0bGUnOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYm9keSc6IGRhdGEuYm9keSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2F1dGhvci1pZCc6IGRhdGFbJ2F1dGhvci1pZCddIH0sXG4gICAgICAgICAgICAgICAgICAgICBjb25maWc6IENvbW1vbi5tb2RlbC5zZXRBSkFYVG9rZW4gfSk7XG59O1xuXG4vKiBWSUVXIE1PREVMUyAqL1xuXG5YLnZtcyA9IHt9O1xuXG5YLnZtcy5wb3N0ID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgaWYgKGtleSA9PT0gJ2F1dGhvcicpIHtcbiAgICAgIHRoaXNba2V5XSA9IG5ldyBVc2Vycy52bXMudXNlcihwYXJhbXNba2V5XSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGtleSA9PT0gJ3RhZ3MnKSB7XG4gICAgICB0aGlzW2tleV0gPSBuZXcgVGFncy52bXMudGFnKHBhcmFtc1trZXldKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzW2tleV0gPSBtLnByb3AocGFyYW1zW2tleV0pO1xuICAgIH1cbiAgfTtcbn07XG5cblgudm1zLmxpc3QgPSBmdW5jdGlvbiAoY29sbCkge1xuICB0aGlzLml0ZW1zID0gbS5wcm9wKGNvbGwpO1xufTtcblxuWC52bXMuYmxhbmsgPSBmdW5jdGlvbiAoYXV0aG9yKSB7XG4gIHJldHVybiB7XG4gICAgJ3RpdGxlJzogbS5wcm9wKCcnKSxcbiAgICAnYm9keSc6bS5wcm9wKCcnKSxcbiAgICAnYXV0aG9yJzogYXV0aG9yID8gYXV0aG9yIDogbnVsbCxcbiAgICAndGFncyc6IG51bGxcbiAgfTtcbn07XG5cbi8qIENPTlRST0xMRVJTICovXG5YLmNvbnRyb2xsZXJzID0ge307XG5cblguY29udHJvbGxlcnMuZnVsbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHBvc3RJZCA9IG0ucm91dGUucGFyYW0oJ2lkJyk7XG4gIHJldHVybiB7XG4gICAgcG9zdDogWC5tb2RlbC5nZXQocG9zdElkKVxuICB9O1xufTtcblxuWC5jb250cm9sbGVycy5uZXcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhdXRob3IgPSBVc2Vycy5tb2RlbC5mcm9tU3RvcmFnZSgpO1xuICBpZiAoIWF1dGhvcikgbS5yb3V0ZSgnL2xvZ2luJyk7XG4gIHJldHVybiB7XG4gICAgcG9zdDogbS5wcm9wKFgudm1zLmJsYW5rKGF1dGhvcikpXG4gIH07XG59O1xuXG5YLmNvbnRyb2xsZXJzLmVkaXQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjdGwgPSB7fTtcbiAgdmFyIGF1dGhvciA9IFVzZXJzLm1vZGVsLmZyb21TdG9yYWdlKCk7XG4gIFgubW9kZWwuZ2V0KG0ucm91dGUucGFyYW0oJ2lkJykpLlxuICAgIHRoZW4oZnVuY3Rpb24gKHBvc3QpIHtcbiAgICAgIGlmICghYXV0aG9yKSBtLnJvdXRlKCcvbG9naW4nKTtcbiAgICAgIGlmIChwb3N0LmF1dGhvci5pZCgpICE9IGF1dGhvci5pZCgpKSBtLnJvdXRlKCcvbG9naW4nKTtcbiAgICAgIGN0bC5wb3N0ID0gbS5wcm9wKHBvc3QpO1xuICAgIH0pO1xuICByZXR1cm4gY3RsO1xufTtcblxuLyogVmlldyBIZWxwZXJzICovXG5cbi8qIFZJRVdJTkcgKi9cblxudmFyIHBvc3REaXNwbGF5ID0gZnVuY3Rpb24gKHR5cGUsIGNvbXBvbmVudHMpe1xuICByZXR1cm4gZnVuY3Rpb24gKHBvc3QpIHtcbiAgICByZXR1cm4gbSgnZGl2LicgKyB0eXBlICsgJy5ob2xkZXInLFxuICAgICAgICAgICAgIG0oJ2Rpdi4nICsgdHlwZSArICcuY29udGVudCcsXG4gICAgICAgICAgICAgICBtKCdhcnRpY2xlJyxcbiAgICAgICAgICAgICAgICAgY29tcG9uZW50cy5tYXAoZnVuY3Rpb24oZikgeyByZXR1cm4gZihwb3N0KTsgfSkpKSk7XG4gIH07XG59O1xuXG52YXIgcG9zdEhlYWRlciA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gbShcImhlYWRlclwiLFxuICAgICAgICAgICBbcG9zdFRpdGxlKHZtKSxcbiAgICAgICAgICAgIHBvc3RBdXRob3Iodm0pXSk7XG59O1xuXG52YXIgcG9zdFRpdGxlID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBtKFwiZGl2LnRpdGxlX3RleHRcIixcbiAgICAgICAgICAgbShcInRpdGxlXCIsIHZtLnRpdGxlKSk7XG59O1xuXG52YXIgcG9zdEF1dGhvciA9IGZ1bmN0aW9uICh2bSkge1xuICBjb25zb2xlLmxvZyh2bSk7XG4gIHJldHVybiBtKFwiZGl2LnN1YnRpdGxlX3RleHRcIixcbiAgICAgICAgICAgbShcInBcIiwgdm0uYXV0aG9yLmZpcnN0X25hbWUoKSArIFwiIFwiICsgdm0uYXV0aG9yLmxhc3RfbmFtZSgpKSk7XG59O1xuXG52YXIgcG9zdEJvZHkgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIG0oXCJkaXYucG9zdF90ZXh0XCIsXG4gICAgICAgICAgIHsgaW5uZXJIVE1MOiB2bS5ib2R5KCkgfSk7XG59O1xuXG4vKiBFRElUSU5HICovXG5cbnZhciBwb3N0VGl0bGVGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgnaW5wdXQnLCAndGV4dCcsICd0aXRsZScsIHZtKTtcbn07XG5cbnZhciBwb3N0Qm9keUZpZWxkID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUZpZWxkKCd0ZXh0YXJlYScsIG51bGwsICdib2R5Jywgdm0pO1xufTtcblxudmFyIHBvc3RBdXRob3JGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gbSgnZGl2LmZvcm1fZ3JvdXAnLFxuICAgICAgICAgICBtKCdpbnB1dCcsIHtpZDonYXV0aG9yLWlkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6J2Rpc3BsYXk6bm9uZTsnLFxuICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTp2bS5hdXRob3IuaWQoKX0pKTtcbn07XG5cbnZhciBwb3N0Rm9ybSA9IENvbW1vbi52aWV3cy5mb3JtQnVpbGRlcihbcG9zdFRpdGxlRmllbGQsIHBvc3RCb2R5RmllbGRdKTtcblxuLyogVklFV1MgKi9cblxuWC52aWV3cyA9IHt9O1xuXG5YLnZpZXdzLnBvc3RFZGl0Rm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gcG9zdEZvcm0oJ3Bvc3RFZGl0JyxcbiAgICAgICAgICAgICAgICAgIHZtLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhWydhdXRob3ItaWQnXSA9IHZtLmF1dGhvci5pZCgpO1xuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YVsnaWQnXSA9IHZtLmlkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBYLm1vZGVsLmVkaXQoZm9ybURhdGEpO1xuICAgICAgICAgICAgICAgICAgfSk7XG59O1xuXG5YLnZpZXdzLnBvc3RDcmVhdGVGb3JtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBwb3N0Rm9ybSgncG9zdEVkaXQnLFxuICAgICAgICAgICAgICAgICAgdm0sXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGFbJ2F1dGhvci1pZCddID0gdm0uYXV0aG9yLmlkKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBYLm1vZGVsLm5ldyhmb3JtRGF0YSk7XG4gICAgICAgICAgICAgICAgICB9KTtcbn07XG5cblgudmlld3MucHJldmlldyA9IHBvc3REaXNwbGF5KCdwcmV2aWV3JywgW3Bvc3RIZWFkZXIsIHBvc3RCb2R5XSk7XG5cblgudmlld3MuZnVsbCA9IHBvc3REaXNwbGF5KCdmdWxsX3ZpZXcnLCBbcG9zdEhlYWRlciwgcG9zdEJvZHldKTtcblxuWC52aWV3cy5uZXcgPSBwb3N0RGlzcGxheSgnZnVsbF92aWV3JywgW1gudmlld3MucG9zdENyZWF0ZUZvcm1dKTtcblxuWC52aWV3cy5lZGl0ID0gcG9zdERpc3BsYXkoJ2Z1bGxfdmlldycsIFtYLnZpZXdzLnBvc3RFZGl0Rm9ybV0pO1xuIiwidmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBWSUVXIE1PREVMUyAqL1xuXG5YLnZtcyA9IHt9O1xuXG5YLnZtcy50YWcgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcbiAgICB0aGlzW2tleV0gPSBtLnByb3AocGFyYW1zW2tleV0pO1xuICB9XG59O1xuIiwidmFyIENvbW1vbiA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG52YXIgWCA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8qIE1PREVMUyAqL1xuWC5tb2RlbCA9IHt9O1xuXG5YLm1vZGVsLm5ldyA9IGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICByZXR1cm4gIG0ucmVxdWVzdCh7bWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvdXNlcnMvbmV3JyxcbiAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGZvcm1EYXRhfSk7XG59O1xuXG5YLm1vZGVsLmRlbGV0ZSA9IGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuXG59O1xuXG5YLm1vZGVsLmxvZ291dCA9IGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICByZXR1cm4gbS5yZXF1ZXN0KHttZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9hdXRoL2xvZ291dCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZzogQ29tbW9uLm1vZGVsLnNldEFKQVhUb2tlblxuICAgICAgICAgICAgICAgICAgIH0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIHNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG4gICAgICBtLnJvdXRlKCcvJyk7XG4gICAgfSk7XG59O1xuXG5YLm1vZGVsLmxvZ2luID0gZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gIHJldHVybiBtLnJlcXVlc3Qoe21ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2F1dGgvbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBmb3JtRGF0YVxuICAgICAgICAgICAgICAgICAgIH0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgQ29tbW9uLm1vZGVsLnNldFRva2VuKHJlc3AudG9rZW4pO1xuICAgICAgWC5tb2RlbC50b1N0b3JhZ2UocmVzcC51c2VyKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICBzZXNzaW9uU3RvcmFnZS5jbGVhcigpO1xuICAgICAgbS5yb3V0ZSgnLycpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5lbXB0eVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAgbmV3IFgudm1zLnVzZXIoeydlbWFpbCc6JycsICdmaXJzdC1uYW1lJzogJycsICdsYXN0LW5hbWUnOicnLCAncGFzc3dvcmQnOicnfSk7XG59O1xuXG5YLm1vZGVsLnRvU3RvcmFnZSA9IGZ1bmN0aW9uICh1c2VyKSB7XG4gIGZvciAodmFyIHBhcmFtIGluIHVzZXIpIHtcbiAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKHBhcmFtLCBKU09OLnN0cmluZ2lmeSh1c2VyW3BhcmFtXSkpO1xuICB9XG59O1xuXG5YLm1vZGVsLmZyb21TdG9yYWdlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdG1wID0gWydmaXJzdF9uYW1lJywgJ2xhc3RfbmFtZScsICdlbWFpbCcsICdpZCddLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBwYXJhbSkge1xuICAgIHZhciB2YWwgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKHBhcmFtKTtcbiAgICBpZiAoYWNjICYmIHZhbCkge1xuICAgICAgYWNjW3BhcmFtXSA9IHZhbDtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfVxuICAgIGVsc2UgcmV0dXJuIG51bGw7XG4gIH0sIHt9KTtcblxuICBpZiAodG1wKSByZXR1cm4gbmV3IFgudm1zLnVzZXIodG1wKTtcbiAgZWxzZSByZXR1cm4gbnVsbDtcbn07XG5cbi8qIENPTlRST0xMRVJTICovXG5cblguY29udHJvbGxlcnMgPSB7fTtcblxuWC5jb250cm9sbGVycy5sb2dpbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB1c2VyOiBtLnByb3AoWC5tb2RlbC5lbXB0eVVzZXIoKSlcbiAgfTtcbn07XG5cblguY29udHJvbGxlcnMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdXNlciA9IFgubW9kZWwuZnJvbVN0b3JhZ2UoKTtcbiAgaWYgKCF1c2VyKSBtLnJvdXRlKCcvJyk7XG4gIHJldHVybiB7XG4gICAgdXNlcjogbS5wcm9wKHVzZXIpXG4gIH07XG59O1xuXG4vKiBWSUVXIE1PREVMUyAqL1xuXG5YLnZtcyA9IHt9O1xuXG5YLnZtcy51c2VyID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgdGhpc1trZXldID0gbS5wcm9wKHBhcmFtc1trZXldKTtcbiAgfVxufTtcblxuLyogVklFV1MgKi9cblxuWC52aWV3cyA9IHt9O1xuXG52YXIgdXNlck5hbWVGaWVsZCA9IGZ1bmN0aW9uIChuYW1lVHlwZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHZtKSB7XG4gICAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtRmllbGQoJ2lucHV0JywgJ3RleHQnLCBuYW1lVHlwZSsnLW5hbWUnLCB2bSk7XG4gIH07XG59O1xuXG52YXIgZW1haWxGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgnaW5wdXQnLCAndGV4dCcsICdlbWFpbCcsIHZtKTtcbn07XG5cbnZhciBwYXNzd29yZEZpZWxkID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUZpZWxkKCdpbnB1dCcsICd0ZXh0JywgJ3Bhc3N3b3JkJywgdm0pO1xufTtcblxuWC52aWV3cy5sb2dJbkZvcm0gPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtQnVpbGRlcihcbiAgICBbZW1haWxGaWVsZCwgcGFzc3dvcmRGaWVsZF0pKFxuICAgICdsb2dpbkZvcm0nLCB2bSxcbiAgICBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgICAgIHJldHVybiBYLm1vZGVsLmxvZ2luKGZvcm1EYXRhKTtcbiAgICB9KTtcbn07XG5cblgudmlld3MubG9nT3V0Rm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1CdWlsZGVyKFtcbiAgICBmdW5jdGlvbiAodm0pIHtcbiAgICAgIHJldHVybiBtKCdkaXYnLCAnQ2xpY2sgU3VibWl0IHRvIExvZ291dCcpO1xuICAgIH1dKShcbiAgICAnbG9nb3V0Rm9ybScsIHZtLFxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICByZXR1cm4gWC5tb2RlbC5sb2dvdXQoZGF0YSk7XG4gIH0pO1xufTtcblxuWC52aWV3cy5jcmVhdGVGb3JtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUJ1aWxkZXIoXG4gICAgW3VzZXJOYW1lRmllbGQoJ2ZpcnN0JyksIHVzZXJOYW1lRmllbGQoJ2xhc3QnKSwgZW1haWxGaWVsZCwgcGFzc3dvcmRGaWVsZF0pKFxuICAgICduZXdGb3JtJywgdm0sXG4gICAgZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gICAgICByZXR1cm4gWC5tb2RlbC5uZXcoZm9ybURhdGEpO1xuICAgIH0pO1xufTtcblxuWC52aWV3cy5sb2dpbiA9IGZ1bmN0aW9uIChjdGwpIHtcbiAgY29uc29sZS5sb2coY3RsLnVzZXIoKSk7XG4gIHJldHVybiBYLnZpZXdzLmxvZ0luRm9ybShjdGwudXNlcigpKTtcbn07XG5cblgudmlld3MubG9nb3V0ID0gZnVuY3Rpb24gKGN0bCkge1xuICByZXR1cm4gWC52aWV3cy5sb2dPdXRGb3JtKGN0bC51c2VyKCkpO1xufTtcblxuWC52aWV3cy5jcmVhdGUgPSBmdW5jdGlvbiAoY3RsKSB7XG4gIHJldHVybiBYLnZpZXdzLmNyZWF0ZUZvcm0oY3RsLnVzZXIoKSk7XG59O1xuIiwidmFyIFVzZXJzID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL3VzZXJzJyk7XG52YXIgUG9zdHMgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvcG9zdHMnKTtcbnZhciBhcHBBbmNob3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJyk7XG5cbnZhciBMb2dJbiA9IHtcbiAgY29udHJvbGxlcjogZnVuY3Rpb24gKCkge1xuICB9LFxuICB2aWV3OiBmdW5jdGlvbiAoY3RsKSB7XG4gIH1cbn07XG5cbnZhciBJbmRleCA9IHtcbiAgY29udHJvbGxlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdGwgPSB7cG9zdHM6IG0ucHJvcChuZXcgUG9zdHMudm1zLmxpc3QoW10pKX07XG4gICAgUG9zdHMubW9kZWwuYWxsKCkudGhlbihmdW5jdGlvbiAocG9zdHMpIHtcbiAgICAgIGN0bC5wb3N0cyhwb3N0cyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGN0bDtcbiAgfSxcbiAgdmlldzogZnVuY3Rpb24gKGN0bCkge1xuICAgIGNvbnNvbGUubG9nKGN0bC5wb3N0cygpLml0ZW1zKCkpO1xuICAgIHJldHVybiBjdGwucG9zdHMoKS5pdGVtcygpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgcmV0dXJuIFBvc3RzLnZpZXdzLnByZXZpZXcocCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbm0ucm91dGUubW9kZSA9ICdwYXRobmFtZSc7XG5cbm0ucm91dGUoYXBwQW5jaG9yLCAnLycsIHtcbiAgICAnLyc6IEluZGV4XG4gICwgJy9jb250ZW50LzppZCc6IHsgY29udHJvbGxlcjogUG9zdHMuY29udHJvbGxlcnMuZnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICB2aWV3OiBmdW5jdGlvbiAoY3RsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUG9zdHMudmlld3MuZnVsbChjdGwucG9zdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgLCAnL2xvZ2luJzogeyBjb250cm9sbGVyOiBVc2Vycy5jb250cm9sbGVycy5sb2dpbixcbiAgICAgICAgICAgICAgICB2aWV3OiBVc2Vycy52aWV3cy5sb2dpbiB9XG4gICwgJy9sb2dvdXQnOiB7IGNvbnRyb2xsZXI6IFVzZXJzLmNvbnRyb2xsZXJzLmxvZ291dCxcbiAgICAgICAgICAgICAgICAgdmlldzogVXNlcnMudmlld3MubG9nb3V0IH1cbiAgLCAnL3Bvc3RzL25ldycgOiB7IGNvbnRyb2xsZXI6IFBvc3RzLmNvbnRyb2xsZXJzLm5ldyxcbiAgICAgICAgICAgICAgICAgICAgIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBvc3RzLnZpZXdzLm5ldyhjdGwucG9zdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICB9XG4gICwgJy9wb3N0cy9lZGl0LzppZCcgOiB7IGNvbnRyb2xsZXI6IFBvc3RzLmNvbnRyb2xsZXJzLmVkaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUG9zdHMudmlld3MuZWRpdChjdGwucG9zdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxufSk7XG4iXX0=
