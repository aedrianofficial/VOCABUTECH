import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProgressContextType {
  stats: {
    points: number;
    level: number;
    streaks: number;
  };
  levelProgress: number;
  incrementPoints: (points: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  loadStats: () => Promise<void>;
  checkAndUpdateStreak: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState({
    points: 0,
    level: 1,
    streaks: 0
  });
  const [levelProgress, setLevelProgress] = useState(0);
  const [levelUpModalVisible, setLevelUpModalVisible] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1, points: 0 });
  const [streakMilestoneVisible, setStreakMilestoneVisible] = useState(false);
  const [streakMilestoneData, setStreakMilestoneData] = useState({ streak: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
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
  }, []);

  const checkAndUpdateStreak = useCallback(async () => {
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
  }, []);

  const incrementStreak = useCallback(async () => {
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
  }, []);

  const incrementPoints = useCallback(async (points: number) => {
    try {
      // Get current values from AsyncStorage to ensure accuracy
      const storedPoints = await AsyncStorage.getItem('@VT_POINTS');
      const currentTotalPoints = storedPoints ? parseInt(storedPoints) : 0;
      const currentLevel = Math.floor(currentTotalPoints / 100) + 1;
      
      // Calculate new values
      const newTotalPoints = currentTotalPoints + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;
      const progressInLevel = newTotalPoints % 100;
      
      console.log(`💎 Points awarded: +${points} (${currentTotalPoints} → ${newTotalPoints}, Level ${currentLevel})`);
      
      // Save to storage
      await AsyncStorage.setItem('@VT_POINTS', newTotalPoints.toString());
      
      // Update stats
      setStats(prev => ({ 
        ...prev, 
        points: newTotalPoints,
        level: newLevel
      }));
      setLevelProgress(progressInLevel);

      // Check if user leveled up (compare with current level, not state)
      if (newLevel > currentLevel) {
        console.log(`🎉 LEVEL UP! ${currentLevel} → ${newLevel} (${newTotalPoints} points)`);
        setLevelUpData({ level: newLevel, points: newTotalPoints });
        setLevelUpModalVisible(true);
      }

      // Increment streak (only once per day)
      await incrementStreak();
    } catch (error) {
      console.error('Error incrementing points:', error);
    }
  }, [incrementStreak]);

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

  return (
    <ProgressContext.Provider 
      value={{ 
        stats, 
        levelProgress, 
        incrementPoints, 
        incrementStreak, 
        loadStats, 
        checkAndUpdateStreak 
      }}
    >
      {children}

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
                You're building an amazing learning habit!
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
    </ProgressContext.Provider>
  );
};

const styles = StyleSheet.create({
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

