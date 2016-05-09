(ns clarkenciel-site.core-test
  (:require [clojure.test :refer :all]
            [ring.mock.request :refer :all]
            [clarkenciel-site.test-config :refer :all]
            [clarkenciel-site.db.core :refer :all]
            [clj-http.client :as client]))

(use-fixtures :each (make-app 10003) database-fixture)

(deftest test-routes
  (testing "public routes"
    (testing "posts routes"
      (testing "listing posts"        
        (let [response (client/get "http://localhost:10003/api/posts"
                                   {:as :json})]
          (is (= (:status response) 200))
          (is (= (get-in response [:headers "Content-Type"])
                 "application/json; charset=utf-8"))
          (is (= (sequential? (get-in response [:body :posts]))))))
      
      (testing "posts for tags"
        (let [response (client/get "http://localhost:10003/api/posts/for_tag/music"
                                   {:as :json})]
          (is (= (:status response) 200))
          (is (= (get-in response [:headers "Content-Type"])
                 "application/json; charset=utf-8"))
          (is (= (sequential? (get-in response [:body :posts]))))))

      (testing "posts for user"
        (let [{user-id :id} (get-user "test@auto.com")
              response (client/get (str "http://localhost:10003/api/posts/for_user/" user-id)
                        {:as :json})]
          (is (= (:status response) 200))
          (is (= (get-in response [:headers "Content-Type"])
                 "application/json; charset=utf-8"))
          (is (= (sequential? (get-in response [:body :posts]))))))

      (testing "post for post id"
        (let [{{[post] :posts} :body} (client/get "http://localhost:10003/api/posts"
                                                  {:as :json})
              response (client/get (str "http://localhost:10003/api/posts/" (:id post))
                                   {:as :json})]
          (is (= (:status response) 200))
          (is (= (get-in response [:headers "Content-Type"])
                 "application/json; charset=utf-8"))
          (let [{:keys [title body author]} (get-in response [:body :post])]
            (is (= title "test title"))
            (is (= body "test body"))))))

    (testing "auth routes"
      (testing "logging in")))

  (testing "secure routes"
    (testing "post routes"
      (testing "post creation"))
    
    (testing "user routes"
      (testing "user creation")

      (testing "user removal")

      (testing "user listing"))

    (testing "auth routes"
      (testing "logging out"))))
