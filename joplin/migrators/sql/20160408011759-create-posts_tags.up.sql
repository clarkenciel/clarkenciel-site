CREATE TABLE posts_tags
( post_id BIGINT NOT NULL REFERENCES posts(id)
, tag_id BIGINT NOT NULL REFERENCES tags(id) 
, UNIQUE (post_id, tag_id)
);
