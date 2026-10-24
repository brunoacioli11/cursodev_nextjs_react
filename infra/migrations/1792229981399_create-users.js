export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // for reference, github limits usernames to 39 characters.
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    // every email in the world can have a max of 254 chars
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    // 72 characters because the hash function is limited to 72 bytes password
    password: {
      type: "varchar(72)",
      notNull: true,
    },

    // timestamp with timezone
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },

    updated_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
  });
};

export const down = false;
