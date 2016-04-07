(defproject clarkenciel-site "0.1.0"
  :description "Personal site of Danny Clarke"
  :url "http://clarkenciel.com"
  :license {:name "MIT"
            :url "http://mit-license.org/"}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 ;; Web server
                 [compojure "1.5.0"]
                 [ring/ring-json "0.4.0"]
                 [aleph "0.4.0"]

                 ;; DB
                 [org.layerware/hugsql "0.4.6"]
                 [org.postgresql/postgresql "9.4.1207"]
                 
                 ;; utils
                 [org.clojure/tools.cli "0.3.3"]]
  :plugins [[migratus-lein "0.2.6"]]
  :migratus {:store :database
             :migration-dir "migrations"
             :db ~(get (System/getenv) "DATABASE_URL")}
  :main clarkenciel-site.core
  :aot [clarkenciel-site.core]
  :test-path "test/clarkenciel-site")
