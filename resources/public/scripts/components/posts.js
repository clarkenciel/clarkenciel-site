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
