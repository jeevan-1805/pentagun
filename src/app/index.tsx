// src/app/index.tsx
import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const handleCreateRoom = () => {
    router.push('/create-room');
    // We will hook up navigation to the Create Room screen next
    console.log('Navigate to Create Room');
  };

  const handleJoinRoom = () => {
    router.push('/join-room');
    // We will hook up navigation to the Join Room screen next
    console.log('Navigate to Join Room');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Title Section */}
        <View style={styles.heroSection}>
          <ThemedText type="title" style={styles.title}>
            PentaGun
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Multiplayer Turn-Based Survival
          </ThemedText>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleCreateRoom}>
            <ThemedText style={styles.buttonText}>Create Room</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleJoinRoom}>
            <ThemedText style={styles.buttonText}>Join Room</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    paddingBottom: 32,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#E63946', // Vibrant accent color suitable for a gun/survival theme
  },
  secondaryButton: {
    backgroundColor: '#1D3557', // Clean dark contrast button
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});