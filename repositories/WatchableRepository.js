// repositories/WatchableRepository.js

class WatchableRepository {
    constructor(db) {
      this.db = db;
    }
  
    async createWatchable(title, description, genre_id, duration, season, episode) {
      await this.db.query(
        'CALL sp_insert_into_watchable($1, $2, $3, $4, $5, $6)',
        [title, description, genre_id, duration, season, episode]
      );
    }
  
    async getAllWatchables() {
      const result = await this.db.query('SELECT * FROM "Watchable"');
      return result.rows;
    }
  
    async getWatchableById(id) {
      const result = await this.db.query('SELECT * FROM "Watchable" WHERE watchable_id = $1', [id]);
      return result.rows[0] || null;
    }
  
    async getWatchablesByTitle(title) {
      const result = await this.db.query('SELECT * FROM "Watchable" WHERE title LIKE $1', [`%${title}%`]);
      return result.rows;
    }
  
    async getWatchablesByGenreName(genreName) {
      const result = await this.db.query(
        `SELECT w.* 
         FROM "Watchable" w
         JOIN "Genres" g ON w.genre_id = g.genre_id
         WHERE g.genre_name ILIKE $1`,
        [`%${genreName}%`]
      );
      return result.rows;
    }
  
    async getWatchablesByProfilePreferences(profile_id) {
      const result = await this.db.query(
        `SELECT w.*
         FROM "Watchable" w
         JOIN "Preferences" p ON w.genre_id = p.genre_id
         WHERE p.profile_id = $1`,
        [profile_id]
      );
      return result.rows;
    }
  
    async updateWatchable(id, updates) {
      const { title, description, genre_id, duration, season, episode } = updates;
  
      const result = await this.db.query(
        `UPDATE "Watchable"
         SET 
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           genre_id = COALESCE($3, genre_id),
           duration = COALESCE($4, duration),
           season = COALESCE($5, season),
           episode = COALESCE($6, episode)
         WHERE watchable_id = $7
         RETURNING *`,
        [title, description, genre_id, duration, season, episode, id]
      );
  
      return result.rows[0] || null;
    }
  
    async deleteWatchable(id) {
      const result = await this.db.query(
        'DELETE FROM "Watchable" WHERE watchable_id = $1 RETURNING watchable_id',
        [id]
      );
      return result.rows[0] || null;
    }
  }
  
  module.exports = WatchableRepository;
  