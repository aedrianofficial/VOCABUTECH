import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomNav from "./components/BottomNav";
import { ProgressProvider } from "./contexts/ProgressContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name="index" 
              options={{ 
                title: "Loading",
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="welcome" 
              options={{ 
                title: "Welcome",
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="home" 
              options={{ 
                title: "Home",
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="wordlist/index" 
              options={{ title: "Select Difficulty", headerShown: false }} 
            />
            <Stack.Screen 
              name="wordlist/list" 
              options={{ title: "Word List", headerShown: false }} 
            />
            <Stack.Screen 
              name="wordlist/details" 
              options={{ title: "Word Details", headerShown: false }} 
            />
            <Stack.Screen 
              name="quiz/index" 
              options={{ title: "Select Quiz", headerShown: false }} 
            />
            <Stack.Screen 
              name="quiz/easy" 
              options={{ title: "Easy Quiz", headerShown: false }} 
            />
            <Stack.Screen 
              name="quiz/medium" 
              options={{ title: "Medium Quiz", headerShown: false }} 
            />
            <Stack.Screen 
              name="quiz/hard" 
              options={{ title: "Hard Quiz", headerShown: false }} 
            />
            <Stack.Screen name="flash_card" options={{ title: "Flash Cards", headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: "Settings", headerShown: true, headerBackTitle: "Back" }} />
          </Stack>
          <BottomNav />
        </View>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
