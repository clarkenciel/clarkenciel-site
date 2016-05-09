CREATE TABLE bios_to_tags
( bio_id BIGINT NOT NULL REFERENCES bios(id) ON DELETE CASCADE
, tag_id BIGINT NOT NULL REFERENCES bios_tags(id) ON DELETe CASCADE
, UNIQUE (bio_id, tag_id)
);
