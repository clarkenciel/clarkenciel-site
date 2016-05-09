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
           vm.body());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL2Jpbi9ub2RlLXY1LjQuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb21wb25lbnRzL2NvbW1vbi5qcyIsImNvbXBvbmVudHMvcG9zdHMuanMiLCJjb21wb25lbnRzL3RhZ3MuanMiLCJjb21wb25lbnRzL3VzZXJzLmpzIiwic291cmNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBDb21tb24gbW9kZWwgc3R1ZmYgKi9cblgubW9kZWwgPSB7fTtcblxuWC5tb2RlbC5zZXRUb2tlbiA9IGZ1bmN0aW9uICh0b2spIHtcbiAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCB0b2spO1xufTtcblxuWC5tb2RlbC5nZXRUb2tlbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJykgfHwgbnVsbDtcbn07XG5cblgubW9kZWwuc2V0QUpBWFRva2VuID0gZnVuY3Rpb24gKHJlcSkge1xuICB2YXIgdG9rZW4gPSBYLm1vZGVsLmdldFRva2VuKCk7XG4gIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgJ1Rva2VuICcgKyB0b2tlbik7XG59O1xuXG5cbi8qIENvbW1vbiBWaWV3IHN0dWZmICovXG5YLnZpZXdzID0ge307XG5cblgudmlld3MuZ2V0Rm9ybVZhbHVlcyA9IGZ1bmN0aW9uIChmb3JtSWQpIHtcbiAgdmFyIGZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmb3JtSWQpO1xuICB2YXIgaW5wdXRzID0gW10uc2xpY2UuY2FsbChmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpKS5cbiAgICAgICAgZmlsdGVyKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gaW5wdXQudHlwZSAhPT0gJ3N1Ym1pdCc7IH0pO1xuICB2YXIgdGV4dGFyZWFzID0gW10uc2xpY2UuY2FsbChmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCd0ZXh0YXJlYScpKTtcbiAgdmFyIGRhdGEgPSBpbnB1dHMuY29uY2F0KHRleHRhcmVhcykucmVkdWNlKGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICBhY2NbeC5uYW1lXSA9IHgudmFsdWU7XG4gICAgcmV0dXJuIGFjYztcbiAgfSwge30pO1xuICByZXR1cm4gZGF0YTtcbn07XG5cblgudmlld3MuZm9ybUZpZWxkID0gZnVuY3Rpb24gKGVsZSwgdHlwZSwgYXR0ciwgdm0pIHtcbiAgcmV0dXJuIG0oJ2Rpdi5mb3JtX2dyb3VwJyxcbiAgICAgICAgICAgW20oJ2xhYmVsJywge2ZvcjphdHRyfSwgYXR0cisnOiAnKSxcbiAgICAgICAgICAgIG0oJ2JyJyksXG4gICAgICAgICAgICBtKGVsZSwge2lkOmF0dHIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6dHlwZSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTphdHRyLFxuICAgICAgICAgICAgICAgICAgICBvbmlucHV0OiBtLndpdGhBdHRyKCd2YWx1ZScsIHZtW2F0dHJdKSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZtW2F0dHJdKCl9KV0pO1xufTtcblxuWC52aWV3cy5mb3JtQnVpbGRlciA9IGZ1bmN0aW9uIChmb3JtQ29tcG9uZW50cykge1xuICByZXR1cm4gZnVuY3Rpb24gKGZvcm1JZCwgdm0sIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIG0oJ2Rpdi5mb3JtLmhvbGRlcicsXG4gICAgICAgICAgICAgbSgnZGl2LmZvcm0uY29udGVudHMnLFxuICAgICAgICAgICAgICAgbSgnZm9ybSMnICsgZm9ybUlkLFxuICAgICAgICAgICAgICAgICBbZm9ybUNvbXBvbmVudHMubWFwKGZ1bmN0aW9uIChmKSB7IHJldHVybiBmKHZtKTsgfSksXG4gICAgICAgICAgICAgICAgICBYLnZpZXdzLnN1Ym1pdEJ1dHRvbihmb3JtSWQsIGNhbGxiYWNrKV0pKSk7XG4gIH07XG59O1xuXG5YLnZpZXdzLnN1Ym1pdEJ1dHRvbiA9IGZ1bmN0aW9uIChmb3JtSWQsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBtKCdkaXYuZm9ybV9ncm91cCcsXG4gICAgICAgICAgIG0oJ2lucHV0JyxcbiAgICAgICAgICAgICB7IHR5cGU6J3N1Ym1pdCcsXG4gICAgICAgICAgICAgICBuYW1lOidzdWJtaXQnLFxuICAgICAgICAgICAgICAgdmFsdWU6J1N1Ym1pdCcsXG4gICAgICAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBYLnZpZXdzLmdldEZvcm1WYWx1ZXMoZm9ybUlkKTtcbiAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfSkpO1xufTtcbiIsInZhciBDb21tb24gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFVzZXJzID0gcmVxdWlyZSgnLi91c2Vycy5qcycpO1xudmFyIFRhZ3MgPSByZXF1aXJlKCcuL3RhZ3MuanMnKTtcbnZhciBYID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLyogTU9ERUwgKi9cblxuWC5tb2RlbCA9IHt9O1xuXG5YLm1vZGVsLmdldCA9IGZ1bmN0aW9uIChwb3N0SWQpIHtcbiAgY29uc29sZS5sb2cocG9zdElkKTtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7IG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3Bvc3RzLycrcG9zdElkIH0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHJldHVybiBuZXcgWC52bXMucG9zdChkYXRhLnBvc3QpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICB9KTtcbn07XG5cblgubW9kZWwuYWxsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbS5yZXF1ZXN0KHsgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvcG9zdHMnIH0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuICAgICAgcmV0dXJuIG5ldyBYLnZtcy5saXN0KFxuICAgICAgICByZXNwLnBvc3RzLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgIHJldHVybiBuZXcgWC52bXMucG9zdChwKTtcbiAgICAgICAgfSkpO1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICB9KTtcbn07XG5cblgubW9kZWwuZm9yVXNlciA9IGZ1bmN0aW9uICh1c2VySWQpIHtcblxufTtcblxuWC5tb2RlbC5mb3JUYWcgPSBmdW5jdGlvbiAodGFnTmFtZSkge1xuXG59O1xuXG5YLm1vZGVsLm5ldyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIGNvbnNvbGUubG9nKGRhdGEpO1xuICByZXR1cm4gbS5yZXF1ZXN0KHsgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvcG9zdHMvbmV3JyxcbiAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgJ3RpdGxlJzogZGF0YS50aXRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JvZHknOiAgZGF0YS5ib2R5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYXV0aG9yLWlkJzogZGF0YVsnYXV0aG9yLWlkJ10gfSxcbiAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogQ29tbW9uLm1vZGVsLnNldEFKQVhUb2tlbn0pLlxuICAgIHRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdyZXNwb25zZScsIHJlc3ApO1xuICAgIH0pLlxuICAgIGNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnZXJyb3InLCBlKTtcbiAgICB9KTsgIFxufTtcblxuWC5tb2RlbC5lZGl0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgY29uc29sZS5sb2coZGF0YSk7XG4gIHJldHVybiBtLnJlcXVlc3QoeyBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvcG9zdHMvdXBkYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgJ2lkJzogZGF0YS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RpdGxlJzogZGF0YS50aXRsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JvZHknOiBkYXRhLmJvZHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhdXRob3ItaWQnOiBkYXRhWydhdXRob3ItaWQnXSB9LFxuICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBDb21tb24ubW9kZWwuc2V0QUpBWFRva2VuIH0pO1xufTtcblxuLyogVklFVyBNT0RFTFMgKi9cblxuWC52bXMgPSB7fTtcblxuWC52bXMucG9zdCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuICAgIGlmIChrZXkgPT09ICdhdXRob3InKSB7XG4gICAgICB0aGlzW2tleV0gPSBuZXcgVXNlcnMudm1zLnVzZXIocGFyYW1zW2tleV0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChrZXkgPT09ICd0YWdzJykge1xuICAgICAgdGhpc1trZXldID0gbmV3IFRhZ3Mudm1zLnRhZyhwYXJhbXNba2V5XSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpc1trZXldID0gbS5wcm9wKHBhcmFtc1trZXldKTtcbiAgICB9XG4gIH07XG59O1xuXG5YLnZtcy5saXN0ID0gZnVuY3Rpb24gKGNvbGwpIHtcbiAgdGhpcy5pdGVtcyA9IG0ucHJvcChjb2xsKTtcbn07XG5cblgudm1zLmJsYW5rID0gZnVuY3Rpb24gKGF1dGhvcikge1xuICByZXR1cm4ge1xuICAgICd0aXRsZSc6IG0ucHJvcCgnJyksXG4gICAgJ2JvZHknOm0ucHJvcCgnJyksXG4gICAgJ2F1dGhvcic6IGF1dGhvciA/IGF1dGhvciA6IG51bGwsXG4gICAgJ3RhZ3MnOiBudWxsXG4gIH07XG59O1xuXG4vKiBDT05UUk9MTEVSUyAqL1xuWC5jb250cm9sbGVycyA9IHt9O1xuXG5YLmNvbnRyb2xsZXJzLmZ1bGwgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBwb3N0SWQgPSBtLnJvdXRlLnBhcmFtKCdpZCcpO1xuICByZXR1cm4ge1xuICAgIHBvc3Q6IFgubW9kZWwuZ2V0KHBvc3RJZClcbiAgfTtcbn07XG5cblguY29udHJvbGxlcnMubmV3ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXV0aG9yID0gVXNlcnMubW9kZWwuZnJvbVN0b3JhZ2UoKTtcbiAgaWYgKCFhdXRob3IpIG0ucm91dGUoJy9sb2dpbicpO1xuICByZXR1cm4ge1xuICAgIHBvc3Q6IG0ucHJvcChYLnZtcy5ibGFuayhhdXRob3IpKVxuICB9O1xufTtcblxuWC5jb250cm9sbGVycy5lZGl0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY3RsID0ge307XG4gIHZhciBhdXRob3IgPSBVc2Vycy5tb2RlbC5mcm9tU3RvcmFnZSgpO1xuICBYLm1vZGVsLmdldChtLnJvdXRlLnBhcmFtKCdpZCcpKS5cbiAgICB0aGVuKGZ1bmN0aW9uIChwb3N0KSB7XG4gICAgICBpZiAoIWF1dGhvcikgbS5yb3V0ZSgnL2xvZ2luJyk7XG4gICAgICBpZiAocG9zdC5hdXRob3IuaWQoKSAhPSBhdXRob3IuaWQoKSkgbS5yb3V0ZSgnL2xvZ2luJyk7XG4gICAgICBjdGwucG9zdCA9IG0ucHJvcChwb3N0KTtcbiAgICB9KTtcbiAgcmV0dXJuIGN0bDtcbn07XG5cbi8qIFZpZXcgSGVscGVycyAqL1xuXG4vKiBWSUVXSU5HICovXG5cbnZhciBwb3N0RGlzcGxheSA9IGZ1bmN0aW9uICh0eXBlLCBjb21wb25lbnRzKXtcbiAgcmV0dXJuIGZ1bmN0aW9uIChwb3N0KSB7XG4gICAgcmV0dXJuIG0oJ2Rpdi4nICsgdHlwZSArICcuaG9sZGVyJyxcbiAgICAgICAgICAgICBtKCdkaXYuJyArIHR5cGUgKyAnLmNvbnRlbnQnLFxuICAgICAgICAgICAgICAgbSgnYXJ0aWNsZScsXG4gICAgICAgICAgICAgICAgIGNvbXBvbmVudHMubWFwKGZ1bmN0aW9uKGYpIHsgcmV0dXJuIGYocG9zdCk7IH0pKSkpO1xuICB9O1xufTtcblxudmFyIHBvc3RIZWFkZXIgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIG0oXCJoZWFkZXJcIixcbiAgICAgICAgICAgW3Bvc3RUaXRsZSh2bSksXG4gICAgICAgICAgICBwb3N0QXV0aG9yKHZtKV0pO1xufTtcblxudmFyIHBvc3RUaXRsZSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gbShcImRpdi50aXRsZV90ZXh0XCIsXG4gICAgICAgICAgIG0oXCJ0aXRsZVwiLCB2bS50aXRsZSkpO1xufTtcblxudmFyIHBvc3RBdXRob3IgPSBmdW5jdGlvbiAodm0pIHtcbiAgY29uc29sZS5sb2codm0pO1xuICByZXR1cm4gbShcImRpdi5zdWJ0aXRsZV90ZXh0XCIsXG4gICAgICAgICAgIG0oXCJwXCIsIHZtLmF1dGhvci5maXJzdF9uYW1lKCkgKyBcIiBcIiArIHZtLmF1dGhvci5sYXN0X25hbWUoKSkpO1xufTtcblxudmFyIHBvc3RCb2R5ID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBtKFwiZGl2LnBvc3RfdGV4dFwiLFxuICAgICAgICAgICB2bS5ib2R5KCkpO1xufTtcblxuLyogRURJVElORyAqL1xuXG52YXIgcG9zdFRpdGxlRmllbGQgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtRmllbGQoJ2lucHV0JywgJ3RleHQnLCAndGl0bGUnLCB2bSk7XG59O1xuXG52YXIgcG9zdEJvZHlGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgndGV4dGFyZWEnLCBudWxsLCAnYm9keScsIHZtKTtcbn07XG5cbnZhciBwb3N0QXV0aG9yRmllbGQgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIG0oJ2Rpdi5mb3JtX2dyb3VwJyxcbiAgICAgICAgICAgbSgnaW5wdXQnLCB7aWQ6J2F1dGhvci1pZCcsXG4gICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOidkaXNwbGF5Om5vbmU7JyxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6dm0uYXV0aG9yLmlkKCl9KSk7XG59O1xuXG52YXIgcG9zdEZvcm0gPSBDb21tb24udmlld3MuZm9ybUJ1aWxkZXIoW3Bvc3RUaXRsZUZpZWxkLCBwb3N0Qm9keUZpZWxkXSk7XG5cbi8qIFZJRVdTICovXG5cblgudmlld3MgPSB7fTtcblxuWC52aWV3cy5wb3N0RWRpdEZvcm0gPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIHBvc3RGb3JtKCdwb3N0RWRpdCcsXG4gICAgICAgICAgICAgICAgICB2bSxcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtRGF0YVsnYXV0aG9yLWlkJ10gPSB2bS5hdXRob3IuaWQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9ybURhdGFbJ2lkJ10gPSB2bS5pZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWC5tb2RlbC5lZGl0KGZvcm1EYXRhKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xufTtcblxuWC52aWV3cy5wb3N0Q3JlYXRlRm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gcG9zdEZvcm0oJ3Bvc3RFZGl0JyxcbiAgICAgICAgICAgICAgICAgIHZtLFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhWydhdXRob3ItaWQnXSA9IHZtLmF1dGhvci5pZCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWC5tb2RlbC5uZXcoZm9ybURhdGEpO1xuICAgICAgICAgICAgICAgICAgfSk7XG59O1xuXG5YLnZpZXdzLnByZXZpZXcgPSBwb3N0RGlzcGxheSgncHJldmlldycsIFtwb3N0SGVhZGVyLCBwb3N0Qm9keV0pO1xuXG5YLnZpZXdzLmZ1bGwgPSBwb3N0RGlzcGxheSgnZnVsbF92aWV3JywgW3Bvc3RIZWFkZXIsIHBvc3RCb2R5XSk7XG5cblgudmlld3MubmV3ID0gcG9zdERpc3BsYXkoJ2Z1bGxfdmlldycsIFtYLnZpZXdzLnBvc3RDcmVhdGVGb3JtXSk7XG5cblgudmlld3MuZWRpdCA9IHBvc3REaXNwbGF5KCdmdWxsX3ZpZXcnLCBbWC52aWV3cy5wb3N0RWRpdEZvcm1dKTtcbiIsInZhciBYID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLyogVklFVyBNT0RFTFMgKi9cblxuWC52bXMgPSB7fTtcblxuWC52bXMudGFnID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG4gICAgdGhpc1trZXldID0gbS5wcm9wKHBhcmFtc1trZXldKTtcbiAgfVxufTtcbiIsInZhciBDb21tb24gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xudmFyIFggPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vKiBNT0RFTFMgKi9cblgubW9kZWwgPSB7fTtcblxuWC5tb2RlbC5uZXcgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgcmV0dXJuICBtLnJlcXVlc3Qoe21ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3VzZXJzL25ldycsXG4gICAgICAgICAgICAgICAgICAgICBkYXRhOiBmb3JtRGF0YX0pO1xufTtcblxuWC5tb2RlbC5kZWxldGUgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcblxufTtcblxuWC5tb2RlbC5sb2dvdXQgPSBmdW5jdGlvbiAoZm9ybURhdGEpIHtcbiAgcmV0dXJuIG0ucmVxdWVzdCh7bWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvYXV0aC9sb2dvdXQnLFxuICAgICAgICAgICAgICAgICAgICBjb25maWc6IENvbW1vbi5tb2RlbC5zZXRBSkFYVG9rZW5cbiAgICAgICAgICAgICAgICAgICB9KS5cbiAgICB0aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBzZXNzaW9uU3RvcmFnZS5jbGVhcigpO1xuICAgICAgbS5yb3V0ZSgnLycpO1xuICAgIH0pO1xufTtcblxuWC5tb2RlbC5sb2dpbiA9IGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICByZXR1cm4gbS5yZXF1ZXN0KHttZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9hdXRoL2xvZ2luJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZm9ybURhdGFcbiAgICAgICAgICAgICAgICAgICB9KS5cbiAgICB0aGVuKGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBjb25zb2xlLmxvZyhyZXNwKTtcbiAgICAgIENvbW1vbi5tb2RlbC5zZXRUb2tlbihyZXNwLnRva2VuKTtcbiAgICAgIFgubW9kZWwudG9TdG9yYWdlKHJlc3AudXNlcik7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgc2Vzc2lvblN0b3JhZ2UuY2xlYXIoKTtcbiAgICAgIG0ucm91dGUoJy8nKTtcbiAgICB9KTtcbn07XG5cblgubW9kZWwuZW1wdHlVc2VyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gIG5ldyBYLnZtcy51c2VyKHsnZW1haWwnOicnLCAnZmlyc3QtbmFtZSc6ICcnLCAnbGFzdC1uYW1lJzonJywgJ3Bhc3N3b3JkJzonJ30pO1xufTtcblxuWC5tb2RlbC50b1N0b3JhZ2UgPSBmdW5jdGlvbiAodXNlcikge1xuICBmb3IgKHZhciBwYXJhbSBpbiB1c2VyKSB7XG4gICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShwYXJhbSwgSlNPTi5zdHJpbmdpZnkodXNlcltwYXJhbV0pKTtcbiAgfVxufTtcblxuWC5tb2RlbC5mcm9tU3RvcmFnZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRtcCA9IFsnZmlyc3RfbmFtZScsICdsYXN0X25hbWUnLCAnZW1haWwnLCAnaWQnXS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgcGFyYW0pIHtcbiAgICB2YXIgdmFsID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShwYXJhbSk7XG4gICAgaWYgKGFjYyAmJiB2YWwpIHtcbiAgICAgIGFjY1twYXJhbV0gPSB2YWw7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH1cbiAgICBlbHNlIHJldHVybiBudWxsO1xuICB9LCB7fSk7XG5cbiAgaWYgKHRtcCkgcmV0dXJuIG5ldyBYLnZtcy51c2VyKHRtcCk7XG4gIGVsc2UgcmV0dXJuIG51bGw7XG59O1xuXG4vKiBDT05UUk9MTEVSUyAqL1xuXG5YLmNvbnRyb2xsZXJzID0ge307XG5cblguY29udHJvbGxlcnMubG9naW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB7XG4gICAgdXNlcjogbS5wcm9wKFgubW9kZWwuZW1wdHlVc2VyKCkpXG4gIH07XG59O1xuXG5YLmNvbnRyb2xsZXJzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVzZXIgPSBYLm1vZGVsLmZyb21TdG9yYWdlKCk7XG4gIGlmICghdXNlcikgbS5yb3V0ZSgnLycpO1xuICByZXR1cm4ge1xuICAgIHVzZXI6IG0ucHJvcCh1c2VyKVxuICB9O1xufTtcblxuLyogVklFVyBNT0RFTFMgKi9cblxuWC52bXMgPSB7fTtcblxuWC52bXMudXNlciA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuICAgIHRoaXNba2V5XSA9IG0ucHJvcChwYXJhbXNba2V5XSk7XG4gIH1cbn07XG5cbi8qIFZJRVdTICovXG5cblgudmlld3MgPSB7fTtcblxudmFyIHVzZXJOYW1lRmllbGQgPSBmdW5jdGlvbiAobmFtZVR5cGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh2bSkge1xuICAgIHJldHVybiBDb21tb24udmlld3MuZm9ybUZpZWxkKCdpbnB1dCcsICd0ZXh0JywgbmFtZVR5cGUrJy1uYW1lJywgdm0pO1xuICB9O1xufTtcblxudmFyIGVtYWlsRmllbGQgPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtRmllbGQoJ2lucHV0JywgJ3RleHQnLCAnZW1haWwnLCB2bSk7XG59O1xuXG52YXIgcGFzc3dvcmRGaWVsZCA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1GaWVsZCgnaW5wdXQnLCAndGV4dCcsICdwYXNzd29yZCcsIHZtKTtcbn07XG5cblgudmlld3MubG9nSW5Gb3JtID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBDb21tb24udmlld3MuZm9ybUJ1aWxkZXIoXG4gICAgW2VtYWlsRmllbGQsIHBhc3N3b3JkRmllbGRdKShcbiAgICAnbG9naW5Gb3JtJywgdm0sXG4gICAgZnVuY3Rpb24gKGZvcm1EYXRhKSB7XG4gICAgICByZXR1cm4gWC5tb2RlbC5sb2dpbihmb3JtRGF0YSk7XG4gICAgfSk7XG59O1xuXG5YLnZpZXdzLmxvZ091dEZvcm0gPSBmdW5jdGlvbiAodm0pIHtcbiAgcmV0dXJuIENvbW1vbi52aWV3cy5mb3JtQnVpbGRlcihbXG4gICAgZnVuY3Rpb24gKHZtKSB7XG4gICAgICByZXR1cm4gbSgnZGl2JywgJ0NsaWNrIFN1Ym1pdCB0byBMb2dvdXQnKTtcbiAgICB9XSkoXG4gICAgJ2xvZ291dEZvcm0nLCB2bSxcbiAgICBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgcmV0dXJuIFgubW9kZWwubG9nb3V0KGRhdGEpO1xuICB9KTtcbn07XG5cblgudmlld3MuY3JlYXRlRm9ybSA9IGZ1bmN0aW9uICh2bSkge1xuICByZXR1cm4gQ29tbW9uLnZpZXdzLmZvcm1CdWlsZGVyKFxuICAgIFt1c2VyTmFtZUZpZWxkKCdmaXJzdCcpLCB1c2VyTmFtZUZpZWxkKCdsYXN0JyksIGVtYWlsRmllbGQsIHBhc3N3b3JkRmllbGRdKShcbiAgICAnbmV3Rm9ybScsIHZtLFxuICAgIGZ1bmN0aW9uIChmb3JtRGF0YSkge1xuICAgICAgcmV0dXJuIFgubW9kZWwubmV3KGZvcm1EYXRhKTtcbiAgICB9KTtcbn07XG5cblgudmlld3MubG9naW4gPSBmdW5jdGlvbiAoY3RsKSB7XG4gIGNvbnNvbGUubG9nKGN0bC51c2VyKCkpO1xuICByZXR1cm4gWC52aWV3cy5sb2dJbkZvcm0oY3RsLnVzZXIoKSk7XG59O1xuXG5YLnZpZXdzLmxvZ291dCA9IGZ1bmN0aW9uIChjdGwpIHtcbiAgcmV0dXJuIFgudmlld3MubG9nT3V0Rm9ybShjdGwudXNlcigpKTtcbn07XG5cblgudmlld3MuY3JlYXRlID0gZnVuY3Rpb24gKGN0bCkge1xuICByZXR1cm4gWC52aWV3cy5jcmVhdGVGb3JtKGN0bC51c2VyKCkpO1xufTtcbiIsInZhciBVc2VycyA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy91c2VycycpO1xudmFyIFBvc3RzID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL3Bvc3RzJyk7XG52YXIgYXBwQW5jaG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpO1xuXG52YXIgTG9nSW4gPSB7XG4gIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgpIHtcbiAgfSxcbiAgdmlldzogZnVuY3Rpb24gKGN0bCkge1xuICB9XG59O1xuXG52YXIgSW5kZXggPSB7XG4gIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3RsID0ge3Bvc3RzOiBtLnByb3AobmV3IFBvc3RzLnZtcy5saXN0KFtdKSl9O1xuICAgIFBvc3RzLm1vZGVsLmFsbCgpLnRoZW4oZnVuY3Rpb24gKHBvc3RzKSB7XG4gICAgICBjdGwucG9zdHMocG9zdHMpO1xuICAgIH0pO1xuICAgIHJldHVybiBjdGw7XG4gIH0sXG4gIHZpZXc6IGZ1bmN0aW9uIChjdGwpIHtcbiAgICBjb25zb2xlLmxvZyhjdGwucG9zdHMoKS5pdGVtcygpKTtcbiAgICByZXR1cm4gY3RsLnBvc3RzKCkuaXRlbXMoKS5tYXAoZnVuY3Rpb24gKHApIHtcbiAgICAgIHJldHVybiBQb3N0cy52aWV3cy5wcmV2aWV3KHApO1xuICAgIH0pO1xuICB9XG59O1xuXG5tLnJvdXRlLm1vZGUgPSAncGF0aG5hbWUnO1xuXG5tLnJvdXRlKGFwcEFuY2hvciwgJy8nLCB7XG4gICAgJy8nOiBJbmRleFxuICAsICcvY29udGVudC86aWQnOiB7IGNvbnRyb2xsZXI6IFBvc3RzLmNvbnRyb2xsZXJzLmZ1bGwsXG4gICAgICAgICAgICAgICAgICAgICAgdmlldzogZnVuY3Rpb24gKGN0bCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBvc3RzLnZpZXdzLmZ1bGwoY3RsLnBvc3QoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICwgJy9sb2dpbic6IHsgY29udHJvbGxlcjogVXNlcnMuY29udHJvbGxlcnMubG9naW4sXG4gICAgICAgICAgICAgICAgdmlldzogVXNlcnMudmlld3MubG9naW4gfVxuICAsICcvbG9nb3V0JzogeyBjb250cm9sbGVyOiBVc2Vycy5jb250cm9sbGVycy5sb2dvdXQsXG4gICAgICAgICAgICAgICAgIHZpZXc6IFVzZXJzLnZpZXdzLmxvZ291dCB9XG4gICwgJy9wb3N0cy9uZXcnIDogeyBjb250cm9sbGVyOiBQb3N0cy5jb250cm9sbGVycy5uZXcsXG4gICAgICAgICAgICAgICAgICAgICB2aWV3OiBmdW5jdGlvbiAoY3RsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQb3N0cy52aWV3cy5uZXcoY3RsLnBvc3QoKSk7XG4gICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgfVxuICAsICcvcG9zdHMvZWRpdC86aWQnIDogeyBjb250cm9sbGVyOiBQb3N0cy5jb250cm9sbGVycy5lZGl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiBmdW5jdGlvbiAoY3RsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBvc3RzLnZpZXdzLmVkaXQoY3RsLnBvc3QoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbn0pO1xuIl19
