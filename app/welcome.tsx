import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mushroomName, setMushroomName] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = async () => {
    if (mushroomName.trim().length === 0) {
      Alert.alert('Name Required', 'Please give your mushroom learner a name to continue! 🍄');
      return;
    }

    if (mushroomName.trim().length < 2) {
      Alert.alert('Name Too Short', 'Please choose a longer name for your mushroom friend! 🍄');
      return;
    }

    try {
      // Save mushroom name and mark onboarding as complete
      await AsyncStorage.setItem('@VT_MUSHROOM_NAME', mushroomName.trim());
      await AsyncStorage.setItem('@VT_ONBOARDING_COMPLETE', 'true');
      
      // Navigate to home screen
      router.replace('/home');
    } catch (error) {
      console.error('Error saving mushroom name:', error);
      Alert.alert('Error', 'Failed to save your mushroom name. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section with White Background */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../src/images/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sparklesContainer}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={styles.sparkle}>⭐</Text>
              <Text style={styles.sparkle}>✨</Text>
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>VOCABUtech</Text>
          
          {/* Tagline */}
          <View style={styles.taglineContainer}>
            <Ionicons name="leaf" size={20} color="#4CAF50" />
            <Text style={styles.tagline}>Where Words Grow Wild</Text>
            <Ionicons name="leaf" size={20} color="#4CAF50" />
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeEmoji}>🍄</Text>
            <Text style={styles.welcomeTitle}>Welcome, Word Explorer!</Text>
            <Text style={styles.welcomeMessage}>
              To get started, please give your mushroom learner a name!
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="pencil" size={20} color="#FF9800" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter mushroom name..."
              placeholderTextColor="#999"
              value={mushroomName}
              onChangeText={setMushroomName}
              maxLength={20}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleGetStarted}
            />
            {mushroomName.length > 0 && (
              <TouchableOpacity onPress={() => setMushroomName('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {mushroomName.trim().length > 0 && (
            <Text style={styles.previewText}>
              Your mushroom: <Text style={styles.previewName}>{mushroomName.trim()}</Text> 🍄
            </Text>
          )}

          {/* Get Started Button */}
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Learning Adventure</Text>
            <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Fun Facts */}
          <View style={styles.funFactsContainer}>
            <View style={styles.funFact}>
              <Ionicons name="star" size={16} color="#FFA726" />
              <Text style={styles.funFactText}>Earn points as you learn</Text>
            </View>
            <View style={styles.funFact}>
              <Ionicons name="flame" size={16} color="#FF5722" />
              <Text style={styles.funFactText}>Build learning streaks</Text>
            </View>
            <View style={styles.funFact}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.funFactText}>Level up your vocabulary</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  logoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 80,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#E3F2FD',
  },
  sparklesContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    flexDirection: 'row',
    gap: 6,
  },
  sparkle: {
    fontSize: 28,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(33, 150, 243, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  tagline: {
    fontSize: 16,
    color: '#4CAF50',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  welcomeBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    width: '100%',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewName: {
    fontWeight: 'bold',
    color: '#2196F3',
    fontSize: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    width: '100%',
    gap: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  funFactsContainer: {
    gap: 12,
    width: '100%',
  },
  funFact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  funFactText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

