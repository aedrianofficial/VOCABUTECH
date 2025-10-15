import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const [mushroomName, setMushroomName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadMushroomName();
  }, []);

  const loadMushroomName = async () => {
    try {
      const name = await AsyncStorage.getItem('@VT_MUSHROOM_NAME');
      if (name) {
        setMushroomName(name);
        setNewName(name);
      }
    } catch (error) {
      console.error('Error loading mushroom name:', error);
    }
  };

  const handleSaveName = async () => {
    if (newName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please choose a longer name for your mushroom friend!');
      return;
    }

    try {
      await AsyncStorage.setItem('@VT_MUSHROOM_NAME', newName.trim());
      setMushroomName(newName.trim());
      setEditingName(false);
      Alert.alert('Success', 'Mushroom name updated! 🍄');
    } catch (error) {
      console.error('Error saving mushroom name:', error);
      Alert.alert('Error', 'Failed to save mushroom name');
    }
  };

  const handleCancelEdit = () => {
    setNewName(mushroomName);
    setEditingName(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Mushroom Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.mushroomEmoji}>🍄</Text>
          <Text style={styles.sectionTitle}>Your Mushroom Learner</Text>
          
          {!editingName ? (
            <View style={styles.nameDisplay}>
              <Text style={styles.mushroomName}>{mushroomName || 'No Name'}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setEditingName(true)}
              >
                <Ionicons name="pencil" size={20} color="#2196F3" />
                <Text style={styles.editButtonText}>Edit Name</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter new name..."
                placeholderTextColor="#999"
                maxLength={20}
                autoCapitalize="words"
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveName}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About VOCABUtech</Text>
              <Text style={styles.infoText}>Where Words Grow Wild 🌱</Text>
            </View>
          </View>
        </View>

        {/* Learning Stats Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="bulb" size={24} color="#FFD700" />
            <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Learning Tips</Text>
            <Text style={styles.infoText}>• Add words to review to earn 5 points</Text>
            <Text style={styles.infoText}>• Mark words as learned to earn 10 points</Text>
            <Text style={styles.infoText}>• Ace quizzes to earn more points</Text>
            <Text style={styles.infoText}>• Build daily streaks for consistency</Text>
            <Text style={styles.infoText}>• Level up every 100 points!</Text>

            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 120, // Space for bottom nav
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mushroomEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  nameDisplay: {
    alignItems: 'center',
    width: '100%',
  },
  mushroomName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  editButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  editContainer: {
    width: '100%',
  },
  nameInput: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 4,
  },
});