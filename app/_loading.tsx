import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoadingScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Small delay for smooth appearance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const onboardingComplete = await AsyncStorage.getItem('@VT_ONBOARDING_COMPLETE');
      
      if (onboardingComplete === 'true') {
        // User has completed onboarding, go to home
        router.replace('/home');
      } else {
        // First time user, show welcome screen
        router.replace('/welcome');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to welcome screen on error
      router.replace('/welcome');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Image 
          source={require('../src/images/logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>VOCABUtech</Text>
        <Text style={styles.tagline}>Where Words Grow Wild 🌱</Text>
        <ActivityIndicator 
          size="large" 
          color="#2196F3" 
          style={styles.loader}
        />
      </View>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});


