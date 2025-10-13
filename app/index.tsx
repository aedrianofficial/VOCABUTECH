import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRandomWord, initDatabase, setReviewFlag } from './utils/database';
import { getAudioSource as getAudio, getImageSource as getImage } from './utils/mediaLoader';

export default function Index() {
  const insets = useSafeAreaInsets();
  const [dailyWord, setDailyWord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({
    points: 0,
    badges: 0,
    streaks: 0
  });
  const [lastActivity, setLastActivity] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    initializeApp();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      await initDatabase();
      await fetchDailyWord();
      await loadStats();
      await loadLastActivity();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyWord = async () => {
    try {
      const today = new Date().toDateString();
      const savedDate = await AsyncStorage.getItem('@VT_LAST_DAILY_DATE');
      const savedWordId = await AsyncStorage.getItem('@VT_LAST_DAILY_WORD');

      if (savedDate === today && savedWordId) {
        // Use saved word of the day
        const wordId = parseInt(savedWordId);
        const word = await getRandomWord(); // For now, we'll get a random word
        setDailyWord(word);
      } else {
        // Get new word of the day
        const word = await getRandomWord();
        setDailyWord(word);
        await AsyncStorage.setItem('@VT_LAST_DAILY_DATE', today);
        await AsyncStorage.setItem('@VT_LAST_DAILY_WORD', word.id.toString());
      }
    } catch (error) {
      console.error('Error fetching daily word:', error);
    }
  };

  const loadStats = async () => {
    try {
      const points = await AsyncStorage.getItem('@VT_POINTS');
      const badges = await AsyncStorage.getItem('@VT_BADGES');
      const streaks = await AsyncStorage.getItem('@VT_STREAKS');

      setStats({
        points: points ? parseInt(points) : 0,
        badges: badges ? parseInt(badges) : 0,
        streaks: streaks ? parseInt(streaks) : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLastActivity = async () => {
    try {
      const activity = await AsyncStorage.getItem('@VT_LAST_ACTIVITY');
      setLastActivity(activity || 'No recent activity');
    } catch (error) {
      console.error('Error loading last activity:', error);
    }
  };

  const incrementPoints = async (points: number) => {
    try {
      const currentPoints = stats.points + points;
      await AsyncStorage.setItem('@VT_POINTS', currentPoints.toString());
      setStats(prev => ({ ...prev, points: currentPoints }));
    } catch (error) {
      console.error('Error incrementing points:', error);
    }
  };


  const playAudio = async () => {
    try {
      if (!dailyWord?.audio) {
        Alert.alert('No Audio', 'Audio file not available for this word');
        return;
      }

      // Get audio source from database path using centralized loader
      const audioSource = getAudio(dailyWord.audio);
      
      if (!audioSource) {
        Alert.alert('Audio Not Found', `Audio file for "${dailyWord.word}" is not available`);
        return;
      }

      // If audio is currently playing, stop and restart it
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (isPlaying) {
              // Replay from beginning
              await sound.stopAsync();
              await sound.setPositionAsync(0);
            }
            await sound.playAsync();
            setIsPlaying(true);
            return;
          }
        } catch (error) {
          // If there's an error with the existing sound, unload it
          console.log('Unloading previous sound due to error');
          await sound.unloadAsync();
          setSound(null);
        }
      }

      // Load and play new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', `Failed to play audio for "${dailyWord?.word}". The audio file may be missing.`);
      setIsPlaying(false);
    }
  };

  const handleAddToReview = async () => {
    try {
      if (!dailyWord) return;
      await setReviewFlag(dailyWord.id, 1);
      await incrementPoints(5);
      Alert.alert('Success', 'Word added to review list! +5 points');
    } catch (error) {
      console.error('Error adding to review:', error);
      Alert.alert('Error', 'Failed to add word to review');
    }
  };

  const handleMarkLearned = async () => {
    try {
      if (!dailyWord) return;
      await incrementPoints(10);
      await AsyncStorage.setItem('@VT_LAST_ACTIVITY', `Learned: ${dailyWord.word}`);
      Alert.alert('Success', `${dailyWord.word} marked as learned! +10 points`);
      setLastActivity(`Learned: ${dailyWord.word}`);
    } catch (error) {
      console.error('Error marking as learned:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed App Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>VOCABUtech</Text>
        <TouchableOpacity style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={32} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>

      {/* Word of the Day Card */}
      <View style={styles.wordCard}>
        <Text style={styles.cardLabel}>📚 Word of the Day</Text>
        <View style={styles.wordHeader}>
          <Text style={styles.wordTitle}>{dailyWord?.word || 'Loading...'}</Text>
          <TouchableOpacity onPress={playAudio} style={styles.playButton}>
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={40} 
              color="#2196F3" 
            />
          </TouchableOpacity>
        </View>

        {dailyWord?.image && (() => {
          try {
            // Get image source from database path using centralized loader
            const imageSource = getImage(dailyWord.image);
            
            if (imageSource) {
              return (
                <TouchableOpacity 
                  onPress={() => setImageModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={imageSource} 
                    style={styles.wordImage}
                    resizeMode="cover"
                    onError={() => {
                      console.error(`Failed to load image for ${dailyWord.word}`);
                    }}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={24} color="#fff" />
                    <Text style={styles.imageOverlayText}>Tap to view full image</Text>
                  </View>
                </TouchableOpacity>
              );
            } else {
              return (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#CCC" />
                  <Text style={styles.placeholderText}>Image not available</Text>
                </View>
              );
            }
          } catch (error) {
            console.error('Error loading image:', error);
            return (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF5252" />
                <Text style={styles.placeholderText}>Failed to load image</Text>
              </View>
            );
          }
        })()}

        <Text style={styles.definition}>{dailyWord?.meaning}</Text>
        {dailyWord?.example && (
          <Text style={styles.example}>"{dailyWord.example}"</Text>
        )}

        <View style={styles.wordActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddToReview}>
            <Ionicons name="star-outline" size={20} color="#FFA726" />
            <Text style={styles.actionText}>Add to Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.learnedButton]} onPress={handleMarkLearned}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#66BB6A" />
            <Text style={styles.actionText}>Mark Learned</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="trophy" size={28} color="#FFA726" />
          <Text style={styles.statNumber}>{stats.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="medal" size={28} color="#AB47BC" />
          <Text style={styles.statNumber}>{stats.badges}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="flame" size={28} color="#FF5722" />
          <Text style={styles.statNumber}>{stats.streaks}</Text>
          <Text style={styles.statLabel}>Streaks</Text>
        </TouchableOpacity>
      </View>


      {/* Continue Learning */}
      <View style={styles.continueCard}>
        <Text style={styles.continueTitle}>Continue Learning</Text>
        <Text style={styles.continueText}>{lastActivity}</Text>
        <Link href="/wordlist" asChild>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Resume</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dailyWord?.word}</Text>
              <TouchableOpacity 
                onPress={() => setImageModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>

            {dailyWord?.image && (() => {
              const imageSource = getImage(dailyWord.image);
              if (imageSource) {
                return (
                  <Image 
                    source={imageSource} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                );
              }
              return null;
            })()}

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Tap anywhere to close</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120, // Space for bottom navigation
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  profileIcon: {
    padding: 5,
  },
  wordCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  playButton: {
    padding: 5,
  },
  wordImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  definition: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
    lineHeight: 24,
  },
  example: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 20,
  },
  wordActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    gap: 5,
  },
  learnedButton: {
    backgroundColor: '#E8F5E9',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  continueCard: {
    backgroundColor: '#2196F3',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 40,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  continueText: {
    fontSize: 14,
    color: '#E3F2FD',
    marginBottom: 15,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 8,
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalFooterText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
});
