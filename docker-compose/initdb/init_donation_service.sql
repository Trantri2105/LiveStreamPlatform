CREATE DATABASE donation;
\c donation

CREATE TABLE wallets (
    channel_id TEXT PRIMARY KEY,
    amount INT,
    currency TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE donate_transactions (
    id TEXT PRIMARY KEY,
    channel_id TEXT REFERENCES wallets(channel_id),
    stream_id TEXT,
    amount INT,
    donor_channel_id TEXT,
    donate_message TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
)