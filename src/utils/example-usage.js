// Example usage of the database helper functions
import {
  addWord,
  deleteWord,
  getAllWords,
  getFavoriteWords,
  getWordById,
  getWordCount,
  getWordsByDifficulty,
  getWordsForReview,
  initDatabase,
  searchWords,
  setReviewFlag,
  toggleFavorite,
  updateWord,
  wordExists
} from './database.js';

// Example component usage
export const exampleUsage = async () => {
  try {
    // Initialize database (usually done once in your app)
    await initDatabase();

    // 1. Add a new word
    const newWordId = await addWord({
      word: 'serendipity',
      meaning: 'The occurrence of events by chance in a happy or beneficial way',
      example: 'Finding this perfect parking spot was pure serendipity.',
      difficulty: 'hard',
      favorite: 0,
      reviewFlag: 0
    });
    console.log('Added word with ID:', newWordId);

    // 2. Add another word
    await addWord({
      word: 'ephemeral',
      meaning: 'Lasting for a very short time',
      example: 'The beauty of cherry blossoms is ephemeral.',
      difficulty: 'medium',
      image: 'cherry_blossom.jpg',
      audio: 'ephemeral_audio.mp3'
    });

    // 3. Get all words
    const allWords = await getAllWords();
    console.log('All words:', allWords);

    // 4. Get word by ID
    const word = await getWordById(1);
    console.log('Word with ID 1:', word);

    // 5. Get words by difficulty
    const easyWords = await getWordsByDifficulty('easy');
    console.log('Easy words:', easyWords);

    // 6. Get favorite words
    const favorites = await getFavoriteWords();
    console.log('Favorite words:', favorites);

    // 7. Search words
    const searchResults = await searchWords('happy');
    console.log('Search results for "happy":', searchResults);

    // 8. Update a word
    await updateWord(1, {
      word: 'serendipity',
      meaning: 'Updated meaning for serendipity',
      example: 'Updated example',
      difficulty: 'medium',
      favorite: 1
    });

    // 9. Toggle favorite status
    await toggleFavorite(1);

    // 10. Set review flag
    await setReviewFlag(1, 1);

    // 11. Get words for review
    const reviewWords = await getWordsForReview();
    console.log('Words for review:', reviewWords);

    // 12. Get word count
    const count = await getWordCount();
    console.log('Total words:', count);

    // 13. Check if word exists
    const exists = await wordExists('serendipity');
    console.log('Word exists:', exists);

    // 14. Delete a word
    await deleteWord(2);

    // 15. Delete all words (use with caution!)
    // await deleteAllWords();

  } catch (error) {
    console.error('Database operation failed:', error);
  }
};

// Example React hook for database operations
import { useEffect, useState } from 'react';

export const useWords = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);
      await initDatabase();
      const allWords = await getAllWords();
      setWords(allWords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addNewWord = async (wordData) => {
    try {
      const id = await addWord(wordData);
      // Reload words after adding
      await loadWords();
      return id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateExistingWord = async (id, wordData) => {
    try {
      await updateWord(id, wordData);
      await loadWords(); // Reload words after updating
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeWord = async (id) => {
    try {
      await deleteWord(id);
      await loadWords(); // Reload words after deleting
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    words,
    loading,
    error,
    addNewWord,
    updateExistingWord,
    removeWord,
    reloadWords: loadWords
  };
};

