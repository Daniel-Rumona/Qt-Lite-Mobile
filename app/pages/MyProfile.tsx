import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Colors  from '@/constants/Colors'

// Define a User type for TypeScript
interface User {
  name: string;
  email: string;
  location: string;
  workers: number;
  business_sector: string;
}

const ProfilePage: React.FC = () => {
  const [userDetails, setUserDetails] = useState<User | null>(null); // Use the User type
  const [loading, setLoading] = useState<boolean>(true); // Specify the type for loading state

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
      if (authUser) {
        const userId = authUser.uid;

        // Fetch the user's details from Firestore
        const userDocRef = doc(FIRESTORE_DB, 'system_users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserDetails(userDoc.data() as User); // Cast the data to User type
        }
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://source.unsplash.com/random' }} // Use any background image
      style={styles.background}
      blurRadius={10}
    >
      <View style={styles.container}>
        <View style={styles.glassCard}>
          {userDetails ? (
            <>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.text}>Name: {userDetails.name}</Text>
              <Text style={styles.text}>Email: {userDetails.email}</Text>
              <Text style={styles.text}>Location: {userDetails.location}</Text>
              <Text style={styles.text}>Workers: {userDetails.workers}</Text>
              <Text style={styles.text}>Business Sector: {userDetails.business_sector}</Text>
            </>
          ) : (
            <Text style={styles.text}>No User Data Found</Text>
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    flex: 1,
  },
  glassCard: {
    width: 300,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent white
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10, // Shadow for Android
    backdropFilter: 'blur(10px)', // CSS property (simulated in React Native with blurRadius)
    borderColor: 'rgba(255, 255, 255, 0.2)', // Border to enhance the glass effect
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff', // White text on translucent background
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
