(ns clarkenciel-site.middleware
  (:require [ring.middleware.json :refer [wrap-json-params wrap-json-response]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.resource :refer [wrap-resource]]
            [clarkenciel-site.routes :as r]))

(def wrapped-app
  (-> r/app-routes
      (wrap-session)
      (wrap-json-params)
      (wrap-json-response)))
