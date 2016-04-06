(defproject clarkenciel-site "0.1.0"
  :description "Personal site of Danny Clarke"
  :url "http://clarkenciel.com"
  :license {:name "MIT"
            :url "http://mit-license.org/"}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [compojure "1.5.0"]
                 [ring/ring-json "0.4.0"]
                 [aleph "0.4.0"]
                 [org.clojure/tools.cli "0.3.3"]]
  :main clarkenciel-site.core
  :aot [clarkenciel-site.core]
  :test-path "test/clarkenciel-site")
