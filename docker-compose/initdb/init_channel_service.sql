ALTER SYSTEM SET wal_level = logical;
CREATE DATABASE channel;
\c channel;
CREATE TABLE channels (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    subscription_count INT,
    is_live BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE channels REPLICA IDENTITY FULL;

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE categories REPLICA IDENTITY FULL;

CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    title TEXT,
    hls_url TEXT,
    live_chat_url TEXT,
    srt_server_url TEXT,
    stream_key TEXT,
    description TEXT,
    status TEXT,
    channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
ALTER TABLE streams REPLICA IDENTITY FULL;

CREATE TABLE subscriptions(
    follower_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
    channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    primary key (follower_id, channel_id)
);

INSERT INTO categories (title, created_at, updated_at) VALUES
('League of Legends', NOW(), NOW()),
('Valorant', NOW(), NOW()),
('Counter-Strike 2', NOW(), NOW()),
('Dota 2', NOW(), NOW()),
('PUBG: Battlegrounds', NOW(), NOW()),
('Fortnite', NOW(), NOW()),
('Apex Legends', NOW(), NOW()),
('Call of Duty: Warzone', NOW(), NOW()),
('Minecraft', NOW(), NOW()),
('Roblox', NOW(), NOW()),
('Genshin Impact', NOW(), NOW()),
('Mobile Legends: Bang Bang', NOW(), NOW()),
('Free Fire', NOW(), NOW()),
('Among Us', NOW(), NOW()),
('Grand Theft Auto V (GTA V)', NOW(), NOW()),
('Red Dead Redemption 2', NOW(), NOW()),
('FIFA 24', NOW(), NOW()),
('EA Sports FC 24', NOW(), NOW()),
('Rocket League', NOW(), NOW()),
('Overwatch 2', NOW(), NOW()),
('Destiny 2', NOW(), NOW()),
('Elden Ring', NOW(), NOW()),
('Baldur’s Gate 3', NOW(), NOW()),
('Rust', NOW(), NOW()),
('ARK: Survival Evolved', NOW(), NOW()),
('Cyberpunk 2077', NOW(), NOW()),
('Honkai: Star Rail', NOW(), NOW()),
('The Sims 4', NOW(), NOW()),
('Dead by Daylight', NOW(), NOW()),
('Phasmophobia', NOW(), NOW()),
('Just Chatting', NOW(), NOW()),
('Music', NOW(), NOW()),
('Talk Shows & Podcasts', NOW(), NOW()),
('ASMR', NOW(), NOW()),
('Art', NOW(), NOW()),
('Science & Technology', NOW(), NOW()),
('Cooking', NOW(), NOW()),
('Travel & Outdoors', NOW(), NOW()),
('Fitness & Health', NOW(), NOW()),
('Education', NOW(), NOW()),
('Creative Arts', NOW(), NOW()),
('Esports', NOW(), NOW()),
('IRL (In Real Life)', NOW(), NOW()),
('Board Games', NOW(), NOW()),
('Virtual Reality (VR)', NOW(), NOW()),
('Retro Gaming', NOW(), NOW()),
('Indie Games', NOW(), NOW()),
('Simulation Games', NOW(), NOW()),
('Speedrunning', NOW(), NOW()),
('Charity Streams', NOW(), NOW());

