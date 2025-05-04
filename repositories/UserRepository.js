class UserRepository {
    constructor(db) {
      this.db = db;
    }
  
    async getUserByEmail(email) {
      const result = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [email]);
      return result.rows[0];
    }
  
    async getUserProfilesByEmail(email) {
      const result = await this.db.query('SELECT * FROM "UserProfiles" WHERE email = $1', [email]);
      return result.rows;
    }
  
    async createUser({ email, password, subscription_type_id = 1, failed_login_attempts = 0 }) {
      const result = await this.db.query(
        `INSERT INTO "Users" (email, password, subscription_type_id, failed_login_attempts)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, email`,
        [email, password, subscription_type_id, failed_login_attempts]
      );
      return result.rows[0];
    }
  
    async checkInvitation({ invited_user_email, invite_by_user_id }) {
      const result = await this.db.query(
        'SELECT * FROM "invitations" WHERE invited_user_email = $1 AND invite_by_user_id = $2',
        [invited_user_email, invite_by_user_id]
      );
      return result.rows.length > 0;
    }
  
    async insertInvitation({ invited_user_email, invite_by_user_id }) {
      await this.db.query('CALL sp_insert_into_invitations($1, $2)', [invited_user_email, invite_by_user_id]);
    }
  
    async updateUser(id, fields) {
      const { email, password, subscription_type_id, failed_login_attempts } = fields;
      const result = await this.db.query(
        `UPDATE "Users"
         SET email = COALESCE($1, email),
             password = COALESCE($2, password),
             subscription_type_id = COALESCE($3, subscription_type_id),
             failed_login_attempts = COALESCE($4, failed_login_attempts)
         WHERE user_id = $5
         RETURNING user_id, email, subscription_type_id, failed_login_attempts`,
        [email, password, subscription_type_id, failed_login_attempts, id]
      );
      return result.rows[0];
    }
  
    async getAllUsers() {
      const result = await this.db.query('SELECT * FROM "Users"');
      return result.rows;
    }
  
    async getUserById(id) {
      const result = await this.db.query('SELECT * FROM "Users" WHERE user_id = $1', [id]);
      return result.rows[0];
    }
  
    async deleteUser(id) {
      const client = await this.db.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM "Profiles" WHERE user_id = $1', [id]);
        const result = await client.query('DELETE FROM "Users" WHERE user_id = $1 RETURNING user_id', [id]);
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return null;
        }
        await client.query('COMMIT');
        return result.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  
    async upsertOAuthUser(profile) {
      const result = await this.db.query('SELECT * FROM "Users" WHERE email = $1', [profile.email]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        if (!user.name || !user.profile_picture) {
          const update = await this.db.query(
            `UPDATE "Users"
             SET name = COALESCE($1, name),
                 profile_picture = COALESCE($2, profile_picture)
             WHERE email = $3
             RETURNING *`,
            [
              profile.displayName || profile.given_name || 'Unknown',
              profile.picture || null,
              profile.email
            ]
          );
          return update.rows[0];
        }
        return user;
      }
  
      const insert = await this.db.query(
        `INSERT INTO "Users" (email, name, profile_picture)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          profile.email,
          profile.displayName || profile.given_name || 'Unknown',
          profile.picture || null
        ]
      );
      return insert.rows[0];
    }
  }
  
  module.exports = UserRepository;
  