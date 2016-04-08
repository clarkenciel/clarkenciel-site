(ns clarkenciel-site.db.core
  (:require [mount.core :as mount]
            [conman.core :as conman]
            [environ.core :refer [env]]))

(def pool-spec
  {:adapter :postgresql
   :init-size 1
   :min-idle 1
   :max-idle 4
   :max-active 32
   :jdbc-url ()})
