(ns clarkenciel-site.test-config
  (:require [clojure.test :refer :all]
            [clarkenciel-site.core :refer :all]
            [clarkenciel-site.db.core :refer :all]
            [clarkenciel-site.db.utils :refer :all]
            [clj-time.core :as time]
            [clj-time.coerce :as time-coerce]
            [mount.core :refer [start]]))

(defn make-app [port-number]
  (let [app (app port-number)]
    (fn [f]
      (f) ; run the fixtures
      (.close app))))

(defn database-fixture [f]
  (start)
  (clear-db) ; just to be sure!
  (let [{user-id :id} (create-user! "danny" "clarke" "test@auto.com" "password")
        {post-id :id} (create-post! {:publish-date (time-coerce/to-timestamp (time/now))
                                     :title "test title"
                                     :body "test body"
                                     :author-id user-id})
        {tag-id :id} (create-tag! {:tag-name "music"})]
    (tag-post! {:post-tag-id-pairs [[post-id tag-id]]})
    (f) ; run the fixtures
    (clear-db)))


