import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllWords } from '../utils/database';

interface WordStats {
  total: number;
  learned: number;
  review: number;
  notStarted: number;
}

const DifficultySelection = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const words = await getAllWords();
      const learned = words.filter(w => w.reviewFlag === 2).length;
      const review = words.filter(w => w.reviewFlag === 1).length;
      const notStarted = words.filter(w => w.reviewFlag === 0 && w.reviewFlag !== 2).length;
      
      setStats({
        total: words.length,
        learned,
        review,
        notStarted: words.length - learned - review
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficulties = [
    { 
      level: 'easy', 
      label: 'Easy', 
      icon: 'happy-outline', 
      color: '#4CAF50',
      description: 'Basic vocabulary words'
    },
    { 
      level: 'medium', 
      label: 'Medium', 
      icon: 'school-outline', 
      color: '#FF9800',
      description: 'Intermediate level words'
    },
    { 
      level: 'hard', 
      label: 'Hard', 
      icon: 'trophy-outline', 
      color: '#F44336',
      description: 'Advanced vocabulary'
    },
  ];

  const handleDifficultySelect = (difficulty: string) => {
    router.push(`/wordlist/list?difficulty=${difficulty}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Difficulty Level</Text>
          <Text style={styles.subtitle}>Choose the difficulty of words you want to study</Text>
        </View>

        {/* Progress Stats Card */}
        {loading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
          </View>
        ) : stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats.learned}</Text>
                <Text style={styles.statLabel}>Learned</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flag" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{stats.review}</Text>
                <Text style={styles.statLabel}>In Review</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Words</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(stats.learned / stats.total) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((stats.learned / stats.total) * 100)}% Complete
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cardsContainer}>
          {difficulties.map((item) => (
            <TouchableOpacity
              key={item.level}
              style={[styles.card, { borderColor: item.color }]}
              onPress={() => handleDifficultySelect(item.level)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={48} color={item.color} />
              </View>
              <Text style={[styles.cardTitle, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={[styles.button, { backgroundColor: item.color }]}>
                <Text style={styles.buttonText}>Start Learning</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default DifficultySelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});