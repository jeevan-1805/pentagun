// src/app/waiting.tsx
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Clock, Users, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WaitingScreen() {
  const handleLeaveRoom = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Leave Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeaveRoom} style={styles.backButton}>
            <ArrowLeft size={22} color="#333" />
            <ThemedText style={styles.backText}>Leave Room</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Central Waiting Section */}
        <View style={styles.heroSection}>
          <Clock size={64} color="#E63946" style={styles.iconSpacing} />
          <ThemedText type="title" style={styles.title}>Waiting for Host...</ThemedText>
          <ThemedText style={styles.subtitle}>
            The host will start the match shortly. Get ready!
          </ThemedText>
        </View>

        {/* Room Participants Status Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#1D3557" />
            <ThemedText style={styles.sectionTitle}>Room Participants</ThemedText>
          </View>

          <View style={styles.card}>
            <View style={styles.participantRow}>
              <ThemedText style={styles.participantName}>• Player 1 (Host)</ThemedText>
              <CheckCircle2 size={18} color="#2A9D8F" />
            </View>
            <View style={styles.participantRow}>
              <ThemedText style={styles.participantName}>• Player 2 (You)</ThemedText>
              <CheckCircle2 size={18} color="#2A9D8F" />
            </View>
          </View>
        </View>

        {/* Footer guidance */}
        <View style={styles.footer}>
          <ThemedText style={styles.note}>
            Your screen will automatically transition once the game starts.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  iconSpacing: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 12,
    backgroundColor: '#fff',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
  },
  note: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});