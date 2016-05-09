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
