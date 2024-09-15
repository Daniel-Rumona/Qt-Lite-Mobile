import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig'; // Import Firestore from your config
import Colors from '@/constants/Colors';
import { TaskIcon } from '@/constants/Icons';

type TaskType = {
  id: string;
  name: string;
  due: string;
  budget: number;
  spent: number;
  target: number;
  status: number;
};

const TaskBlock = () => {
  const [taskList, setTaskList] = useState<TaskType[]>([]);

  // Fetch tasks from Firebase
  const fetchTasks = async () => {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    const tasks: TaskType[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TaskType[];
    setTaskList(tasks);
  };

  useEffect(() => {
    fetchTasks(); // Load tasks when component mounts
  }, []);

  // Add a new task to Firebase
  const handleAddTask = async () => {
    const newTask = {
      name: 'New Task',
      due: '2024-12-01',
      budget: 1000,
      spent: 0,
      target: 100,
      status: 0,
    };

    try {
      await addDoc(collection(db, 'tasks'), newTask);
      fetchTasks(); // Refresh tasks after adding
    } catch (error) {
    }
  };

  return (
    <View style={styles.spendingSectionWrapper}>
      <View style={styles.headerWrapper}>
        <Text style={styles.sectionTitle}>
          Planned <Text style={{ fontWeight: "700" }}>Tasks</Text>
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleAddTask}>
          <Text style={styles.buttonText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {taskList.map((item) => {
        const icon = <TaskIcon width={22} height={22} color={Colors.white} />;

        // Determine the status color based on the task's completion percentage
        const statusColor = item.status >= 100 ? "green" : "red";

        return (
          <View style={styles.spendingWrapper} key={item.id}>
            <View style={styles.iconWrapper}>{icon}</View>

            <View style={styles.textWrapper}>
              <View style={{ gap: 5 }}>
                <Text style={styles.itemName}>{item.name || 'No Name'}</Text>
                <Text style={styles.dueText}>{item.due || 'No Due Date'}</Text>
              </View>

              <View style={styles.detailsRight}>
                <Text style={styles.itemName}>R {item.budget.toFixed(2)}</Text>
                <Text style={styles.targetText}>Target: {item.target} %</Text>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  Status: {item.status.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default TaskBlock;

const styles = StyleSheet.create({
  spendingSectionWrapper: {
    marginVertical: 20,
    alignItems: "flex-start",
  },
  headerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.tintColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  spendingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  iconWrapper: {
    backgroundColor: Colors.grey,
    padding: 15,
    borderRadius: 50,
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dueText: {
    color: "red",
    fontWeight: "700",
  },
  detailsRight: {
    alignItems: "flex-end",
  },
  targetText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
