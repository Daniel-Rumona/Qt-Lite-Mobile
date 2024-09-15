import {
    View,
    Text,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore functions for querying data
import Colors from '@/constants/Colors'; // Assuming you have a Colors file for consistent theming

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;
  const router = useRouter(); // Initialize the router

  const signIn = async () => {
    setLoading(true);
    try {
      // Step 1: Sign in the user using Firebase Auth
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log('User authenticated:', response);

      // Step 2: Query Firestore system_users collection to confirm user details
      const usersRef = collection(FIRESTORE_DB, 'system_users');
      const q = query(usersRef, where('email', '==', email)); // Query Firestore by email
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('User data from Firestore:', userData);

        // Proceed to next step (e.g., navigate to home screen)
        alert('Welcome, ' + userData.name); // Show a welcome message
        router.push("(tabs)"); // Navigate to the home screen
      } else {
        alert('No user found with this email in system_users.');
      }
    } catch (error) {
      console.log('Error signing in:', error);
      // Enhanced error handling for Firebase Authentication
      switch (error.code) {
        case 'auth/wrong-password':
          alert('Incorrect password. Please try again.');
          break;
        case 'auth/user-not-found':
          alert('No account found with this email. Please sign up.');
          break;
        case 'auth/invalid-email':
          alert('Invalid email format.');
          break;
        default:
          alert('Sign in failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    router.push('./RegistrationForm');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Offset to avoid overlapping on iOS
      >
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://quantilytix.co.za/img/hero-img.png' }} // Add your image URL or local import
            style={styles.logo}
          />
          <Text style={styles.appName}>Qt-Lite App</Text>
        </View>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
        <TextInput
          secureTextEntry={true}
          value={password}
          style={styles.input}
          placeholder="Enter Password"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          onChangeText={(text) => setPassword(text)}
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.blue} />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={signIn}
              disabled={loading} // Disable the button during loading
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={signUp}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.black, // Using the same black background
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30, // Space between logo and inputs
  },
  logo: {
    width: 200, // Adjusted width for better sizing
    height: 200, // Adjusted height
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', // White text for the app name
  },
  input: {
    marginVertical: 8,
    height: 50,
    borderWidth: 1,
    borderColor: '#555', // Darker border to match the black background
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#fff', // White text in input fields
    backgroundColor: '#333', // Darker background for inputs
  },
  button: {
    backgroundColor: Colors.blue, // Primary button color (blue)
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: Colors.tintColor, // Secondary button (alternative color)
    marginTop: 10, // Space between the two buttons
  },
  buttonText: {
    color: '#fff', // White text for the button
    fontSize: 16,
    fontWeight: 'bold',
  },
});
