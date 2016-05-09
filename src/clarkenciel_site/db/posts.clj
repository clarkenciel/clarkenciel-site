(ns clarkenciel-site.db.
  (:require [clarkenciel-site.db.core :as q]))

(defn process-post [post]
  (let [author (get-user-by-id {:id (:author_id post)})
        tags   (get-tags-for-post {:id (:id post)})]
    (assoc (dissoc post :author_id)
           :author author
           :tags tags)))
