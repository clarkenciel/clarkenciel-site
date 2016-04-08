(defproject clarkenciel-site "0.1.0"
  :description "Personal site of Danny Clarke"
  :url "http://clarkenciel.com"
  :license {:name "MIT"
            :url "http://mit-license.org/"}

  :min-lein-version "2.0.0"
  :jvm-opts ["-server" "-Dconf=.lein-env"]
  :source-paths ["src"]
  :resource-paths ["resources" "joplin"]
  
  :dependencies [[org.clojure/clojure "1.7.0"]
                 ;; Web server
                 [compojure "1.5.0"]
                 [ring/ring-json "0.4.0"]
                 [aleph "0.4.0"]

                 ;; DB
                 [org.postgresql/postgresql "9.4.1207"]
                 [com.layerware/hugsql "0.4.6"]
                 [conman "0.4.8"]
                 [mount "0.1.10"]                 
                 [joplin.core "0.3.6"]
                 [joplin.jdbc "0.3.6"]
                 
                 
                 ;; utils
                 [org.clojure/tools.cli "0.3.3"]
                 [environ "1.0.2"]]
  
  :plugins [[lein-environ "1.0.2"]]
  :main clarkenciel-site.core
  :aot [clarkenciel-site.core]
  :test-path "test/clarkenciel-site"
  :target-path "target/%s/"

  :aliases
  {"migrate" ["run" "-m" "clarkenciel-site.db.utils/migrate"]
   "seed" ["run" "-m" "clarkenciel-site.db.utils/seed"]
   "rollback" ["run" "-m" "clarkenciel-site.db.utils/rollback"]
   "reset" ["run" "-m" "clarkenciel-site.db.utils/reset"]
   "pending" ["run" "-m" "clarkenciel-site.db.utils/pending"]
   "create" ["run" "-m" "clarkenciel-site.db.utils/create"]}
  
  :profiles
  {:uberjar {:omit-source true
             :aot :all
             :uberjar-name "clarkenciel-site.jar"
             :source-paths ["src"]
             :resource-paths ["resources"]}})
