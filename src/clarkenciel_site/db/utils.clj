(ns clarkenciel-site.db.utils
  (:require [joplin.repl :as jr]
            [environ.core :refer [env]]))

(defn config []
  {:migrators
   {:sql-mig "joplin/migrations/sql"}
   
   :databases
   {:prod {:type :sql :url (env :database-url)}
    :dev  {:type :sql :url (env :database-url)}
    :test {:type :sql :url (env :database-url)}}

   :environments
   {:dev  [{:db :dev  :migrator :sql-mig}]
    :test [{:db :test :migrator :sql-mig}]
    :prod [{:db :prod :migrator :sql-mig}] }})

(defn migrate [joplin-env]
  (jr/migrate (config) (keyword joplin-env)))

(defn create [joplin-env db id]
  (jr/create (config) (keyword joplin-env) (keyword db) (keyword id)))

(defn rollback [joplin-env db amt-or-id]
  (jr/rollback (config) (keyword joplin-env) (keyword db) (keyword amt-or-id)))

(defn reset [joplin-env db]
  (jr/reset (config) (keyword joplin-env) (keyword db)))

(defn pending [joplin-env db]
  (jr/pending (config) (keyword joplin-env) (keyword db)))
