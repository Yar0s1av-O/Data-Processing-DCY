class WatchHistoryRepository {
    constructor(db) {
      this.db = db;
    }
  
    async createWatchHistory(profile_id, watchable_id, time_stopped) {
      await this.db.query(
        'CALL sp_insert_into_watch_history($1, $2, $3)',
        [profile_id, watchable_id, time_stopped]
      );
    }
  
    async getAllWatchHistory() {
      const result = await this.db.query('SELECT * FROM "Watch history"');
      return result.rows;
    }
  
    async getWatchHistoryByProfileId(profile_id) {
      const result = await this.db.query(
        'SELECT * FROM "Watch history" WHERE profile_id = $1',
        [profile_id]
      );
      return result.rows[0] || null;
    }
  
    async updateWatchHistory(profile_id, watchable_id, time_stopped) {
      const result = await this.db.query(
        `UPDATE "Watch history"
         SET time_stopped = COALESCE($1, time_stopped)
         WHERE profile_id = $2 AND watchable_id = $3
         RETURNING profile_id, watchable_id, time_stopped;`,
        [time_stopped, profile_id, watchable_id]
      );
      return result.rows[0] || null;
    }
  
    async deleteWatchHistory(profile_id, watchable_id) {
      const result = await this.db.query(
        `DELETE FROM "Watch history"
         WHERE profile_id = $1 AND watchable_id = $2
         RETURNING profile_id, watchable_id;`,
        [profile_id, watchable_id]
      );
      return result.rows[0] || null;
    }
  }
  
  module.exports = WatchHistoryRepository;