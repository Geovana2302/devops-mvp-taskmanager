-- Tabelas iniciais: usuários, fontes e glifos (modelo de dados da ERS).

CREATE TABLE usuarios (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      text NOT NULL UNIQUE CHECK (email = lower(email)),
  senha_hash text NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fontes (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id    bigint NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome          text NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 60),
  ascendente    integer NOT NULL DEFAULT 800,
  maiusculas    integer NOT NULL DEFAULT 700,
  altura_x      integer NOT NULL DEFAULT 500,
  descendente   integer NOT NULL DEFAULT -200,
  licenca       text,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CHECK (descendente < 0 AND 0 < altura_x AND altura_x <= maiusculas AND maiusculas <= ascendente)
);

CREATE INDEX fontes_usuario_id_idx ON fontes (usuario_id);

CREATE TABLE glifos (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fonte_id      bigint NOT NULL REFERENCES fontes (id) ON DELETE CASCADE,
  nome          text NOT NULL,
  unicode       integer,
  largura       integer NOT NULL DEFAULT 500,
  contornos     jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordem         integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fonte_id, nome),
  UNIQUE (fonte_id, unicode)
);
