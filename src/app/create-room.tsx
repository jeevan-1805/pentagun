// src/app/create-room.tsx
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GAME_CONFIG } from '@/types/game';

export default function CreateRoomScreen() {
  // First release restricts player count to 2
  const [selectedPlayers, setSelectedPlayers] = useState<number>(GAME_CONFIG.RELEASE_MAX_PLAYERS);
  
  // Mock connection status for Player 2 (will be replaced by actual networking later)
  const [isPlayer2Connected, setIsPlayer2Connected] = useState<boolean>(false);

  const handleStartGame = () => {
    if (!isPlayer2Connected) {
      Alert.alert('Waiting for Players', 'Player 2 must connect before the host can start the game.');
      return;
    }
      // We will navigate to the main game board next
    router.push('/game');
    console.log('Starting match...');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backText}><ArrowLeft size={25} color="#beafaf" /></ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Create Room</ThemedText>
        </View>

        {/* Player Count Selector */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select Player Count</ThemedText>
          <View style={styles.playerCountRow}>
            {[2, 3, 4, 5, 6].map((count) => {
              const isEnabled = count <= GAME_CONFIG.RELEASE_MAX_PLAYERS;
              const isSelected = selectedPlayers === count;
              return (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.playerCountButton,
                    isSelected && styles.selectedPlayerButton,
                    !isEnabled && styles.disabledPlayerButton,
                  ]}
                  onPress={() => {
                    if (isEnabled) setSelectedPlayers(count);
                  }}
                >
                  <ThemedText style={[styles.playerCountText, !isEnabled && styles.disabledText]}>
                    {count}P
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          <ThemedText style={styles.note}>* 3–6 player configurations are locked for future updates.</ThemedText>
        </View>

        {/* Lobby Participant Status */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Lobby Status</ThemedText>
          <View style={styles.lobbyCard}>
            <ThemedText style={styles.lobbyRow}>• Player 1 (Host): Connected</ThemedText>
            <ThemedText style={styles.lobbyRow}>
              • Player 2: {isPlayer2Connected ? 'Connected' : 'Waiting...'}
            </ThemedText>

            {/* Handy simulation toggle for testing UI before networking is wired up */}
            <TouchableOpacity 
              style={styles.mockButton} 
              onPress={() => setIsPlayer2Connected(!isPlayer2Connected)}
            >
              <ThemedText style={styles.mockButtonText}>
                Play Offline: {isPlayer2Connected ? 'Turned On' : 'Turned Off'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Game Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            !isPlayer2Connected && styles.disabledStartButton,
          ]}
          onPress={handleStartGame}
        >
          <ThemedText style={styles.buttonText}>Start Game</ThemedText>
        </TouchableOpacity>
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
    gap: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  playerCountRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  playerCountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  selectedPlayerButton: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  disabledPlayerButton: {
    opacity: 0.3,
    backgroundColor: '#f1f1f1',
  },
  playerCountText: {
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  note: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  lobbyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  lobbyRow: {
    fontSize: 16,
  },
  mockButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    alignItems: 'center',
  },
  mockButtonText: {
    fontSize: 12,
    color: '#333',
  },
  startButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledStartButton: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});