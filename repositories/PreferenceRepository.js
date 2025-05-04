class PreferenceRepository {
    constructor(db) {
      this.db = db;
    }
  
    async insertPreference(profile_id, genre_id) {
      return this.db.query('CALL sp_insert_into_preferences($1, $2)', [profile_id, genre_id]);
    }
  
    async getPreferencesByProfileId(profile_id) {
      return this.db.query('SELECT * FROM "Preferences" WHERE profile_id = $1', [profile_id]);
    }
  
    async deletePreference(profile_id, genre_id) {
      return this.db.query(
        `DELETE FROM "Preferences" WHERE profile_id = $1 AND genre_id = $2 RETURNING profile_id, genre_id`,
        [profile_id, genre_id]
      );
    }
  }
  
  module.exports = PreferenceRepository;
  