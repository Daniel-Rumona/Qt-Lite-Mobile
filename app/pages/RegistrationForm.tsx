import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker'; // Import DropDownPicker
import { useRouter } from "expo-router";
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore'; // Firestore methods
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase Authentication
import { FIREBASE_APP, FIREBASE_AUTH } from '@/FirebaseConfig'; // Your Firebase configuration

const RegistrationForm = () => {
  const [name, setName] = useState('');
  const [sex, setSex] = useState(null);
  const [location, setLocation] = useState('');
  const [workers, setWorkers] = useState('');
  const [businessSector, setBusinessSector] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sexOpen, setSexOpen] = useState(false); // State for Sex dropdown
  const [sectorOpen, setSectorOpen] = useState(false); // State for Sector dropdown
  const router = useRouter(); // Initialize the router

  const db = getFirestore(FIREBASE_APP); // Initialize Firestore

  // Function to register the user using Firebase Auth and save details to Firestore
  const handleRegister = async () => {
    try {
      // Step 1: Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      // Step 2: Save the user's additional information in Firestore
      const userData = {
        name,
        sex,
        location,
        workers: parseInt(workers),
        business_sector: businessSector,
        email,
        user_id: user.uid, // Use Firebase Auth UID for the document ID
      };

      // Save user details in Firestore under system_users collection with UID as the document ID
      await setDoc(doc(db, 'system_users', user.uid), userData);

      // Success alert and navigation to the next screen (TransactionForm or Home)
      Alert.alert('Success', 'User registered successfully!');
      // Navigate to the desired screen
      router.push("./LoginForm")
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Failed to register user: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/* Name Input */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      {/* Email Input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Sex Dropdown */}
      <Text style={styles.label}>Select Sex</Text>
      <DropDownPicker
        open={sexOpen}
        value={sex}
        items={[
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
        ]}
        setOpen={setSexOpen}
        setValue={setSex}
        placeholder="Select your sex"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={styles.dropdownText}
      />

      {/* Location Input */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your location"
        placeholderTextColor="#aaa"
        value={location}
        onChangeText={setLocation}
      />

      {/* Workers Input */}
      <Text style={styles.label}>Workers</Text>
      <TextInput
        style={styles.input}
        placeholder="Number of Workers"
        placeholderTextColor="#aaa"
        value={workers}
        keyboardType="numeric"
        onChangeText={setWorkers}
      />

      {/* Business Sector Dropdown */}
      <Text style={styles.label}>Select Business Sector</Text>
      <DropDownPicker
        open={sectorOpen}
        value={businessSector}
        items={[
          { label: 'Services', value: 'Services' },
          { label: 'Products', value: 'Products' },
        ]}
        setOpen={setSectorOpen}
        setValue={setBusinessSector}
        placeholder="Select a sector"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        textStyle={styles.dropdownText}
      />

      {/* Register Button */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegistrationForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000', // Black background
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
    color: '#fff', // White text
  },
  input: {
    height: 40,
    borderColor: '#555', // Darker border
    borderWidth: 1,
    marginBottom: 20, // Adjusted margin for spacing between inputs
    padding: 10,
    borderRadius: 5,
    color: '#fff', // White text in input fields
    backgroundColor: '#333', // Darker background for inputs
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff', // White label text
  },
  dropdown: {
    backgroundColor: '#333', // Dark background
    borderColor: '#555', // Darker border
    marginBottom: 20, // Ensure spacing between dropdowns and inputs
  },
  dropdownContainer: {
    backgroundColor: '#333', // Dark background for dropdown container
    borderColor: '#555', // Darker border for dropdown container
  },
  dropdownText: {
    color: '#fff', // White text for the dropdown
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff', // White text for the button
    fontSize: 16,
    fontWeight: 'bold',
  },
});
