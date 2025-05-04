// repositories/SubscriptionRepository.js
class SubscriptionRepository {
    constructor(db) {
      this.db = db;
    }
  
    async create(subscription_name, subscription_price_euro) {
      return await this.db.query(
        'CALL sp_insert_subscription($1, $2)',
        [subscription_name, subscription_price_euro]
      );
    }
  
    async pay(userid, subscription_type_id) {
      return await this.db.query(
        'CALL public.sp_pay_subscription($1, $2, $3)',
        [userid, subscription_type_id, null]
      );
    }
  
    async getAll() {
      return await this.db.query('SELECT * FROM "Subscriptions"');
    }
  
    async getById(id) {
      return await this.db.query(
        'SELECT * FROM "Subscriptions" WHERE subscription_type_id = $1',
        [id]
      );
    }
  
    async update(id, subscription_name, subscription_price_euro) {
      return await this.db.query(
        `UPDATE "Subscriptions"
         SET subscription_name = COALESCE($1, subscription_name),
             subscription_price_euro = COALESCE($2, subscription_price_euro)
         WHERE subscription_type_id = $3
         RETURNING *`,
        [subscription_name, subscription_price_euro, id]
      );
    }
  
    async delete(id) {
      return await this.db.query(
        'DELETE FROM "Subscriptions" WHERE subscription_type_id = $1 RETURNING *',
        [id]
      );
    }
  }
  
  module.exports = SubscriptionRepository;
  