CREATE TABLE player_leaderboard (
    player_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    player_name TEXT NOT NULL,
    timer INTEGER NOT NULL,
    date_published TIMESTAMP DEFAULT now() NOT NULL
);