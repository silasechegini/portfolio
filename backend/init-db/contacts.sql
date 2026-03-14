CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contacts (
     contactId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     contactName VARCHAR(255) NOT NULL CHECK (char_length(contactName) > 0),
     contactSubject VARCHAR(255),
     contactMessage TEXT NOT NULL,
     contactEmail VARCHAR(320) NOT NULL,
     ipAddress INET,
     userAgent TEXT,
     createdAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (createdAt);