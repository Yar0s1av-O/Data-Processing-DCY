const db = require('../database/dbConnection');

// Add watch history entry
exports.addWatchHistory = async (req, res) => {
  const watchHistoryEntry = req.body;

  try {
    const query = `
      INSERT INTO watch_history (
        user_id, content_id, content_title, content_type, 
        genre, progress, duration_watched, rating, 
        platform, is_favorite, started_at, ended_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id, watched_at
    `;

    const values = [
      watchHistoryEntry.user_id,
      watchHistoryEntry.content_id,
      watchHistoryEntry.content_title,
      watchHistoryEntry.content_type,
      watchHistoryEntry.genre || null,
      watchHistoryEntry.progress || null,
      watchHistoryEntry.duration_watched || null,
      watchHistoryEntry.rating || null,
      watchHistoryEntry.platform || null,
      watchHistoryEntry.is_favorite || false,
      watchHistoryEntry.started_at || null,
      watchHistoryEntry.ended_at || null
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Watch history entry added successfully',
      entry: {
        id: result.rows[0].id,
        watched_at: result.rows[0].watched_at
      }
    });
  } catch (error) {
    console.error('Error adding watch history:', error);
    
    if (error.code === '23503') {  // PostgreSQL foreign key violation
      return res.status(404).json({
        message: 'User not found. Invalid user_id.',
        error: error.detail
      });
    }

    res.status(500).json({
      message: 'Error adding watch history',
      error: error.message
    });
  }
};

// Get user's watch history
exports.getUserWatchHistory = async (req, res) => {
  const { user_id } = req.params;
  const { 
    limit = 50, 
    offset = 0, 
    sort_by = 'watched_at', 
    order = 'DESC' 
  } = req.query;

  try {
    const query = `
      SELECT * FROM watch_history 
      WHERE user_id = $1
      ORDER BY ${sort_by} ${order}
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total_entries 
      FROM watch_history 
      WHERE user_id = $1
    `;

    // Execute both queries in parallel
    const [historyResult, countResult] = await Promise.all([
      db.query(query, [user_id, limit, offset]),
      db.query(countQuery, [user_id])
    ]);

    res.status(200).json({
      watch_history: historyResult.rows,
      total_entries: parseInt(countResult.rows[0].total_entries),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    res.status(500).json({
      message: 'Error retrieving watch history',
      error: error.message
    });
  }
};