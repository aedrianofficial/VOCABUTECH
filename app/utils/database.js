import { openDatabaseAsync } from 'expo-sqlite';
import { seedWords } from './seed-data.js';

// Database configuration
const DB_NAME = 'vocabutech.db';
const TABLE_NAME = 'words';

// Initialize database
let db = null;

export const initDatabase = async () => {
  try {
    if (db === null) {
      db = await openDatabaseAsync(DB_NAME);
      await createTable();
      await seedDatabaseIfEmpty();
      console.log('Database initialized successfully');
    }
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Seed database with initial data if empty
const seedDatabaseIfEmpty = async () => {
  try {
    const wordCount = await getWordCount();

    if (wordCount === 0) {
      console.log('Database is empty, seeding with initial vocabulary words...');

      for (const wordData of seedWords) {
        // Transform seed data to match database schema
        const dbWordData = {
          word: wordData.word,
          meaning: wordData.meaning,
          example: wordData.example,
          image: wordData.image,
          audio: wordData.audio,
          difficulty: wordData.difficulty === 'Medium' ? 'medium' :
                     wordData.difficulty === 'Easy' ? 'easy' : 'hard',
          favorite: 0,
          reviewFlag: 0
        };

        await addWord(dbWordData);
        console.log(`Added word: ${wordData.word}`);
      }

      console.log(`Database seeded successfully with ${seedWords.length} vocabulary words!`);
    } else {
      console.log(`Database already contains ${wordCount} words, skipping seed operation.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    // Don't throw error for seeding, just log it
  }
};

// Create words table
const createTable = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL UNIQUE,
        meaning TEXT NOT NULL,
        example TEXT,
        image TEXT,
        audio TEXT,
        difficulty TEXT DEFAULT 'medium',
        favorite INTEGER DEFAULT 0,
        reviewFlag INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.execAsync(query);
    console.log('Words table created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
};

// CREATE - Add a new word
export const addWord = async (wordData) => {
  try {
    await initDatabase();

    const {
      word,
      meaning,
      example = null,
      image = null,
      audio = null,
      difficulty = 'medium',
      favorite = 0,
      reviewFlag = 0
    } = wordData;

    const query = `
      INSERT INTO ${TABLE_NAME} (word, meaning, example, image, audio, difficulty, favorite, reviewFlag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.runAsync(query, [
      word,
      meaning,
      example,
      image,
      audio,
      difficulty,
      favorite,
      reviewFlag
    ]);

    console.log('Word added successfully with ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
};

// READ - Get all words
export const getAllWords = async () => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`;
    const result = await db.getAllAsync(query);

    return result;
  } catch (error) {
    console.error('Error getting all words:', error);
    throw error;
  }
};

// READ - Get word by ID
export const getWordById = async (id) => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = ?`;
    const result = await db.getFirstAsync(query, [id]);

    return result;
  } catch (error) {
    console.error('Error getting word by ID:', error);
    throw error;
  }
};

// READ - Get words by difficulty
export const getWordsByDifficulty = async (difficulty) => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} WHERE difficulty = ? ORDER BY created_at DESC`;
    const result = await db.getAllAsync(query, [difficulty]);

    return result;
  } catch (error) {
    console.error('Error getting words by difficulty:', error);
    throw error;
  }
};

// READ - Get favorite words
export const getFavoriteWords = async () => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} WHERE favorite = 1 ORDER BY created_at DESC`;
    const result = await db.getAllAsync(query);

    return result;
  } catch (error) {
    console.error('Error getting favorite words:', error);
    throw error;
  }
};

// READ - Get words for review
export const getWordsForReview = async () => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} WHERE reviewFlag = 1 ORDER BY created_at DESC`;
    const result = await db.getAllAsync(query);

    return result;
  } catch (error) {
    console.error('Error getting words for review:', error);
    throw error;
  }
};

// READ - Search words
export const searchWords = async (searchTerm) => {
  try {
    await initDatabase();

    const query = `
      SELECT * FROM ${TABLE_NAME}
      WHERE word LIKE ? OR meaning LIKE ?
      ORDER BY created_at DESC
    `;

    const searchPattern = `%${searchTerm}%`;
    const result = await db.getAllAsync(query, [searchPattern, searchPattern]);

    return result;
  } catch (error) {
    console.error('Error searching words:', error);
    throw error;
  }
};

// UPDATE - Update a word
export const updateWord = async (id, wordData) => {
  try {
    await initDatabase();

    const {
      word,
      meaning,
      example,
      image,
      audio,
      difficulty,
      favorite,
      reviewFlag
    } = wordData;

    const query = `
      UPDATE ${TABLE_NAME}
      SET word = ?, meaning = ?, example = ?, image = ?, audio = ?,
          difficulty = ?, favorite = ?, reviewFlag = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await db.runAsync(query, [
      word,
      meaning,
      example,
      image,
      audio,
      difficulty,
      favorite,
      reviewFlag,
      id
    ]);

    if (result.changes === 0) {
      throw new Error('Word not found or no changes made');
    }

    console.log('Word updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating word:', error);
    throw error;
  }
};

// UPDATE - Toggle favorite status
export const toggleFavorite = async (id) => {
  try {
    await initDatabase();

    // First get current favorite status
    const currentWord = await getWordById(id);
    if (!currentWord) {
      throw new Error('Word not found');
    }

    const newFavoriteStatus = currentWord.favorite === 1 ? 0 : 1;

    const query = `UPDATE ${TABLE_NAME} SET favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await db.runAsync(query, [newFavoriteStatus, id]);

    console.log('Favorite status toggled successfully');
    return newFavoriteStatus;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

// UPDATE - Set review flag
export const setReviewFlag = async (id, reviewFlag) => {
  try {
    await initDatabase();

    const query = `UPDATE ${TABLE_NAME} SET reviewFlag = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await db.runAsync(query, [reviewFlag, id]);

    if (result.changes === 0) {
      throw new Error('Word not found or no changes made');
    }

    console.log('Review flag updated successfully');
    return true;
  } catch (error) {
    console.error('Error setting review flag:', error);
    throw error;
  }
};

// DELETE - Delete a word
export const deleteWord = async (id) => {
  try {
    await initDatabase();

    const query = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
    const result = await db.runAsync(query, [id]);

    if (result.changes === 0) {
      throw new Error('Word not found');
    }

    console.log('Word deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting word:', error);
    throw error;
  }
};

// DELETE - Delete all words
export const deleteAllWords = async () => {
  try {
    await initDatabase();

    const query = `DELETE FROM ${TABLE_NAME}`;
    await db.runAsync(query);

    console.log('All words deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting all words:', error);
    throw error;
  }
};

// UTILITY - Get word count
export const getWordCount = async () => {
  try {
    await initDatabase();

    const query = `SELECT COUNT(*) as count FROM ${TABLE_NAME}`;
    const result = await db.getFirstAsync(query);

    return result.count;
  } catch (error) {
    console.error('Error getting word count:', error);
    throw error;
  }
};

// UTILITY - Check if word exists
export const wordExists = async (word) => {
  try {
    await initDatabase();

    const query = `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE word = ?`;
    const result = await db.getFirstAsync(query, [word]);

    return result.count > 0;
  } catch (error) {
    console.error('Error checking if word exists:', error);
    throw error;
  }
};

// Get random word
export const getRandomWord = async () => {
  try {
    await initDatabase();

    const query = `SELECT * FROM ${TABLE_NAME} ORDER BY RANDOM() LIMIT 1`;
    const result = await db.getFirstAsync(query);

    return result;
  } catch (error) {
    console.error('Error getting random word:', error);
    throw error;
  }
};
