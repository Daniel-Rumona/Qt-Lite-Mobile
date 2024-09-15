import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from "react-native";
import { FIRESTORE_DB, FIREBASE_AUTH } from '@/FirebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import moment from 'moment';

// Define the Transaction type
interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  createdAt: any; // Firestore Timestamp type
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Define state with Transaction type
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userID, setUserID] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, async (authUser) => {
      if (authUser) {
        const userId = authUser.uid;

        // Fetch the user's name from Firestore
        const userDocRef = doc(FIRESTORE_DB, 'system_users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
          setUserID(userDoc.data().id);
        }

        // Fetch transactions specific to the logged-in user
        const transactionsRef = collection(FIRESTORE_DB, 'transactions');
        const q = query(transactionsRef, where('user_id', '==', userId)); // Updated field 'user_id'

        const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
          const transactionsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTransactions(transactionsData); // Update transactions state
          setLoading(false);
        });

        return () => unsubscribeTransactions();
      }
    });

    return () => unsubscribeAuth();
  }, []);


  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.transactionType}</Text>
      <Text style={styles.itemAmount}>R{item.amount}</Text>
      <Text style={styles.itemDate}>{moment(item.createdAt.toDate()).format('MMMM Do YYYY, h:mm a')}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.container}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Transactions Found</Text>
        </View>
      )}
    </View>
  );
};

export default Transactions;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  itemContainer: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    backgroundColor: "#333",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  itemAmount: {
    fontSize: 14,
    marginBottom: 5,
    color: "#fff",
  },
  itemDate: {
    fontSize: 12,
    color: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
  },
  userInfoContainer: {
    padding: 10,
    backgroundColor: "#4CAF50",
    alignItems: "center",
  },
  userInfoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
