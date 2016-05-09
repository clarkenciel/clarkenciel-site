(ns clarkenciel-site.db.utils
  (:require [joplin.repl :as jr]
            [environ.core :refer [env]]
            [clarkenciel-site.db.core :as queries]
            [mount.core :as mount]))

(defn config []
  {:migrators
   {:sql-mig "resources/joplin/migrations/sql"}
   
   :databases
   {:all {:type :sql :url (env :database-url)}}

   :environments
   {:all [{:db :all :migrator :sql-mig}] }})

(defn migrate []
  (jr/migrate (config) :all))

(defn create [id]
  (jr/create (config) :all :all id))

(defn rollback [& ids]
  (let [f (partial jr/rollback (config) :all :all)]
    (doseq [id ids]
      (f ids))))

(defn reset []
  (jr/reset (config) :all :all))

(defn pending []
  (jr/pending (config) :all))

(defn clear-db []  
  (do
    (mount/start)
    (queries/delete-all-users!) ; cascades thru posts/posts_tags
    (queries/delete-all-tags!)))
