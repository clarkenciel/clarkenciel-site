(ns clarkenciel-site.routes
  (:require [compojure.core :refer [GET POST PUT DELETE routes context]]
            [compojure.route :refer [resources]]
            [buddy.auth.accessrules :as access]
            [buddy.auth.middleware :refer [wrap-authentication]]
            [clarkenciel-site.auth :as auth]            
            [clarkenciel-site.handlers :as h]))

(def public-routes
  (routes
   (context "/api/auth" []            
            (POST "/login" req
                  (h/login-handler req)))
   (context "/api/posts" []
            (GET "/" []
                 h/all-posts-handler)
            (GET "/for_tag/:tag-name" [tag-name]
                 (h/posts-for-tag-handler tag-name))
            (GET "/for_user/:identifier" [identifier]
                 (h/posts-for-user-handler identifier))
            (GET "/:post-id" [post-id]
                 (h/get-post-handler post-id)))))

(def secured-routes
  (access/restrict
   (routes
    (context "/api/users" []
             (GET "/" [] h/all-users-handler)
             (PUT "/new" req h/create-user-handler)
             (DELETE "/remove/:user-name" [user-name :as req] h/remove-user-handler)
             (GET "/:id" [id] h/get-user-handler))
    (context "/api/posts" []
             (PUT "/new" req h/add-post-handler)
             (POST "/update" req h/update-post-handler))   
    (context "/api/auth" []
             (POST "/logout" req h/logout-handler)))
   {:handler auth/authenticate-token
    :on-error h/unauthorized-handler}))

(defn app-routes []
  (routes
   (resources "/")
   public-routes
   (GET "*" [] h/home-page-handler)
   
   secured-routes))
