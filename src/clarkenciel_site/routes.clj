(ns clarkenciel-site.routes
  (:require [compojure.core :refer [GET POST PUT DELETE routes]]
            [clarkenciel-site.handlers :as h]))

(def app-routes
  (routes
   (GET "*" [] h/home-page-handler)))
