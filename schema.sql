-- Script SQL para la base de datos de torneos de tenis de mesa

CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'En curso' CHECK (status IN ('En curso', 'Finalizado'))
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  players_per_group INTEGER NOT NULL,
  qualified_per_group INTEGER NOT NULL,
  is_finished BOOLEAN DEFAULT FALSE
);

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE group_players (
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (group_id, player_id)
);

CREATE TABLE round_robin_matches (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  player1_id INTEGER REFERENCES players(id),
  player2_id INTEGER REFERENCES players(id),
  result VARCHAR(10), -- formato #-#
  winner_id INTEGER REFERENCES players(id)
);

CREATE TABLE elimination_matches (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id INTEGER REFERENCES players(id),
  player2_id INTEGER REFERENCES players(id),
  result VARCHAR(10),
  winner_id INTEGER REFERENCES players(id),
  bye BOOLEAN DEFAULT FALSE,
  next_match_number INTEGER
);

CREATE TABLE manual_tiebreaks (
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (group_id, player_id)
);

-- Índices para rendimiento
CREATE INDEX idx_categories_tournament ON categories(tournament_id);
CREATE INDEX idx_players_category ON players(category_id);
CREATE INDEX idx_groups_category ON groups(category_id);
CREATE INDEX idx_rr_matches_category ON round_robin_matches(category_id);
CREATE INDEX idx_rr_matches_group ON round_robin_matches(group_id);
CREATE INDEX idx_elim_matches_category ON elimination_matches(category_id);