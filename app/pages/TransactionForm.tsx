import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker'; // Dropdown picker for the select box
import { FIRESTORE_DB, FIREBASE_AUTH } from '@/FirebaseConfig'; // Firebase config
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'; // Firestore functions

const TransactionForm = () => {
  const [businessSector, setBusinessSector] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionTypes, setTransactionTypes] = useState<any[]>([]);
  const [open, setOpen] = useState(false); // State for dropdown open/close

  // Define the transaction types based on business sector
  const serviceTransactions = [
    { label: 'Service Booking', value: 'Service Booking' },
    { label: 'Service Completion', value: 'Service Completion' },
    { label: 'Service Payment', value: 'Service Payment' },
    { label: 'Service Quotation', value: 'Service Quotation' },
    { label: 'Service Feedback', value: 'Service Feedback' },
    { label: 'Recurring Service Setup', value: 'Recurring Service Setup' },
    { label: 'Invoice Generation', value: 'Invoice Generation' },
  ];

  const productTransactions = [
    { label: 'Product Order', value: 'Product Order' },
    { label: 'Product Delivery', value: 'Product Delivery' },
    { label: 'Product Stock Update', value: 'Product Stock Update' },
    { label: 'Product Payment', value: 'Product Payment' },
    { label: 'Return/Refund', value: 'Return/Refund' },
    { label: 'Discount Application', value: 'Discount Application' },
    { label: 'Purchase Order Generation', value: 'Purchase Order Generation' },
  ];

  // Fetch the user's business sector from Firestore
  useEffect(() => {
    const fetchBusinessSector = async () => {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const userDocRef = doc(FIRESTORE_DB, 'system_users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessSector(userData.business_sector); // Get the business sector from the user's data

          // Set the transaction fields based on the fetched business sector
          if (userData.business_sector === 'Services') {
            setTransactionTypes(serviceTransactions);
          } else if (userData.business_sector === 'Products') {
            setTransactionTypes(productTransactions);
          }
        } else {
          Alert.alert('Error', 'User data not found.');
        }
      } else {
        Alert.alert('Error', 'No user is logged in.');
      }
    };

    fetchBusinessSector();
  }, []);

  // Save transaction to Firestore
  const saveTransaction = async () => {
    if (!transactionType || !amount) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(FIRESTORE_DB, 'transactions'), {
        businessSector,
        transactionType,
        amount: parseFloat(amount),
        createdAt: new Date(),
        user_id: FIREBASE_AUTH.currentUser?.uid, // Save user_id with the transaction
      });
      Alert.alert('Success', 'Transaction added successfully.');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction for {businessSector}</Text>

      {/* Transaction Type Dropdown */}
      <Text style={styles.label}>Transaction Type</Text>
      <DropDownPicker
        open={open}
        value={transactionType}
        items={transactionTypes}
        setOpen={setOpen}
        setValue={setTransactionType}
        setItems={setTransactionTypes}
        placeholder="Select a transaction type"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      {/* Amount Input */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        placeholderTextColor="#aaa"
        value={amount}
        keyboardType="numeric"
        onChangeText={setAmount}
      />

      <TouchableOpacity style={styles.button} onPress={saveTransaction}>
        <Text style={styles.buttonText}>Save Transaction</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TransactionForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    color: '#fff',
    backgroundColor: '#333',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: '#333',
    borderColor: '#555',
    marginBottom: 20,
  },
  dropdownContainer: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
});
