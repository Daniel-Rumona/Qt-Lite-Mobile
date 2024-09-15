import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const InventoryForm = () => {
  const [itemID, setItemID] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityThreshold, setQuantityThreshold] = useState('');
  const [price, setPrice] = useState('');
  const [inventoryList, setInventoryList] = useState([]);
  const [userId, setUserId] = useState(null); // To store the current user's ID
  const [showForm, setShowForm] = useState(false); // To toggle between form and list view

  const inventoryCollectionRef = collection(FIRESTORE_DB, 'inventory');

  // Check if the user is logged in and retrieve their ID
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setUserId(user.uid); // Set the current user's ID
      } else {
        setUserId(null); // User is not logged in
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch the user's inventory items
  useEffect(() => {
    if (userId) {
      // Query Firestore for inventory items where `user_id` matches the logged-in user
      const q = query(inventoryCollectionRef, where('user_id', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInventoryList(items);
      });

      return () => unsubscribe();
    }
  }, [userId]);

  // Function to add a new item to the inventory
  const addItem = async () => {
    if (!itemID || !itemName || !quantity || !price) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newItem = {
      itemID,
      itemName,
      quantity: parseInt(quantity),
      quantityThreshold: parseInt(quantity),
      price: parseFloat(price),
      user_id: userId, // Include the user ID to differentiate users
    };

    try {
      await addDoc(inventoryCollectionRef, newItem);
      Alert.alert('Success', 'Item added successfully!');
      setItemID('');
      setItemName('');
      setQuantity('');
      setQuantityThreshold('');
      setPrice('');
      setShowForm(false); // Return to the item list view after adding an item
    } catch (error) {
      console.error('Error adding item: ', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inventory</Text>

      {/* Toggle between form and list */}
      {!showForm ? (
        <>
          {/* List of inventory items */}
          <FlatList
            data={inventoryList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <Text style={styles.itemText}>Item ID: {item.itemID}</Text>
                <Text style={styles.itemText}>Name: {item.itemName}</Text>
                <Text style={styles.itemText}>Quantity: {item.quantity}</Text>
                <Text style={styles.itemText}>Quantity Threshold: {item.quantityThreshold}</Text>
                <Text style={styles.itemText}>Price: R{item.price}</Text>
              </View>
            )}
          />

          {/* Button to show form to add a new item */}
          <TouchableOpacity style={styles.button} onPress={() => setShowForm(true)}>
            <Text style={styles.buttonText}>Add New Item</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Form to add new item */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Item ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Item ID"
              value={itemID}
              onChangeText={setItemID}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Item Name"
              value={itemName}
              onChangeText={setItemName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Quantity"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantity Threshold</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Quantity Threshold"
              keyboardType="numeric"
              value={quantityThreshold}
              onChangeText={setQuantityThreshold}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          {/* Button to add the item */}
          <TouchableOpacity style={styles.button} onPress={addItem}>
            <Text style={styles.buttonText}>Save Item</Text>
          </TouchableOpacity>

          {/* Button to cancel and go back to item list */}
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setShowForm(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default InventoryForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 35,
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    padding: 10,
    color: '#fff',
    backgroundColor: '#333',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#555', // Darker background for cancel button
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContainer: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  itemText: {
    color: '#fff',
    fontSize: 14,
  },
});
