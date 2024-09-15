import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Colors from "@/constants/Colors";
import { Stack } from "expo-router";
import { FIRESTORE_DB, FIREBASE_AUTH } from "@/FirebaseConfig"; // Firebase Firestore and Auth import
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';
import { AntDesign, Ionicons, FontAwesome5, MaterialIcons, Feather } from "@expo/vector-icons";
import Header from "@/components/Header";  // Import your custom header component


const Page = () => {
  const [aiAnalyticsOpen, setAiAnalyticsOpen] = useState(false);
  const router = useRouter(); // Initialize the router
  const [user, setUser] = useState(null); // State for storing user data
//   const userName = "John Doe"; // Placeholder for dynamically passed user name
  // Fetch logged-in user's information from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
      if (authUser) {
        // Fetch the user's details from Firestore
        const userDocRef = doc(FIRESTORE_DB, 'system_users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data());
        }
      } else {
        // If no user is logged in, redirect to LoginForm
        router.replace("/pages/LoginForm");
      }
    });
    return () => unsubscribeAuth();
  }, []);
  const toggleAiAnalytics = () => {
    setAiAnalyticsOpen(!aiAnalyticsOpen);
  };

  const navigateToQuickFix = () => {
    router.push('/pages/trans-plot'); // Navigate to the new TransPlot screen
  };
  const navigateToUploadDocuments = () => {
    router.push('/pages/UploadDocuments'); // Navigate to the new TransPlot screen
  };
  const navigateToLogin = () => {
    router.push('/pages/LoginForm'); // Navigate to the new TransPlot screen
  };
  const navigateToInventory = () => {
    router.push('/pages/InventoryForm'); // Navigate to the new TransPlot screen
  };
  const navigateToProfile = () => {
    router.push('/pages/MyProfile'); // Navigate to the new TransPlot screen
  };

  return (
    <>
      <Stack.Screen options={{ header: () => <Header userName={user?.name} /> }} />
      <View style={styles.container}>

        {/* Sidebar */}
        <View style={styles.sidebar}>
          {/* BI Analytics */}
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="analytics-outline" size={20} color="white" />
            <Text style={styles.menuText}>BI Analytics</Text>
          </TouchableOpacity>

          {/* AI Analytics with Dropdown */}
          <TouchableOpacity onPress={toggleAiAnalytics} style={styles.menuItem}>
            <Ionicons name="logo-android" size={20} color="white" />
            <Text style={styles.menuText}>AI Analytics</Text>
          </TouchableOpacity>

          {/* AI Analytics Dropdown */}
          {aiAnalyticsOpen && (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity style={styles.dropdownItem}>
                <Feather name="tool" size={16} color="white" />
                <Text style={styles.dropdownText}>Buzzy Helper</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={navigateToQuickFix}>
                <Feather name="settings" size={16} color="white" />
                <Text style={styles.dropdownText}>QuickFix</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Configure Section */}
          <Text style={styles.sectionHeader}>CONFIGURE</Text>

          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="business-center" size={20} color="white" />
            <Text style={styles.menuText}>Departments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="users" size={20} color="white" />
            <Text style={styles.menuText}>Team Members</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToInventory}>
            <Ionicons name="cube-outline" size={20} color="white" />
            <Text style={styles.menuText}>Inventory</Text>
          </TouchableOpacity>

          {/* Toolbox Section */}
          <Text style={styles.sectionHeader}>TOOLBOX</Text>

          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="file-invoice-dollar" size={20} color="white" />
            <Text style={styles.menuText}>Invoice/Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToUploadDocuments}>
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
            <Text style={styles.menuText}>Documents Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.menuText}>View Documents</Text>
          </TouchableOpacity>

          {/* Account Section */}
          <Text style={styles.sectionHeader}>MY ACCOUNT</Text>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToProfile}>
            <Ionicons name="person-circle-outline" size={20} color="white" />
            <Text style={styles.menuText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={navigateToLogin}>
            <AntDesign name="logout" size={20} color="white" />
            <Text style={styles.menuText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: Colors.black,
    paddingTop: 40, // Add padding at the top to push the content down
  },
  sidebar: {
    padding: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuText: {
    color: "white",
    fontSize: 16,
    marginLeft: 10,
  },
  sectionHeader: {
    color: "#AAA",
    fontSize: 14,
    marginVertical: 10,
    fontWeight: "bold",
    alignSelf: "center",
  },
  dropdownContainer: {
    paddingLeft: 30,
    marginVertical: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  dropdownText: {
    color: "white",
    fontSize: 14,
    marginLeft: 10,
  },
});
