(ns clarkenciel-site.middleware
  (:require [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.resource :refer [wrap-resource]]

            [clarkenciel-site.routes :as r]))

(defn wrapped-app []
  (-> (r/app-routes)      
      (wrap-session)
      (wrap-json-body)
      (wrap-resource "/")
      (wrap-json-response)))
