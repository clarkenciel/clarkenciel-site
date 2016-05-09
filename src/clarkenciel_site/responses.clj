(ns clarkenciel-site.responses)

(defn base [status body]
  {:status status
   :headers {"Content Type" "applicaton/json"}
   :body body})

(defn five-o-five [body]
  (base 505 body))

(defn four-o-one [body]
  (base 401 body))
