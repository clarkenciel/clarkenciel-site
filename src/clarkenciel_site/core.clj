(ns clarkenciel-site.core
  (:gen-class)
  (:require [clarkenciel-site.middleware :refer [wrapped-app]]
            [aleph.http :refer [start-server]]))

(defn app [port]
  (start-server #'wrapped-app {:port port}))

(defn -main [& args]
  (println "running on port:" 10001)
  (app 10001)
  )
