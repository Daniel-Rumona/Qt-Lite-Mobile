// import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
// import React, { useEffect, useState } from "react";
// import Colors from "@/constants/Colors";
// import { Stack, useRouter } from "expo-router";
// import Header from "@/components/Header";
// import { PieChart } from "react-native-gifted-charts";
// import ExpenseBlock from "@/components/ExpenseBlock";
// import IncomeBlock from "@/components/IncomeBlock";
// import TaskBlock from "@/components/TaskBlock";
// import TasksDashList from '@/data/tasks-dashboard.json';
// import incomeList from '@/data/income.json';
// import { FIRESTORE_DB, FIREBASE_AUTH } from "@/FirebaseConfig"; // Firebase Firestore and Auth import
// import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
// import { onAuthStateChanged } from 'firebase/auth';

// const Page = () => {
//   const [taskList, setTaskList] = useState([]);
//   const [user, setUser] = useState(null); // State for storing user data
//   const [loading, setLoading] = useState(true); // Loading state while checking auth
//   const router = useRouter();

//   // Real-time fetch of tasks using onSnapshot
//   useEffect(() => {
//     const tasksCollection = collection(FIRESTORE_DB, "tasks");
//     const unsubscribe = onSnapshot(tasksCollection, (snapshot) => {
//       const tasksData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setTaskList(tasksData);
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch logged-in user's information from Firestore
//   useEffect(() => {
//     const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
//       if (authUser) {
//         // Fetch the user's details from Firestore
//         const userDocRef = doc(FIRESTORE_DB, 'system_users', authUser.uid);
//         const userDoc = await getDoc(userDocRef);
//         if (userDoc.exists()) {
//           setUser(userDoc.data());
//         }
//         setLoading(false); // Stop loading after getting user data
//       } else {
//         // If no user is logged in, redirect to LoginForm
//         router.replace("/pages/LoginForm");
//       }
//     });
//     return () => unsubscribeAuth();
//   }, []);

//   if (loading) {
//     // Show a loading spinner while checking authentication state
//     return (
//       <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
//         <ActivityIndicator size="large" color={Colors.blue} />
//       </View>
//     );
//   }

//   // Pie chart data
//   const pieData = [
//     { value: 42.86, color: Colors.blue, focused: true, text: "42.86%" },
//     { value: 14.29, color: Colors.white, text: "14.29%" },
//     { value: 9.52, color: Colors.tintColor, text: "9.52%" },
//     { value: 33.33, color: "#FFA5BA", gradientCenterColor: "#FF7F97", text: "33.33%" },
//   ];

//   return (
//     <>
//       <Stack.Screen options={{ header: () => <Header userName={user?.name} /> }} />
//       <View style={[styles.container, { paddingTop: 40 }]}>
//         <ScrollView showsVerticalScrollIndicator={false}>
//           <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//             <View style={{ gap: 10 }}>
//               <Text style={{ color: Colors.white, fontSize: 16 }}>
//                 Planner <Text style={{ fontWeight: 700 }}>Dashboard</Text>
//               </Text>
//               <Text style={{ color: Colors.white, fontSize: 36, fontWeight: 700 }}>21</Text>
//             </View>
//             <View style={{ paddingVertical: 20, alignItems: 'center' }}>
//               <PieChart
//                 data={pieData}
//                 donut
//                 showGradient
//                 sectionAutoFocus
//                 semiCircle
//                 radius={70}
//                 innerRadius={55}
//                 innerCircleColor={Colors.black}
//                 centerLabelComponent={() => (
//                   <View style={{ justifyContent: "center", alignItems: "center" }}>
//                     <Text style={{ fontSize: 22, color: "white", fontWeight: "bold" }}>47%</Text>
//                   </View>
//                 )}
//               />
//             </View>
//           </View>

//           <ExpenseBlock expenseList={TasksDashList} />
//           <IncomeBlock incomeList={incomeList} />
//           <TaskBlock taskList={taskList} />
//         </ScrollView>
//       </View>
//     </>
//   );
// };

// export default Page;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.black,
//     paddingHorizontal: 20,
//   },
// });
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import Colors from "@/constants/Colors";
import { Stack, useRouter } from "expo-router";
import Header from "@/components/Header";
import { PieChart } from "react-native-gifted-charts";
import ExpenseBlock from "@/components/ExpenseBlock";
import IncomeBlock from "@/components/IncomeBlock";
import TaskBlock from "@/components/TaskBlock";
import TasksDashList from '@/data/tasks-dashboard.json';
import incomeList from '@/data/income.json';
import { FIRESTORE_DB, FIREBASE_AUTH } from "@/FirebaseConfig"; // Firebase Firestore and Auth import
import { collection, onSnapshot, doc, getDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from 'firebase/auth';

const Page = () => {
  const [taskList, setTaskList] = useState([]);
  const [user, setUser] = useState(null); // State for storing user data
  const [loading, setLoading] = useState(true); // Loading state while checking auth
  const [error, setError] = useState(null); // State to track any errors
  const router = useRouter();

  // Fetch logged-in user's information from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
      if (authUser) {
        try {
          // Fetch the user's details from Firestore
          const userDocRef = doc(FIRESTORE_DB, 'system_users', authUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUser(userDoc.data());

            // Real-time fetch of tasks for the specific user using onSnapshot
            const tasksCollection = collection(FIRESTORE_DB, "tasks");
            const q = query(tasksCollection, where("user_id", "==", authUser.uid)); // Query tasks for the logged-in user

            const unsubscribeTasks = onSnapshot(q, (snapshot) => {
              const tasksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setTaskList(tasksData);
            });

            return () => unsubscribeTasks();
          } else {
            console.error("User document not found in Firestore");
            setError("User document not found in Firestore");
          }
        } catch (err) {
          setError("Error fetching user data or tasks.");
        } finally {
          setLoading(false);
        }
      } else {
        // If no user is logged in, redirect to LoginForm
        router.replace("/pages/LoginForm");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    // Show a loading spinner while checking authentication state
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.blue} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.red }}>{error}</Text>
      </View>
    );
  }

  // Pie chart data
  const pieData = [
    { value: 42.86, color: Colors.blue, focused: true, text: "42.86%" },
    { value: 14.29, color: Colors.white, text: "14.29%" },
    { value: 9.52, color: Colors.tintColor, text: "9.52%" },
    { value: 33.33, color: "#FFA5BA", gradientCenterColor: "#FF7F97", text: "33.33%" },
  ];

  return (
    <>
      <Stack.Screen options={{ header: () => <Header userName={user?.name} /> }} />
      <View style={[styles.container, { paddingTop: 40 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 10 }}>
              <Text style={{ color: Colors.white, fontSize: 16 }}>
                Planner <Text style={{ fontWeight: 700 }}>Dashboard</Text>
              </Text>
              <Text style={{ color: Colors.white, fontSize: 36, fontWeight: 700 }}>21</Text>
            </View>
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <PieChart
                data={pieData}
                donut
                showGradient
                sectionAutoFocus
                semiCircle
                radius={70}
                innerRadius={55}
                innerCircleColor={Colors.black}
                centerLabelComponent={() => (
                  <View style={{ justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 22, color: "white", fontWeight: "bold" }}>47%</Text>
                  </View>
                )}
              />
            </View>
          </View>

          <ExpenseBlock expenseList={TasksDashList} />
          <IncomeBlock incomeList={incomeList} />
          <TaskBlock taskList={taskList} />
        </ScrollView>
      </View>
    </>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
  },
});
