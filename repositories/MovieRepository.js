class MovieRepository {
    constructor(db) {
      this.db = db;
    }
  
    getAllMovies() {
      return this.db.query('SELECT * FROM "movies"');
    }
  
    getMovieById(id) {
      return this.db.query('SELECT * FROM "movies" WHERE watchable_id = $1', [id]);
    }
  
    getMoviesByTitle(title) {
      return this.db.query('SELECT * FROM "movies" WHERE LOWER(title) = LOWER($1)', [title]);
    }
  
    getMoviesByGenreName(genre_name) {
      return this.db.query(
        `SELECT m.* FROM movies m JOIN "Genres" g ON m.genre_id = g.genre_id WHERE g.genre_name ILIKE $1`,
        [`%${genre_name}%`]
      );
    }
  
    getMoviesByProfilePreferences(profile_id) {
      return this.db.query(
        `SELECT m.* FROM movies m JOIN "Preferences" p ON m.genre_id = p.genre_id WHERE p.profile_id = $1`,
        [profile_id]
      );
    }
  }
  
  module.exports = MovieRepository;