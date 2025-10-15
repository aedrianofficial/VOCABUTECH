import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRandomWord, getWordById, initDatabase, setReviewFlag } from './utils/database';
import { getAudioSource as getAudio, getImageSource as getImage } from './utils/mediaLoader';

export default function Index() {
  const insets = useSafeAreaInsets();
  const [dailyWord, setDailyWord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({
    points: 0,
    level: 1,
    streaks: 0
  });
  const [lastActivity, setLastActivity] = useState('');
  const [lastReviewedWordId, setLastReviewedWordId] = useState<number | null>(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, points: 0 });
  const [streakMilestoneVisible, setStreakMilestoneVisible] = useState(false);
  const [streakMilestoneData, setStreakMilestoneData] = useState({ streak: 0 });

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
        // Use saved word of the day - retrieve by ID to ensure consistency
        const wordId = parseInt(savedWordId);
        const word = await getWordById(wordId);
        if (word) {
          setDailyWord(word);
        } else {
          // Fallback if word not found
          const newWord = await getRandomWord();
          setDailyWord(newWord);
          await AsyncStorage.setItem('@VT_LAST_DAILY_WORD', newWord.id.toString());
        }
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
      const streaks = await AsyncStorage.getItem('@VT_STREAKS');
      
      const totalPoints = points ? parseInt(points) : 0;
      const currentLevel = Math.floor(totalPoints / 100) + 1;
      const progressInLevel = totalPoints % 100;

      setStats({
        points: totalPoints,
        level: currentLevel,
        streaks: streaks ? parseInt(streaks) : 0
      });
      setLevelProgress(progressInLevel);
      
      // Check and update streak on app load
      await checkAndUpdateStreak();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLastActivity = async () => {
    try {
      const activity = await AsyncStorage.getItem('@VT_LAST_ACTIVITY');
      const lastWordId = await AsyncStorage.getItem('@VT_LAST_REVIEWED_WORD_ID');
      setLastActivity(activity || 'No recent activity');
      setLastReviewedWordId(lastWordId ? parseInt(lastWordId) : null);
    } catch (error) {
      console.error('Error loading last activity:', error);
    }
  };

  const checkAndUpdateStreak = async () => {
    try {
      const today = new Date().toDateString();
      const lastStreakDate = await AsyncStorage.getItem('@VT_LAST_STREAK_DATE');
      const currentStreak = await AsyncStorage.getItem('@VT_STREAKS');
      const streak = currentStreak ? parseInt(currentStreak) : 0;

      if (!lastStreakDate) {
        // First time user
        return;
      }

      const lastDate = new Date(lastStreakDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // User skipped a day, reset streak
        await AsyncStorage.setItem('@VT_STREAKS', '0');
        setStats(prev => ({ ...prev, streaks: 0 }));
        console.log('Streak reset due to missed day');
      }
    } catch (error) {
      console.error('Error checking streak:', error);
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Keep going! 🚀",
      "You're on fire! 🔥",
      "Amazing progress! ⭐",
      "Unstoppable! 💪",
      "Level up achieved! 🎯",
      "You're crushing it! 💎",
      "Brilliant work! ✨",
      "Fantastic! 🌟",
      "Outstanding! 🏆",
      "You're a star! ⭐"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Legendary streak! You're unstoppable! 🏆";
    if (streak >= 20) return "Incredible dedication! Keep it up! 🔥";
    if (streak >= 10) return "10 days strong! You're on fire! 🎯";
    if (streak >= 5) return "5-day streak! You're building a habit! ⭐";
    return "Great consistency! Keep going! 💪";
  };

  const incrementStreak = async () => {
    try {
      const today = new Date().toDateString();
      const lastStreakDate = await AsyncStorage.getItem('@VT_LAST_STREAK_DATE');

      // Check if streak was already incremented today
      if (lastStreakDate === today) {
        return; // Already incremented today
      }

      // Check if this is consecutive day
      const currentStreak = await AsyncStorage.getItem('@VT_STREAKS');
      const streak = currentStreak ? parseInt(currentStreak) : 0;
      
      if (lastStreakDate) {
        const lastDate = new Date(lastStreakDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day, increment streak
          const newStreak = streak + 1;
          await AsyncStorage.setItem('@VT_STREAKS', newStreak.toString());
          await AsyncStorage.setItem('@VT_LAST_STREAK_DATE', today);
          setStats(prev => ({ ...prev, streaks: newStreak }));
          
          // Check for streak milestones
          if ([5, 10, 15, 20, 30, 50, 100].includes(newStreak)) {
            setStreakMilestoneData({ streak: newStreak });
            setStreakMilestoneVisible(true);
          }
        } else if (diffDays === 0) {
          // Same day, already handled above
          return;
        } else {
          // Missed days, reset to 1 (starting fresh)
          await AsyncStorage.setItem('@VT_STREAKS', '1');
          await AsyncStorage.setItem('@VT_LAST_STREAK_DATE', today);
          setStats(prev => ({ ...prev, streaks: 1 }));
        }
      } else {
        // First time earning points
        await AsyncStorage.setItem('@VT_STREAKS', '1');
        await AsyncStorage.setItem('@VT_LAST_STREAK_DATE', today);
        setStats(prev => ({ ...prev, streaks: 1 }));
      }
    } catch (error) {
      console.error('Error incrementing streak:', error);
    }
  };

  const incrementPoints = async (points: number) => {
    try {
      const currentPoints = stats.points + points;
      const newLevel = Math.floor(currentPoints / 100) + 1;
      const progressInLevel = currentPoints % 100;
      
      await AsyncStorage.setItem('@VT_POINTS', currentPoints.toString());
      
      // Update stats including level
      setStats(prev => ({ 
        ...prev, 
        points: currentPoints,
        level: newLevel
      }));
      setLevelProgress(progressInLevel);

      // Check if user leveled up
      if (newLevel > stats.level) {
        setLevelUpData({ level: newLevel, points: currentPoints });
        setLevelUpModalVisible(true);
      }

      // Increment streak (only once per day)
      await incrementStreak();
    } catch (error) {
      console.error('Error incrementing points:', error);
    }
  };


  const playAudio = async () => {
    if (!dailyWord?.audio) {
      Alert.alert('No Audio', 'Audio file not available for this word');
      return;
    }

    try {
      // Stop and unload any existing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // Get audio source from database path using centralized loader
      const audioSource = getAudio(dailyWord.audio);

      if (!audioSource) {
        Alert.alert('Audio Not Found', `Audio file for "${dailyWord.word}" is not available`);
        return;
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

  const checkIfPointsAwarded = async (wordId: number, action: 'review' | 'learned'): Promise<boolean> => {
    try {
      const key = `@VT_POINTS_AWARDED_${wordId}_${action}`;
      const awarded = await AsyncStorage.getItem(key);
      return awarded === 'true';
    } catch (error) {
      console.error('Error checking points awarded:', error);
      return false;
    }
  };

  const markPointsAwarded = async (wordId: number, action: 'review' | 'learned') => {
    try {
      const key = `@VT_POINTS_AWARDED_${wordId}_${action}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking points awarded:', error);
    }
  };

  const handleAddToReview = async () => {
    try {
      if (!dailyWord) return;
      
      // Check if points were already awarded for this action
      const alreadyAwarded = await checkIfPointsAwarded(dailyWord.id, 'review');
      
      if (alreadyAwarded) {
        await setReviewFlag(dailyWord.id, 1);
        Alert.alert('Already Added', 'This word is already in your review list. No additional points awarded.');
        return;
      }
      
      await setReviewFlag(dailyWord.id, 1);
      await incrementPoints(5);
      await markPointsAwarded(dailyWord.id, 'review');
      
      // Save last reviewed word for Continue Learning feature
      await AsyncStorage.setItem('@VT_LAST_ACTIVITY', `Added to Review: ${dailyWord.word}`);
      await AsyncStorage.setItem('@VT_LAST_REVIEWED_WORD_ID', dailyWord.id.toString());
      setLastActivity(`Added to Review: ${dailyWord.word}`);
      setLastReviewedWordId(dailyWord.id);
      
      Alert.alert('Success', 'Word added to review list! +5 points');
    } catch (error) {
      console.error('Error adding to review:', error);
      Alert.alert('Error', 'Failed to add word to review');
    }
  };

  const handleMarkLearned = async () => {
    try {
      if (!dailyWord) return;
      
      // Check if points were already awarded for this action
      const alreadyAwarded = await checkIfPointsAwarded(dailyWord.id, 'learned');
      
      if (alreadyAwarded) {
        await AsyncStorage.setItem('@VT_LAST_ACTIVITY', `Learned: ${dailyWord.word}`);
        Alert.alert('Already Learned', 'You already learned this word. No additional points awarded.');
        setLastActivity(`Learned: ${dailyWord.word}`);
        return;
      }
      
      await incrementPoints(10);
      await markPointsAwarded(dailyWord.id, 'learned');
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
          <Text style={styles.example}>&ldquo;{dailyWord.example}&rdquo;</Text>
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

      {/* Level Progress Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Current Level</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="ribbon" size={24} color="#FFD700" />
              <Text style={styles.levelNumber}>{stats.level}</Text>
            </View>
          </View>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>{stats.points} pts</Text>
            <Text style={styles.nextLevelLabel}>{100 - levelProgress} pts to next level</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{levelProgress}/100</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="trophy" size={28} color="#FFA726" />
          <Text style={styles.statNumber}>{stats.points}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="flame" size={28} color="#FF5722" />
          <Text style={styles.statNumber}>{stats.streaks}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </TouchableOpacity>
      </View>


      {/* Continue Learning */}
      <View style={styles.continueCard}>
        <Text style={styles.continueTitle}>Continue Learning</Text>
        <Text style={styles.continueText}>{lastActivity}</Text>
        {lastReviewedWordId ? (
          <Link href={`/wordlist/details?id=${lastReviewedWordId}`} asChild>
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Resume</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </Link>
        ) : (
          <Link href="/wordlist" asChild>
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Browse Words</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </Link>
        )}
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

      {/* Level Up Modal */}
      <Modal
        visible={levelUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLevelUpModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.celebrationModalContainer}
          activeOpacity={1}
          onPress={() => setLevelUpModalVisible(false)}
        >
          <View style={styles.celebrationCard}>
            {/* Confetti Effect (Visual decoration) */}
            <View style={styles.confettiContainer}>
              <Text style={styles.confetti}>🎉</Text>
              <Text style={styles.confetti}>⭐</Text>
              <Text style={styles.confetti}>🎊</Text>
              <Text style={styles.confetti}>✨</Text>
              <Text style={styles.confetti}>🌟</Text>
              <Text style={styles.confetti}>💫</Text>
            </View>

            {/* Level Badge with Glow Effect */}
            <View style={styles.glowingBadge}>
              <View style={styles.glowEffect} />
              <View style={styles.levelBadgeContainer}>
                <Ionicons name="trophy" size={80} color="#FFD700" />
                <View style={styles.levelNumberBadge}>
                  <Text style={styles.levelUpNumber}>{levelUpData.level}</Text>
                </View>
              </View>
            </View>

            {/* Level Up Title */}
            <Text style={styles.levelUpTitle}>🎉 LEVEL UP! 🎉</Text>
            <Text style={styles.levelUpSubtitle}>Level {levelUpData.level} Achieved!</Text>
            
            {/* Motivational Message */}
            <View style={styles.motivationalBox}>
              <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
            </View>

            {/* Progress Stats */}
            <View style={styles.levelUpStats}>
              <View style={styles.levelUpStatItem}>
                <Ionicons name="star" size={24} color="#FFA726" />
                <Text style={styles.levelUpStatValue}>{levelUpData.points}</Text>
                <Text style={styles.levelUpStatLabel}>Total Points</Text>
              </View>
              <View style={styles.levelUpDivider} />
              <View style={styles.levelUpStatItem}>
                <Ionicons name="trending-up" size={24} color="#4CAF50" />
                <Text style={styles.levelUpStatValue}>{100 - (levelUpData.points % 100)}</Text>
                <Text style={styles.levelUpStatLabel}>To Next Level</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.levelUpProgressContainer}>
              <Text style={styles.levelUpProgressLabel}>Level {levelUpData.level} Progress</Text>
              <View style={styles.levelUpProgressBar}>
                <View style={[styles.levelUpProgressFill, { width: `${levelUpData.points % 100}%` }]} />
              </View>
              <Text style={styles.levelUpProgressText}>{levelUpData.points % 100}/100</Text>
            </View>

            {/* Close Instructions */}
            <View style={styles.tapToCloseContainer}>
              <Ionicons name="hand-left-outline" size={20} color="#999" />
              <Text style={styles.tapToCloseText}>Tap anywhere to close</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Streak Milestone Modal */}
      <Modal
        visible={streakMilestoneVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStreakMilestoneVisible(false)}
      >
        <TouchableOpacity 
          style={styles.celebrationModalContainer}
          activeOpacity={1}
          onPress={() => setStreakMilestoneVisible(false)}
        >
          <View style={styles.celebrationCard}>
            {/* Fire Effect */}
            <View style={styles.confettiContainer}>
              <Text style={styles.confetti}>🔥</Text>
              <Text style={styles.confetti}>⚡</Text>
              <Text style={styles.confetti}>🔥</Text>
              <Text style={styles.confetti}>💪</Text>
              <Text style={styles.confetti}>🔥</Text>
              <Text style={styles.confetti}>⭐</Text>
            </View>

            {/* Streak Badge with Glow */}
            <View style={styles.glowingBadge}>
              <View style={styles.glowEffectOrange} />
              <View style={styles.levelBadgeContainer}>
                <Ionicons name="flame" size={80} color="#FF5722" />
                <View style={styles.streakNumberBadge}>
                  <Text style={styles.levelUpNumber}>{streakMilestoneData.streak}</Text>
                </View>
              </View>
            </View>

            {/* Streak Title */}
            <Text style={styles.levelUpTitle}>🔥 STREAK MILESTONE! 🔥</Text>
            <Text style={styles.levelUpSubtitle}>{streakMilestoneData.streak} Days Strong!</Text>
            
            {/* Motivational Message */}
            <View style={styles.motivationalBoxOrange}>
              <Text style={styles.motivationalText}>{getStreakMessage(streakMilestoneData.streak)}</Text>
            </View>

            {/* Streak Stats */}
            <View style={styles.streakStatsContainer}>
              <View style={styles.streakStatBox}>
                <Text style={styles.streakStatNumber}>{streakMilestoneData.streak}</Text>
                <Text style={styles.streakStatLabel}>Consecutive Days</Text>
              </View>
              <View style={styles.streakStatBox}>
                <Text style={styles.streakStatNumber}>{streakMilestoneData.streak * 5}+</Text>
                <Text style={styles.streakStatLabel}>Points Earned</Text>
              </View>
            </View>

            {/* Achievement Message */}
            <View style={styles.achievementBox}>
              <Ionicons name="ribbon" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>
                You&apos;re building an amazing learning habit!
              </Text>
            </View>

            {/* Close Instructions */}
            <View style={styles.tapToCloseContainer}>
              <Ionicons name="hand-left-outline" size={20} color="#999" />
              <Text style={styles.tapToCloseText}>Tap anywhere to close</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  levelCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  pointsInfo: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nextLevelLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 45,
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
  // Celebration Modal Styles
  celebrationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  confetti: {
    fontSize: 40,
    transform: [{ rotate: '15deg' }],
  },
  glowingBadge: {
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFD700',
    opacity: 0.3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  glowEffectOrange: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF5722',
    opacity: 0.3,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  levelBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
    position: 'relative',
  },
  levelNumberBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  streakNumberBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelUpNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelUpTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelUpSubtitle: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  motivationalBox: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  motivationalBoxOrange: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  motivationalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  levelUpStats: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  levelUpStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  levelUpStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  levelUpStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  levelUpDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  levelUpProgressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  levelUpProgressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelUpProgressBar: {
    width: '100%',
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelUpProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  levelUpProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
  },
  tapToCloseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  tapToCloseText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  // Streak Milestone Specific Styles
  streakStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  streakStatBox: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  streakStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 4,
  },
  streakStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    textAlign: 'center',
  },
});
