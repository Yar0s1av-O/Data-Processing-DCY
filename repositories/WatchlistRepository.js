class WatchlistRepository {
    constructor(db) {
      this.db = db;
    }
  
    async createWatchlist(profile_id, watchable_id) {
      await this.db.query(
        'CALL sp_insert_into_watchlist($1::int, $2::int)',
        [profile_id, watchable_id]
      );
    }
  
    async getByProfileId(profile_id) {
      const result = await this.db.query(
        'SELECT * FROM "Watchlist" WHERE profile_id = $1',
        [profile_id]
      );
      return result.rows;
    }
  
    async deleteByCompositeId(profile_id, watchable_id) {
      const result = await this.db.query(
        'DELETE FROM "Watchlist" WHERE profile_id = $1 AND watchable_id = $2 RETURNING *',
        [profile_id, watchable_id]
      );
      return result.rows[0]; // null if nothing was deleted
    }
  }
  
  module.exports = WatchlistRepository;