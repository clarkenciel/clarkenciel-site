(ns clarkenciel-site.routes
  (:require [compojure.core :refer [GET POST PUT DELETE routes context]]
            [clarkenciel-site.handlers :as h]))

;; TODO: revisit these routes to make them easier to block with authorization
(def post-routes
  (routes
   (context "/api/posts" []
            (GET "/" []
                 h/all-posts-handler)            
            (GET "/for_tag/:tag-name" [tag-name]
                 (h/tag-posts-handler tag-name))
            (GET "/for_user/:user-name" [user-name]
                 (h/user-posts-handler user-name))
            (POST "/new_post" req
                  (h/add-post-handler req))
            (PUT "/update_post/:post-id" [post-id :as req]
                 (h/update-post-handler post-id req))
            (GET "/:post-id" [post-id]
                 (h/get-post-handler post-id)))))

(def user-routes
  (routes
   (context "/api/users" []
            (GET "/" []
                 h/all-users-handler)
            (GET "/:user-email-or-id" [user-email-or-id]
                 (h/get-user-handler user-email-or-id))
            (POST "/new_user" req
                  (h/add-user-handler req))
            (PUT "/update_user/:user-id" [user-id :as req]
                 (h/update-user-handler user-id req)))))

(def auth-routes
  (routes
   (context "/api/auth" []
            (POST "/login" req
                  (h/login-handler req))
            (POST "/logout" req
                  (h/logout-handler req)))))

(def app-routes
  (routes
   
   (GET "*" [] h/home-page-handler)))
