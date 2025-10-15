import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllWords, getWordsByDifficulty, setReviewFlag, toggleFavorite } from './utils/database';
import { getAudioSource, getImageSource } from './utils/mediaLoader';

interface Word {
  id: number;
  word: string;
  meaning: string;
  example: string;
  image: string;
  audio: string;
  difficulty: string;
  favorite: number;
  reviewFlag: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

const FlashCard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State management
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [learnedWords, setLearnedWords] = useState<Set<number>>(new Set());
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Animated values
  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        swipeAnim.flattenOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
        const opacity = 1 - Math.abs(gestureState.dx) / (SCREEN_WIDTH * 0.8);
        swipeOpacity.setValue(Math.max(0.5, opacity));
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        
        const shouldSwipe = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;
        
        if (shouldSwipe) {
          if (dx > 0) {
            handleSwipe('right');
          } else {
            handleSwipe('left');
          }
        } else {
          Animated.parallel([
            Animated.spring(swipeAnim, {
              toValue: 0,
              friction: 7,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(swipeOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadWords();
    loadSessionData();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [selectedDifficulty]);

  const loadWords = async () => {
    try {
      setLoading(true);
      let fetchedWords;

      if (selectedDifficulty === 'all') {
        fetchedWords = await getAllWords();
      } else {
        fetchedWords = await getWordsByDifficulty(selectedDifficulty);
      }

      const shuffled = fetchedWords.sort(() => Math.random() - 0.5);
      setWords(shuffled);

      // Load learned words from database (reviewFlag === 2)
      const learnedWordIds = new Set(
        fetchedWords
          .filter(word => word.reviewFlag === 2)
          .map(word => word.id)
      );
      setLearnedWords(learnedWordIds);

      const savedIndex = await AsyncStorage.getItem('@VT_FC_LAST_INDEX');
      if (savedIndex && parseInt(savedIndex) < shuffled.length) {
        setCurrentIndex(parseInt(savedIndex));
      } else {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = async () => {
    try {
      const points = await AsyncStorage.getItem('@VT_FC_SESSION_POINTS');
      if (points) {
        setSessionPoints(parseInt(points));
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const saveSessionData = async () => {
    try {
      await AsyncStorage.setItem('@VT_FC_LAST_INDEX', currentIndex.toString());
      await AsyncStorage.setItem('@VT_FC_SESSION_POINTS', sessionPoints.toString());
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  useEffect(() => {
    saveSessionData();
  }, [currentIndex, sessionPoints]);

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
    setHasInteracted(true);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    // Check if we can actually swipe in this direction
    const canSwipe = (direction === 'left' && currentIndex < words.length - 1) || 
                     (direction === 'right' && currentIndex > 0);
    
    if (!canSwipe) {
      return; // Don't animate if we're at the edge
    }

    const toValue = direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    
    Animated.parallel([
      Animated.timing(swipeAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(swipeOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (direction === 'left') {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(currentIndex - 1);
      }
      
      swipeAnim.setValue(0);
      flipAnim.setValue(0);
      swipeOpacity.setValue(1);
      setIsFlipped(false);
      setHasInteracted(false);
    });
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      handleSwipe('left');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleSwipe('right');
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentWord) return;

    try {
      await toggleFavorite(currentWord.id);
      
      const updatedWords = [...words];
      updatedWords[currentIndex] = {
        ...updatedWords[currentIndex],
        favorite: updatedWords[currentIndex].favorite === 1 ? 0 : 1
      };
      setWords(updatedWords);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const checkIfPointsAwarded = async (wordId: number, action: 'learned'): Promise<boolean> => {
    try {
      const key = `@VT_POINTS_AWARDED_${wordId}_${action}`;
      const awarded = await AsyncStorage.getItem(key);
      return awarded === 'true';
    } catch (error) {
      console.error('Error checking points awarded:', error);
      return false;
    }
  };

  const markPointsAwarded = async (wordId: number, action: 'learned') => {
    try {
      const key = `@VT_POINTS_AWARDED_${wordId}_${action}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking points awarded:', error);
    }
  };

  const handleToggleLearned = async () => {
    if (!currentWord) return;

    try {
      const isCurrentlyLearned = learnedWords.has(currentWord.id);
      const newLearnedState = !isCurrentlyLearned;
      
      await setReviewFlag(currentWord.id, newLearnedState ? 2 : 0);
      
      if (newLearnedState) {
        // Check if points were already awarded for this word
        const alreadyAwarded = await checkIfPointsAwarded(currentWord.id, 'learned');
        
        setLearnedWords(prev => new Set(prev).add(currentWord.id));
        
        if (!alreadyAwarded) {
          const bonusPoints = 10;
          setSessionPoints(prev => prev + bonusPoints);
          
          const currentPoints = await AsyncStorage.getItem('@VT_POINTS');
          const newTotal = (currentPoints ? parseInt(currentPoints) : 0) + bonusPoints;
          await AsyncStorage.setItem('@VT_POINTS', newTotal.toString());
          await markPointsAwarded(currentWord.id, 'learned');
        }
        
        await AsyncStorage.setItem('@VT_LAST_ACTIVITY', `Learned: ${currentWord.word}`);
      } else {
        setLearnedWords(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentWord.id);
          return newSet;
        });
        // Note: We don't remove points when unmarking as learned
        // Points awarded are permanent once earned
      }
    } catch (error) {
      console.error('Error toggling learned:', error);
    }
  };

  const handleShuffle = async () => {
    try {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setWords(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setHasInteracted(false);
      
      swipeAnim.setValue(0);
      flipAnim.setValue(0);
      swipeOpacity.setValue(1);
    } catch (error) {
      console.error('Error shuffling:', error);
    }
  };

  const playAudio = async () => {
    if (!currentWord?.audio) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      const audioSource = getAudioSource(currentWord.audio);
      if (!audioSource) {
        console.log('Audio file not found');
        return;
      }

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
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="document-outline" size={64} color="#999" />
        <Text style={styles.emptyText}>No words available</Text>
        <Text style={styles.emptySubtext}>Try selecting a different difficulty</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((learnedWords.size) / words.length) * 100;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.headerButton}>
          <Ionicons name="filter" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedDifficulty === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedDifficulty('all')}
          >
            <Text style={[styles.filterText, selectedDifficulty === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedDifficulty === 'easy' && styles.filterButtonActive]}
            onPress={() => setSelectedDifficulty('easy')}
          >
            <Text style={[styles.filterText, selectedDifficulty === 'easy' && styles.filterTextActive]}>Easy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedDifficulty === 'medium' && styles.filterButtonActive]}
            onPress={() => setSelectedDifficulty('medium')}
          >
            <Text style={[styles.filterText, selectedDifficulty === 'medium' && styles.filterTextActive]}>Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedDifficulty === 'hard' && styles.filterButtonActive]}
            onPress={() => setSelectedDifficulty('hard')}
          >
            <Text style={[styles.filterText, selectedDifficulty === 'hard' && styles.filterTextActive]}>Hard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {learnedWords.size} / {words.length} learned
          </Text>
          <Text style={styles.pointsText}>+{sessionPoints} pts</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Card Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>

      {/* Flashcard Container */}
      <View style={styles.cardContainer}>
        <View style={styles.cardInnerContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.cardAnimatedWrapper,
              {
                transform: [{ translateX: swipeAnim }],
                opacity: swipeOpacity,
              },
            ]}
          >
            {/* Front of card */}
            <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                {
                  transform: [{ rotateY: frontInterpolate }],
                  opacity: frontOpacity,
                },
              ]}
              pointerEvents={isFlipped ? 'none' : 'auto'}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleFlip}
                style={styles.cardTouchable}
              >
                <View style={styles.cardContentWrapper}>
                  <View style={styles.frontHeader}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) }]}>
                      <Text style={styles.difficultyText}>{currentWord.difficulty.toUpperCase()}</Text>
                    </View>
                    {currentWord.audio && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          playAudio();
                        }} 
                        style={styles.audioButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isPlaying ? "pause-circle" : "volume-high"}
                          size={32}
                          color="#2196F3"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.frontContent}>
                    <Text style={styles.wordText}>{currentWord.word}</Text>
                    <Text style={styles.meaningText}>{currentWord.meaning}</Text>
                  </View>
                  
                  {/* Action Buttons Inside Card - Front */}
                  <View style={styles.cardActionButtons}>
                    <TouchableOpacity 
                      style={styles.cardActionButton} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleLearned();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={learnedWords.has(currentWord.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
                        size={24} 
                        color={learnedWords.has(currentWord.id) ? "#4CAF50" : "#999"} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cardActionButton} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={currentWord.favorite === 1 ? "heart" : "heart-outline"} 
                        size={24} 
                        color={currentWord.favorite === 1 ? "#FF4081" : "#999"} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cardActionButton} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShuffle();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shuffle-outline" size={24} color="#FF9800" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.flipHint}>
                    <Ionicons name="sync-outline" size={20} color="#999" />
                    <Text style={styles.flipHintText}>Tap to flip</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Back of card */}
            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                {
                  transform: [{ rotateY: backInterpolate }],
                  opacity: backOpacity,
                },
              ]}
              pointerEvents={isFlipped ? 'auto' : 'none'}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleFlip}
                style={styles.cardTouchable}
              >
                <ScrollView 
                  style={styles.backScrollView}
                  contentContainerStyle={styles.backScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.backHeader}>
                    <Text style={styles.backWord}>{currentWord.word}</Text>
                    {currentWord.audio && (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          playAudio();
                        }} 
                        style={styles.audioButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isPlaying ? "pause-circle" : "volume-high"}
                          size={32}
                          color="#2196F3"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {currentWord.image && (() => {
                    try {
                      const imageSource = getImageSource(currentWord.image);
                      if (imageSource) {
                        return (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setImageModalVisible(true);
                            }}
                            activeOpacity={0.85}
                            style={styles.imageContainer}
                          >
                            <Image
                              source={imageSource}
                              style={styles.wordImage}
                              resizeMode="cover"
                            />
                            <View style={styles.imageOverlay}>
                              <Ionicons name="expand-outline" size={20} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        );
                      }
                    } catch (error) {
                      console.error('Error loading image:', error);
                    }
                    return null;
                  })()}

                  {currentWord.example && (
                    <View style={styles.exampleContainer}>
                      <View style={styles.exampleIcon}>
                        <Ionicons name="chatbox-ellipses-outline" size={20} color="#2196F3" />
                      </View>
                      <Text style={styles.exampleText}>{currentWord.example}</Text>
                    </View>
                  )}

                  {/* Action Buttons Inside Card - Back */}
                  <View style={styles.cardActionButtonsBack}>
                    <TouchableOpacity 
                      style={styles.cardActionButtonWithLabel} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleLearned();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={learnedWords.has(currentWord.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
                        size={24} 
                        color={learnedWords.has(currentWord.id) ? "#4CAF50" : "#999"} 
                      />
                      <Text style={[styles.cardActionLabel, learnedWords.has(currentWord.id) && styles.cardActionLabelActive]}>
                        Learned
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cardActionButtonWithLabel} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={currentWord.favorite === 1 ? "heart" : "heart-outline"} 
                        size={24} 
                        color={currentWord.favorite === 1 ? "#FF4081" : "#999"} 
                      />
                      <Text style={[styles.cardActionLabel, currentWord.favorite === 1 && styles.cardActionLabelActive]}>
                        Favorite
      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.cardActionButtonWithLabel} 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShuffle();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shuffle-outline" size={24} color="#FF9800" />
                      <Text style={styles.cardActionLabel}>Shuffle</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      {/* Navigation Arrows */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom + 70 }]}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chevron-back" 
            size={32} 
            color={currentIndex === 0 ? '#ccc' : '#2196F3'} 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, currentIndex === words.length - 1 && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={currentIndex === words.length - 1}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chevron-forward" 
            size={32} 
            color={currentIndex === words.length - 1 ? '#ccc' : '#2196F3'} 
          />
        </TouchableOpacity>
      </View>

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
              <Text style={styles.modalTitle}>{currentWord?.word}</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>
            {currentWord?.image && (() => {
              const imageSource = getImageSource(currentWord.image);
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
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
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

export default FlashCard;

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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2196F3',
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  cardContainer: {
 
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  cardInnerContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    maxHeight: 500,
  },
  cardAnimatedWrapper: {
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    backfaceVisibility: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardFront: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    justifyContent: 'flex-start',
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
  },
  cardContentWrapper: {
    flex: 1,
    padding: 24,
  },
  frontHeader: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  difficultyBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  audioButton: {
    padding: 4,
  },
  frontContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  meaningText: {
    fontSize: 18,
    color: '#555',
    lineHeight: 26,
    textAlign: 'center',
  },
  cardActionButtons: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  cardActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  flipHint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  backScrollView: {
    flex: 1,
  },
  backScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backWord: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  wordImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    marginBottom: 16,
  },
  exampleIcon: {
    marginTop: 2,
  },
  exampleText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  cardActionButtonsBack: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  cardActionButtonWithLabel: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardActionLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  cardActionLabelActive: {
    color: '#333',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#f5f5f5',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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