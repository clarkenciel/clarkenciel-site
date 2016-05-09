(ns clarkenciel-site.db.core
  (:require [conman.core :as conman]
            [mount.core :refer [defstate]]
            [environ.core :refer [env]]
            [buddy.hashers :as hashers]))

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

;;; extra queries
(defn get-user [user-email-or-id]
  (if (= java.lang.String (class user-email-or-id))
    (get-user-by-email {:email user-email-or-id})
    (get-user-by-id {:id user-email-or-id})))

(defn process-post [post]
  (let [author (get-user (:author_id post))
        tags   (get-tags-for-post {:id (:id post)})]
    (assoc (dissoc post :author_id)
           :author (dissoc author :password)
           :tags tags)))

(defn create-user! [fn ln em pw]
  (insert-user!
   {:first-name fn
    :last-name ln
    :email em
    :password (hashers/encrypt pw)}))
