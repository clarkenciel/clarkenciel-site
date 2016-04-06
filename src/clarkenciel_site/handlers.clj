(ns clarkenciel-site.handlers
  (:require [ring.util.response :refer [response]]))

(defn home-page-handler [request]
  (response (slurp (clojure.java.io/resource "app/index.html"))))
