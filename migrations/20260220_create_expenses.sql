CREATE TABLE IF NOT EXISTS expenses (
  id UUID NOT NULL,
  owner_id TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(80) NOT NULL,
  note TEXT,
  spent_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (owner_id, id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_updated_at
  ON expenses(owner_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_spent_at
  ON expenses(owner_id, spent_at);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_category_spent_at
  ON expenses(owner_id, category, spent_at);
