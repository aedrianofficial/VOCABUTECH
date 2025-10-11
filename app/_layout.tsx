import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomNav from "./components/BottomNav";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="word_list" options={{ title: "Word List", headerShown: true, headerBackTitle: "Back" }} />
          <Stack.Screen name="quiz" options={{ title: "Quiz", headerShown: true, headerBackTitle: "Back" }} />
          <Stack.Screen name="flash_card" options={{ title: "Flash Cards", headerShown: true, headerBackTitle: "Back" }} />
          <Stack.Screen name="settings" options={{ title: "Settings", headerShown: true, headerBackTitle: "Back" }} />
        </Stack>
        <BottomNav />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
