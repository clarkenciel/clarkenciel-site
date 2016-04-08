(ns clarkenciel-site.db.core
  (:require [conman.core :as conman]
            [mount.core :refer [defstate]]
            [environ.core :refer [env]]))

(def pool-spec
  {:adapter :postgresql
   :init-size 1
   :min-idle 1
   :max-idle 4
   :max-active 32
   :jdbc-url (:database-url env)})

(defstate ^:dynamic *db*
  :start (conman/connect! pool-spec)
  :stop (conman/disconnect! *db*))

(conman/bind-connection *db* "sql/queries.sql")
