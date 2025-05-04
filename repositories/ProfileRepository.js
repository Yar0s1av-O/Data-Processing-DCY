class ProfileRepository {
    constructor(db) {
      this.db = db;
    }
  
    async createProfile({ userid, profile_name, profile_photo_link, age, language_id }) {
      await this.db.query(
        'CALL sp_insert_into_profiles($1, $2, $3, $4, $5)',
        [userid, profile_name, profile_photo_link, age, language_id]
      );
    }
  
    async getAllProfiles() {
      const result = await this.db.query('SELECT * FROM "Profiles"');
      return result.rows;
    }
  
    async getProfileById(id) {
      const result = await this.db.query('SELECT * FROM "Profiles" WHERE profile_id = $1', [id]);
      return result.rows[0] || null;
    }
  
    async getProfilesByUserId(user_id) {
      const result = await this.db.query('SELECT * FROM "Profiles" WHERE user_id = $1', [user_id]);
      return result.rows;
    }
  
    async updateProfile(id, { profile_photo_link, age, language_id, profile_name }) {
      const query = `
        UPDATE "Profiles"
        SET profile_photo_link = COALESCE($1, profile_photo_link),
            age = COALESCE($2, age),
            language_id = COALESCE($3, language_id),
            profile_name = COALESCE($4, profile_name)
        WHERE profile_id = $5
        RETURNING *;
      `;
      const result = await this.db.query(query, [
        profile_photo_link,
        age,
        language_id,
        profile_name,
        id
      ]);
      return result.rows[0] || null;
    }
  
    async deleteProfile(id) {
      const result = await this.db.query(
        'DELETE FROM "Profiles" WHERE profile_id = $1 RETURNING profile_id',
        [id]
      );
      return result.rows[0] || null;
    }
  }
  
  module.exports = ProfileRepository;