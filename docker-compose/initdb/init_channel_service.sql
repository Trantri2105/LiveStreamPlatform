ALTER SYSTEM SET wal_level = logical;
CREATE DATABASE channel;
\c channel;
CREATE TABLE channels (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE channels REPLICA IDENTITY FULL;