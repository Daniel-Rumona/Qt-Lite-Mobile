import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Colors from '@/constants/Colors';
import { Stack, useRouter } from 'expo-router'; // Import useRouter for navigation
import Transactions from '@/components/Transactions'; // Import the updated transactions
import { AntDesign } from '@expo/vector-icons'; // Import AntDesign for icons

const Page = () => {
  const router = useRouter(); // Initialize the router for navigation

  const handleAddTransaction = () => {
    // Navigate to the TransactionForm screen
    router.push('/pages/TransactionForm');
  };

  const handleShowPlot = () => {
    // Navigate to the TransactionPlot screen
    router.push('/pages/trans-plot');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Row with "My Transactions", plot button, and "+" button */}
        <View style={styles.header}>
          <Text style={styles.text}>My Transactions</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.plotButton} onPress={handleShowPlot}>
              <AntDesign name="linechart" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
              <AntDesign name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between', // Distribute space between text and buttons
    alignItems: 'center', // Vertically align elements in the center
    paddingHorizontal: 20,
    marginBottom: 20, // Space between the header and the transactions list
  },
  text: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row', // Align buttons horizontally
  },
  plotButton: {
    backgroundColor: "#2196F3", // Blue button for the plot icon
    padding: 10,
    borderRadius: 50,
  },
  addButton: {
    backgroundColor: "#4CAF50", // Green button for "+"
    padding: 10,
    borderRadius: 50,
    marginLeft: 10, // Space between the buttons
  },
});
