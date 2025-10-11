import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { seedWords } from '../src/utils/seed-data.js';
import { addWord, deleteWord, getAllWords, getWordCount, initDatabase } from './utils/database';

const WordList = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');

  // Load words when component mounts
  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);
      await initDatabase(); // Initialize database first (this will auto-seed if empty)
      const allWords = await getAllWords();
      const count = await getWordCount();
      setWords(allWords);
      setWordCount(count);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Error', 'Failed to load words from database');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim() || !newMeaning.trim()) {
      Alert.alert('Error', 'Please enter both word and meaning');
      return;
    }

    try {
      const wordData = {
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        example: newExample.trim() || null,
        difficulty: 'medium',
        favorite: 0,
        reviewFlag: 0
      };

      await addWord(wordData);
      Alert.alert('Success', 'Word added successfully!');

      // Clear form
      setNewWord('');
      setNewMeaning('');
      setNewExample('');

      // Reload words
      await loadWords();
    } catch (error) {
      console.error('Error adding word:', error);
      Alert.alert('Error', 'Failed to add word');
    }
  };

  const handleDeleteWord = async (id: number) => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWord(id);
              Alert.alert('Success', 'Word deleted successfully!');
              await loadWords(); // Reload words
            } catch (error) {
              console.error('Error deleting word:', error);
              Alert.alert('Error', 'Failed to delete word');
            }
          }
        }
      ]
    );
  };

  const renderWord = ({ item }: { item: any }) => (
    <View style={styles.wordItem}>
      <View style={styles.wordContent}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.meaningText}>{item.meaning}</Text>
        {item.example && <Text style={styles.exampleText}>Example: {item.example}</Text>}
        <Text style={styles.difficultyText}>Difficulty: {item.difficulty}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteWord(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading words...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Word List</Text>

      {/* Database info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📚 Built-in Vocabulary: {seedWords.length} words
        </Text>
        <Text style={styles.infoText}>
          📊 Total Words in Database: {wordCount}
        </Text>
      </View>

      {/* Add new word form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter word"
          value={newWord}
          onChangeText={setNewWord}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter meaning"
          value={newMeaning}
          onChangeText={setNewMeaning}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Enter example (optional)"
          value={newExample}
          onChangeText={setNewExample}
          multiline
        />
        <Button title="Add Word" onPress={handleAddWord} />
      </View>

      {/* Words list */}
      <FlatList
        data={words}
        renderItem={renderWord}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No words found. Add your first word above!</Text>
          </View>
        )}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    minHeight: 40,
  },
  list: {
    flex: 1,
  },
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  wordContent: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  meaningText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  exampleText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#888',
    fontStyle: 'italic',
  },
  difficultyText: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WordList;