import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';
import { FIRESTORE_DB, FIREBASE_AUTH } from '@/FirebaseConfig'; // Firebase config
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions
import { onAuthStateChanged } from 'firebase/auth'; // Firebase auth function to get the user

const Tasks = () => {
  const router = useRouter();

  // User state
  const [userId, setUserId] = useState(null); // State to store logged-in user's ID

  // Form state
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [budget, setBudget] = useState('');
  const [spent, setSpent] = useState('');
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState('');

  // Fetch the logged-in user's ID
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setUserId(user.uid); // Set the user ID from Firebase Auth
      } else {
        router.push('/pages/LoginForm'); // Redirect to login if no user is logged in
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Function to save the task to Firestore
  const saveTaskToFirebase = async (task) => {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, 'tasks'), task); // Correct usage with addDoc and collection
      console.log('Document written with ID: ', docRef.id);
      Alert.alert('Task Added', 'Your task has been saved successfully.');
    } catch (error) {
      console.error('Error adding document: ', error);
      Alert.alert('Error', 'An error occurred while saving the task.');
    }
  };

  const handleAddTask = () => {
    Keyboard.dismiss(); // Dismiss keyboard when adding task

    const task = {
      user_id: userId,  // Include the user_id for user-specific tasks
      id: Date.now().toString(), // Unique ID using timestamp
      name: taskName,
      due: dueDate.toISOString().split('T')[0], // Format the date
      budget: parseFloat(budget),
      spent: parseFloat(spent),
      target: parseFloat(target),
      status: parseFloat(status),
    };

    saveTaskToFirebase(task); // Save to Firebase

    // Clear form
    setTaskName('');
    setBudget('');
    setSpent('');
    setTarget('');
    setStatus('');
    router.back(); // Navigate back after adding the task
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowPicker(false);
    setDueDate(currentDate);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={router.back}>
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add a New Task</Text>

        {/* Task Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task name"
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>

        {/* Due Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateText}>
              {dueDate.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Budget */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter budget"
            value={budget}
            keyboardType="numeric"
            onChangeText={setBudget}
          />
        </View>

        {/* Spent */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Spent</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount spent"
            value={spent}
            keyboardType="numeric"
            onChangeText={setSpent}
          />
        </View>

        {/* Target */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Target</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter target percentage"
            value={target}
            keyboardType="numeric"
            onChangeText={setTarget}
          />
        </View>

        {/* Status */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task status"
            value={status}
            keyboardType="numeric"
            onChangeText={setStatus}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Tasks;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 75,
    right: 20,
    backgroundColor: Colors.tintColor,
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 20,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: Colors.white,
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: Colors.grey,
    color: Colors.white,
    padding: 10,
    borderRadius: 5,
  },
  dateText: {
    color: Colors.white,
  },
  addButton: {
    backgroundColor: Colors.blue,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
