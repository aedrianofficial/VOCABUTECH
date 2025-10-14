import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWordById, setReviewFlag, toggleFavorite } from '../utils/database';
import { getAudioSource as getAudio, getImageSource as getImage } from '../utils/mediaLoader';

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

const WordDetails = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    loadWordDetails();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const loadWordDetails = async () => {
    try {
      setLoading(true);
      if (!id) {
        Alert.alert('Error', 'No word ID specified');
        return;
      }
      const wordData = await getWordById(parseInt(id));
      if (wordData) {
        setWord(wordData);
        setIsFavorite(wordData.favorite === 1);
        setIsReview(wordData.reviewFlag === 1);
      } else {
        Alert.alert('Error', 'Word not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading word details:', error);
      Alert.alert('Error', 'Failed to load word details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (!word) return;
      const newStatus = await toggleFavorite(word.id);
      setIsFavorite(newStatus === 1);
      Alert.alert(
        'Success',
        newStatus === 1 ? 'Added to favorites!' : 'Removed from favorites!'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAddToReview = async () => {
    try {
      if (!word) return;
      await setReviewFlag(word.id, 1);
      setIsReview(true);
      Alert.alert('Success', 'Added to review list!');
    } catch (error) {
      console.error('Error adding to review:', error);
      Alert.alert('Error', 'Failed to add to review list');
    }
  };

  const handleMarkAsLearned = async () => {
    try {
      if (!word) return;
      await setReviewFlag(word.id, 0);
      setIsReview(false);
      Alert.alert('Success', 'Marked as learned!');
    } catch (error) {
      console.error('Error marking as learned:', error);
      Alert.alert('Error', 'Failed to mark as learned');
    }
  };

  const playAudio = async () => {
    if (!word?.audio) {
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
      const audioSource = getAudio(word.audio);

      if (!audioSource) {
        Alert.alert('Audio Not Found', `Audio file for "${word.word}" is not available`);
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
      Alert.alert('Error', `Failed to play audio for "${word?.word}". The audio file may be missing.`);
      setIsPlaying(false);
    }
  };

  const getDifficultyColor = () => {
    switch (word?.difficulty) {
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading word details...</Text>
      </View>
    );
  }

  if (!word) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Word not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: getDifficultyColor() + '10',
        paddingTop: insets.top + 10
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={getDifficultyColor()} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? '#F44336' : getDifficultyColor()}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Word Title & Audio */}
        <View style={styles.wordSection}>
          <View style={styles.wordTitleContainer}>
            <Text style={styles.wordTitle}>{word.word}</Text>
            {word.audio && (
              <TouchableOpacity onPress={playAudio} style={styles.audioButton}>
                <Ionicons 
                  name={isPlaying ? "pause-circle" : "play-circle"} 
                  size={48} 
                  color={getDifficultyColor()} 
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
            <Text style={styles.difficultyText}>
              {word.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Image */}
        {word.image && (() => {
          try {
            const imageSource = getImage(word.image);
            
            if (imageSource) {
              return (
                <TouchableOpacity 
                  onPress={() => setImageModalVisible(true)}
                  activeOpacity={0.8}
                  style={styles.imageContainer}
                >
                  <Image 
                    source={imageSource} 
                    style={styles.wordImage}
                    resizeMode="cover"
                    onError={() => {
                      console.error(`Failed to load image for ${word.word}`);
                    }}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={24} color="#fff" />
                    <Text style={styles.imageOverlayText}>Tap to view full image</Text>
                  </View>
                </TouchableOpacity>
              );
            }
          } catch (error) {
            console.error('Error loading image:', error);
          }
          return null;
        })()}

        {/* Meaning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Meaning</Text>
          </View>
          <Text style={styles.meaningText}>{word.meaning}</Text>
        </View>

        {/* Example */}
        {word.example && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color="#FF9800" />
              <Text style={styles.sectionTitle}>Example</Text>
            </View>
            <Text style={styles.exampleText}>"{word.example}"</Text>
          </View>
        )}

        {/* Status Info */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#F44336' : '#999'}
            />
            <Text style={styles.statusText}>
              {isFavorite ? 'Favorited' : 'Not in favorites'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons
              name={isReview ? 'flag' : 'flag-outline'}
              size={20}
              color={isReview ? '#FF9800' : '#999'}
            />
            <Text style={styles.statusText}>
              {isReview ? 'Needs review' : 'Learned'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isReview ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={handleAddToReview}
            >
              <Ionicons name="flag" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add to Review</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.learnedButton]}
              onPress={handleMarkAsLearned}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Mark as Learned</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Image Modal */}
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
              <Text style={styles.modalTitle}>{word?.word}</Text>
              <TouchableOpacity 
                onPress={() => setImageModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>

            {word?.image && (() => {
              const imageSource = getImage(word.image);
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

export default WordDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 140,
    flexGrow: 1,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  wordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  wordTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  audioButton: {
    padding: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  imageContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  wordImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  meaningText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    color: '#666',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  reviewButton: {
    backgroundColor: '#FF9800',
  },
  learnedButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
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
  errorText: {
    fontSize: 16,
    color: '#999',
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