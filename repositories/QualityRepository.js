class QualityRepository {
    constructor(db) {
      this.db = db;
    }
  
    async createQuality(name) {
      const result = await this.db.query(
        'INSERT INTO "Qualities" (name) VALUES ($1) RETURNING quality_id, name',
        [name]
      );
      return result.rows[0];
    }
  
    async getAllQualities() {
      const result = await this.db.query('SELECT * FROM "Qualities" ORDER BY quality_id ASC');
      return result.rows;
    }
  
    async updateQuality(quality_id, name) {
      const result = await this.db.query(
        `UPDATE "Qualities" SET name = $1 WHERE quality_id = $2 RETURNING quality_id, name`,
        [name, quality_id]
      );
      return result.rows[0];
    }
  
    async deleteQuality(quality_id) {
      const result = await this.db.query(
        'DELETE FROM "Qualities" WHERE quality_id = $1 RETURNING quality_id, name',
        [quality_id]
      );
      return result.rows[0];
    }
  }
  
  module.exports = QualityRepository;