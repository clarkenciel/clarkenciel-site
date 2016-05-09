(ns clarkenciel-site.handlers
  (:require [ring.util.response :refer [response created status]]
            [clj-time.core :as time]
            [clj-time.coerce :as time-coerce]
            [clarkenciel-site.db.core :refer :all]
            [clarkenciel-site.responses :as resp]
            [clarkenciel-site.auth :as auth]))

(defn home-page-handler [request]
  (response (slurp (clojure.java.io/resource "public/index.html"))))

(defn all-posts-handler [request]
  (let [posts (get-all-posts)]
    (response {:posts (map process-post posts)})))

(defn posts-for-tag-handler [tag-name]
  (try
    (let [tag-id (:id (get-tag-by-name {:name tag-name}))]
      (response {:posts (get-posts-by-tag {:tag-id tag-id})}))
    (catch Exception e
      (println e)
      (resp/four-hundred (str "Posts for " tag-name " do not exist.")))))

(defn posts-for-user-handler [user-identifier]
  (try
    (let [{user-id :id} (get-user user-identifier)]
      (response
       {:posts
        (map process-post
             (get-posts-for-author {:author-id user-id}))}))
    (catch Exception e
      (println e)
      (resp/four-hundred (str "Posts for " user-identifier " do not exist.")))))

(defn add-post-handler [{params :body}]
  (let [{post-title "title"
         post-body "body"
         post-author-id "author-id"} params]
    (try
      (let [post (create-post!
                  {:publish-date (time-coerce/to-timestamp (time/now))
                   :title post-title
                   :body post-body
                   :author-id (Integer/parseInt post-author-id)})]
        (response {:id (:id post)}))
      (catch Exception e
        (println e)
        (resp/five-o-five
         {:message (str "'" post-title "' could not be created.")
          :error   e})))))

(defn update-post-handler [{params :body :as request}]
  (try
    (let [{title     "title"
           body      "body"
           author-id "author-id"
           id        "id"} params]
      (response
       {:post
        (update-post!
         {:id id
          :title title          
          :body body
          :author-id author-id})}))
    (catch Exception e
      (println e)
      (-> {:message "Could not update post: '" (get params "title") "'."}
          (response)
          (status 500)))))

(defn get-post-handler [post-id]
  (try
    (let [post (->> (Integer/parseInt post-id)
                    (hash-map :id)
                    (get-post-by-id)
                    (process-post))]
      (response {:post post}))
    (catch Exception e
      (println e)
      (resp/four-hundred (str "The post " post-id " does noto exist.")))))

(defn all-users-handler []
  (response {:users (map #(dissoc % :password) (get-all-users))}))

(defn get-user-handler [user-email-or-id]
  (try
    (let [user (get-user user-email-or-id)]
      (response {:user (dissoc user :password)}))
    (catch Exception e
      (println e)
      (resp/four-hundred (str "The user " user-email-or-id " does not exist.")))))

(defn create-user-handler [{:keys [body]}]
  (let [{first-name "first-name"
         last-name "last-name"
         email "email"
         password "password"} body]
    (try
     (create-user! first-name last-name email password)
     (catch Exception e
       (println e)
       (resp/four-hundred (str "Could not create user " email "."))))))

(defn remove-user-handler [request user-name]
  (str "remove-user" request user-name))

(defn update-user-handler [user-id request]
  (str "update-user" user-id request))

(defn login-handler [{:keys [body] :as req}]
  (let [{email "email"
         password "password"} body
        {id :id :as user} (dissoc (get-user email) :password)]
    (if-not (auth/authenticate-user id password)
      (resp/four-o-one {:message "That password and email combination is not valid."})
      (let [token (auth/create-token! id)]
        (response {:message "Success!"
                   :token token
                   :user user})))))

(defn logout-handler [{:keys [headers] :as request}]
  (let [{token "Authorization"} headers]
    (do (delete-token! {:token-id (auth/parse-token-from-header token)
                        :user-id nil})
        (response {:message "Logged Out!"}))))

(defn unauthorized-handler [req msg]
  {:status 401
   :body {:status :error
          :message (or msg "User not authorized")}})
