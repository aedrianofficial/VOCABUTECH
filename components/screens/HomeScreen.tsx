import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Word of the Day</Text>
      <Text>Edit app/index.tsx to edit this screen.</Text>

      <Link href="/word_list">
        <Text>Word List</Text>
      </Link>
      <Link href="/quiz">
        <Text>Quiz</Text>
      </Link>
      <Link href="/flash_card">
        <Text>Flash Cards</Text>
      </Link>
      <Link href="/settings">
        <Text>Settings</Text>
      </Link>
      
    </View>
    
  );
}
