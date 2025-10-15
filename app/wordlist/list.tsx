import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWordsByDifficulty } from '../utils/database';

interface Word {
  id: number;
  word: string;
  meaning: string;
  example?: string;
  image?: string;
  audio?: string;
  difficulty: string;
  favorite: number;
  reviewFlag: number;
}

const WordListPage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { difficulty } = useLocalSearchParams<{ difficulty: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, [difficulty]);

  const loadWords = async () => {
    try {
      setLoading(true);
      if (!difficulty) {
        Alert.alert('Error', 'No difficulty level specified');
        return;
      }
      const fetchedWords = await getWordsByDifficulty(difficulty);
      setWords(fetchedWords);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Error', 'Failed to load words from database');
    } finally {
      setLoading(false);
    }
  };

  const handleWordPress = (wordId: number) => {
    router.push(`/wordlist/details?id=${wordId}`);
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusBadge = (item: Word) => {
    if (item.reviewFlag === 2) {
      return { icon: 'checkmark-circle', color: '#4CAF50', text: 'Learned' };
    } else if (item.reviewFlag === 1) {
      return { icon: 'flag', color: '#FF9800', text: 'Review' };
    }
    return null;
  };

  const renderWord = ({ item }: { item: Word }) => {
    const statusBadge = getStatusBadge(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.wordCard,
          item.reviewFlag === 2 && styles.wordCardLearned,
          item.reviewFlag === 1 && styles.wordCardReview,
        ]}
        onPress={() => handleWordPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.wordHeader}>
          <Text style={styles.wordText}>{item.word}</Text>
          <View style={styles.badges}>
            {item.favorite === 1 && (
              <View style={styles.badge}>
                <Ionicons name="heart" size={18} color="#F44336" />
              </View>
            )}
            {statusBadge && (
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
                <Ionicons name={statusBadge.icon as any} size={16} color={statusBadge.color} />
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                  {statusBadge.text}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.meaningText} numberOfLines={2}>
          {item.meaning}
        </Text>
        {item.example && (
          <Text style={styles.exampleText} numberOfLines={1}>
            "{item.example}"
          </Text>
        )}
        <View style={styles.footer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
              {difficulty?.toUpperCase()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={getDifficultyColor()} />
        <Text style={styles.loadingText}>Loading words...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { 
        backgroundColor: getDifficultyColor() + '10',
        paddingTop: insets.top + 10
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={getDifficultyColor()} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: getDifficultyColor() }]}>
            {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)} Words
          </Text>
          <Text style={styles.wordCount}>{words.length} words available</Text>
        </View>
      </View>

      <FlatList
        data={words}
        renderItem={renderWord}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No words found for this difficulty level</Text>
            <TouchableOpacity
              style={[styles.backToSelectionButton, { backgroundColor: getDifficultyColor() }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backToSelectionText}>Choose Another Level</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default WordListPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
    flexGrow: 1,
  },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  wordCardLearned: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  wordCardReview: {
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF9F0',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meaningText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  exampleText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backToSelectionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backToSelectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});