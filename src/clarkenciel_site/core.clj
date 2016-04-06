(ns clarkenciel-site.core
  (:gen-class)
  (:require [clarkenciel-site.middleware :refer [wrapped-app]]
            [aleph.http :refer [start-server]]
            [clojure.tools.cli :refer [parse-opts]]))

(defn app [port]
  (start-server #'wrapped-app {:port port}))

(def cli-options
  [["-p" "--port PORT" "Port number"
    :default 42
    :parse-fn #(Integer/parseInt %)
    :validate [#(< 0 % 0x10000) "Must be number between 0 and 65536"]]
   ["-h" "--help"]])

(defn -main [& args]
  (let [{{:keys [port help]} :options errors :errors} (parse-opts args cli-options)]
    (cond
      help (println "java -jar clarkenciel-site -p PORTNUMBER")

      (not (nil? errors))
      (doseq [e errors] (println e))

      (nil? port)
      (println "Please provide a port number")
      
      :else
      (do (println "running on port:" port)
          (app port)))))
