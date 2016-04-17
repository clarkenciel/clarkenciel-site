(ns clarkenciel-site.handlers
  (:require [ring.util.response :refer [response]]))

(defn home-page-handler [request]
  (response (slurp (clojure.java.io/resource "app/index.html"))))

(defn all-posts-handler [request]
  )

(defn tag-posts-handler [tag-name])

(defn user-posts-handler [user-name])

(defn add-post-handler [request])

(defn update-post-handler [post-id request])

(defn get-post-handler [post-id])

(defn all-users-handler [])

(defn get-user-handler [user-email-or-id])

(defn add-user-handler [request])

(defn update-user-handler [user-id request])

(defn login-handler [req])

(defn logout-handler [req])
