-- :name create-user :! :1
-- :doc insert user into database
insert into users
(first_name, last_name, email, password)
values
(:first-name, :last-name, :email, :password)

-- :name get-user-by-id :1
-- :doc get user out of database using email
select * from users
where id = :id

-- :name get-user-by-email :1
-- :doc get user out of database using email
select * from users
where email = :email

-- :name update-user-password :! :1
update users
set password = :new-password
where id = :id

-- :name update-email :! :1
update users
set email = :new-email
where id = :id

-- :name create-post ! :1
insert into posts
(publish_date, title, body, author_id)
values
(:publish-date, :title, :body, :author-id)

-- :name get-posts-for-author :n
select * from posts
where author_id = :author-id
order by publish_date

-- :name get-posts-by-tag :n
select posts.id
       posts.title
       posts.description
       posts.body
       posts.author_id
from posts
join posts_tags on posts.id = posts_tags.post_id
join tags on posts_tags.tag_id = tags.id
where tags.id = :tag-id
order by posts.publish_date

-- :name create-tag :! :1
insert into tags
(name)
values
(:tag-name)

-- :name get-all-tags :n
select * from tags order by id

-- :name add-tags-to-post!
-- :doc Takes a vector of [post-id tag-id] tuples and inserts
--      them, as rows, into the posts_tags tables.
--      This will effectively link the post (or posts) with the
--      tags
insert into posts_tags
(post_id, tag_id)
values :t*:post-tag-id-pairs
