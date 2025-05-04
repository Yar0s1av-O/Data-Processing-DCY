class SeriesRepository {
    constructor(db) {
      this.db = db;
    }
  
    async getAll() {
      return this.db.query('SELECT * FROM "series"');
    }
  
    async getById(id) {
      return this.db.query('SELECT * FROM "series" WHERE watchable_id = $1', [id]);
    }
  
    async getByGenre(genreName) {
      return this.db.query(
        `SELECT s.* FROM series s
         JOIN "Genres" g ON s.genre_id = g.genre_id
         WHERE g.genre_name ILIKE $1`,
        [`%${genreName}%`]
      );
    }
  
    async getByTitle(title) {
      return this.db.query('SELECT * FROM "series" WHERE title ILIKE $1', [`%${title}%`]);
    }
  
    async getByTitleAndSeason(title, season) {
      return this.db.query(
        'SELECT * FROM "series" WHERE LOWER(title) = LOWER($1) AND season = $2',
        [title, season]
      );
    }
  
    async getByProfilePreferences(profileId) {
      return this.db.query(
        `SELECT s.*
         FROM series s
         JOIN "Preferences" p ON s.genre_id = p.genre_id
         WHERE p.profile_id = $1`,
        [profileId]
      );
    }
  }
  
  module.exports = SeriesRepository;
  