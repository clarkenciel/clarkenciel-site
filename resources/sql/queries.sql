-- :name insert-user! :<! :1
-- :doc insert user into database
insert into users
(first_name, last_name, email, password)
values
(:first-name, :last-name, :email, :password)
returning id

-- :name get-all-users :? :*
select * from users

-- :name get-user-by-id :? :1
-- :doc get user out of database using email
select * from users
where id = :id

-- :name get-user-by-email :? :1
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

-- :name delete-user! :!
delete from users
where users.id = :id

-- :name delete-all-users! :!
delete from users

-- :name create-post! :<! :1
insert into posts
(publish_date, title, body, author_id)
values
(:publish-date, :title, :body, :author-id)
returning id

-- :name get-all-posts :? :*
select *
from posts

-- :name get-posts-for-author :? :*
select * from posts
where author_id = :author-id
order by publish_date

-- :name get-posts-by-tag :? :*
select posts.id,
       posts.title,
       posts.body,
       posts.author_id
from posts
join posts_tags on posts.id = posts_tags.post_id
join tags on posts_tags.tag_id = tags.id
where tags.id = :tag-id
order by posts.publish_date

-- :name get-post-by-id :? :1
select *
from posts
where posts.id = :id

-- :name delete-post! :!
delete from posts
where posts.id = :id

-- :name delete-all-posts! :!
delete from posts

-- :name create-tag! :<! :1
insert into tags
(name)
values (:tag-name)
returning id

-- :name get-tag-by-id :? :1
select *
from tags
where tags.id = :id

-- :name get-tag-by-name :? :1
select *
from tags
where tags.name = :name

-- :name get-all-tags :? :*
select * from tags order by id

-- :name delete-tag! :!
delete from tags
where tags.id = :id

-- :name delete-all-tags! :!
delete from tags

-- :name tag-post! :>! :1
-- :doc Takes a vector of [post-id tag-id] tuples and inserts
--      them, as rows, into the posts_tags tables.
--      This will effectively link the post (or posts) with the
--      tags
insert into posts_tags
(post_id, tag_id)
values :tuple*:post-tag-id-pairs
returning post_id

-- :name get-tags-for-post :? :*
select tags.name
from posts_tags
join tags on posts_tags.tag_id = tags.id
where posts_tags.post_id = :id

-- :name untag-post! :!
delete from posts_tags
where posts_tags.post_id = :post-id and posts_tags.tag_id = :tag-id

-- :name untag-all-posts! :!
delete from posts_tags

-- :name insert-token! :>! :1
insert into auth_tokens
(id, user_id)
values (:token, :user-id)
returning id

-- :name delete-token! :!
delete from auth_tokens
where id = :token-id or user_id = :user-id

-- :name get-token :? :1
select *
from auth_tokens
where user_id = :user-id

-- :name validate-token :? :1
select *
from auth_tokens
where id = :id
and created_at > current_timestamp  - interval '1 hour'
