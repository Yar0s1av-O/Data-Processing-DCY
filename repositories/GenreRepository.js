class GenreRepository {
    constructor(db) {
      this.db = db;
    }
  
    async create(name) {
      const query = 'INSERT INTO "Genres" (genre_name) VALUES ($1) RETURNING *';
      const result = await this.db.query(query, [name]);
      return result.rows[0];
    }
  
    async getAll() {
      const result = await this.db.query('SELECT * FROM "Genres"');
      return result.rows;
    }
  
    async getById(id) {
      const result = await this.db.query('SELECT * FROM "Genres" WHERE genre_id = $1', [id]);
      return result.rows[0];
    }
  
    async update(id, name) {
      const result = await this.db.query(
        'UPDATE "Genres" SET genre_name = $1 WHERE genre_id = $2 RETURNING *',
        [name, id]
      );
      return result.rows[0];
    }
  
    async delete(id) {
      const result = await this.db.query('DELETE FROM "Genres" WHERE genre_id = $1 RETURNING *', [id]);
      return result.rows[0];
    }
  }
  
  module.exports = GenreRepository;
  