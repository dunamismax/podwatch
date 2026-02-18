DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  session_token VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS pods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pods_owner_id_idx ON pods(owner_id);

CREATE TABLE IF NOT EXISTS pod_members (
  pod_id INTEGER NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pod_id, user_id)
);

CREATE INDEX IF NOT EXISTS pod_members_user_id_idx ON pod_members(user_id);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  pod_id INTEGER NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  scheduled_for TIMESTAMPTZ NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_pod_id_idx ON events(pod_id);
CREATE INDEX IF NOT EXISTS events_scheduled_for_idx ON events(scheduled_for);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, role_id)
);
