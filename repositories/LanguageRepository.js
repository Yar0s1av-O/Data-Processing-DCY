class LanguageRepository {
    constructor(db) {
      this.db = db;
    }
  
    async create(name) {
      const result = await this.db.query(
        'INSERT INTO "Language" (name) VALUES ($1) RETURNING language_id, name',
        [name]
      );
      return result.rows[0];
    }
  
    async getAll() {
      const result = await this.db.query('SELECT * FROM "Language" ORDER BY language_id ASC');
      return result.rows;
    }
  
    async getById(language_id) {
      const result = await this.db.query('SELECT * FROM "Language" WHERE language_id = $1', [language_id]);
      return result.rows[0];
    }
  
    async update(language_id, name) {
      const result = await this.db.query(
        'UPDATE "Language" SET name = $1 WHERE language_id = $2 RETURNING language_id, name',
        [name, language_id]
      );
      return result.rows[0];
    }
  
    async delete(language_id) {
      const result = await this.db.query(
        'DELETE FROM "Language" WHERE language_id = $1 RETURNING language_id, name',
        [language_id]
      );
      return result.rows[0];
    }
  }
  
  module.exports = LanguageRepository;