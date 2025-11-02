CREATE DATABASE auth;
\c auth

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

INSERT INTO users (email, password, first_name, last_name,role, created_at, updated_at)
VALUES ('admin@gmail.com', '$2a$04$CHxMEXL8vezb4FCk9BoHMu4isGPn.6Md.8GQfbwyGDF5UESazaPKq', 'admin', 'admin','admin', NOW(), NOW());