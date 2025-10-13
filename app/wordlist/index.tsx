import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DifficultySelection = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    marginBottom: 30,
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