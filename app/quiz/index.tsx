import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWordsByDifficulty } from '../utils/database';

const QuizDifficultySelection = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wordCounts, setWordCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(true);

  const difficulties = [
    { 
      level: 'easy', 
      label: 'Easy Quiz', 
      icon: 'happy-outline', 
      color: '#4CAF50',
      description: 'Test basic vocabulary',
      route: '/quiz/easy'
    },
    { 
      level: 'medium', 
      label: 'Medium Quiz', 
      icon: 'school-outline', 
      color: '#FF9800',
      description: 'Intermediate challenge',
      route: '/quiz/medium'
    },
    { 
      level: 'hard', 
      label: 'Hard Quiz', 
      icon: 'trophy-outline', 
      color: '#F44336',
      description: 'Advanced vocabulary test',
      route: '/quiz/hard'
    },
  ];

  useEffect(() => {
    loadWordCounts();
  }, []);

  const loadWordCounts = async () => {
    try {
      const easy = await getWordsByDifficulty('easy');
      const medium = await getWordsByDifficulty('medium');
      const hard = await getWordsByDifficulty('hard');
      
      setWordCounts({
        easy: easy.length,
        medium: medium.length,
        hard: hard.length
      });
    } catch (error) {
      console.error('Error loading word counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultySelect = (route: string, count: number) => {
    if (count < 4) {
      alert(`Not enough words for this quiz. Minimum 4 words required.`);
      return;
    }
    router.push(route as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading quiz data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Ionicons name="school" size={48} color="#2196F3" />
          <Text style={styles.title}>Quiz Challenge</Text>
          <Text style={styles.subtitle}>Test your vocabulary knowledge!</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Choose a difficulty level and answer multiple-choice questions. Earn points for correct answers!
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {difficulties.map((item) => {
            const count = wordCounts[item.level as keyof typeof wordCounts];
            const isDisabled = count < 4;
            
            return (
              <TouchableOpacity
                key={item.level}
                style={[
                  styles.card, 
                  { borderColor: item.color },
                  isDisabled && styles.cardDisabled
                ]}
                onPress={() => handleDifficultySelect(item.route, count)}
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={48} color={item.color} />
                </View>
                <Text style={[styles.cardTitle, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <View style={styles.statsContainer}>
                  <Ionicons name="book-outline" size={16} color="#666" />
                  <Text style={styles.statsText}>{count} words available</Text>
                </View>
                {!isDisabled && (
                  <View style={[styles.button, { backgroundColor: item.color }]}>
                    <Text style={styles.buttonText}>Start Quiz</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                )}
                {isDisabled && (
                  <View style={styles.disabledButton}>
                    <Text style={styles.disabledButtonText}>Not enough words</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizDifficultySelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
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
  cardDisabled: {
    opacity: 0.5,
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
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});

