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
