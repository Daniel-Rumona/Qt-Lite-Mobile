import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Colors from '@/constants/Colors';
import { Stack, useRouter } from 'expo-router'; // Import useRouter for navigation
import Transactions from "@/components/Transactions"; // Import the updated transactions
import { AntDesign } from '@expo/vector-icons'; // Import AntDesign for the "+" icon

const Page = () => {
  const router = useRouter(); // Initialize the router for navigation

  const handleAddTransaction = () => {
    // Navigate to the TransactionForm screen
    router.push('pages/TransactionForm');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Row with "My Transactions" and "+" button */}
        <View style={styles.header}>
          <Text style={styles.text}>My Transactions</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
            <AntDesign name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Vertical list of Transactions */}
        <Transactions />
      </View>
    </>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Adjust padding to show the text and button at the top
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row', // Align items horizontally
    justifyContent: 'space-between', // Distribute the space between text and button
    alignItems: 'center', // Vertically align both elements in the center
    paddingHorizontal: 20,
    marginBottom: 20, // Space between the header and the transactions list
  },
  text: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: "#4CAF50", // Green button for "+"
    padding: 10,
    borderRadius: 50,
  },
});
