(ns clarkenciel-site.auth
  (:require [clarkenciel-site.db.core :as q]
            [buddy.hashers :as hashers]
            [buddy.auth.backends.token :refer [token-backend]]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.accessrules :refer [error]]
            [crypto.random :refer [base64]]))

(defn authenticate-user [id password]
  (let [{pw :password} (q/get-user id)]
    (and pw
         (hashers/check password pw))))

(defn create-token! [user-id]
  (:id (q/insert-token!
        {:user-id user-id
         :token (base64 25)})))

(defn parse-token-from-header [token-header]
  (-> token-header (clojure.string/split #"\s") (last)))

(defn authenticate-token [{:keys [headers] :as request}]
  (println request)
  (if-let [token (or (get headers "authorization" nil)
                     (get headers "Authorization" nil))]
    (if (q/validate-token {:id (parse-token-from-header token)})
      true
      (error "bah!"))
    (error "bah!")))
