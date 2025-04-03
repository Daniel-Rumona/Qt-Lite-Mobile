import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppBar, Button } from '@react-native-material/core'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { auth, db } from '@/FirebaseConfig'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { useMessageModal } from '@/hooks'
import { MessageTypes } from '@/components/modals/types'
import MessageModal from '@/components/modals/MessageModal'
import FormAppBar from '@/components/FormAppBar'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
const TasksForm = () => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskData, setTaskData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    targetType: '',
    target: '',
    budget: '',
    strategicPillar: '',
    status: 'Active'
  })
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  const statusConfig = {
    Active: { icon: 'clipboard-text', color: '#FFD700' },
    Completed: { icon: 'check-circle', color: '#4CAF50' },
    Overdue: { icon: 'alert-circle', color: '#F44336' }
  }

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        const tasksRef = collection(db, `Users/${userId}/tasks`)
        const querySnapshot = await getDocs(query(tasksRef))
        const fetchedTasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setTasks(fetchedTasks)
        setFilteredTasks(fetchedTasks)
      } catch (error) {
        showMessageModal(
          MessageTypes.ERROR,
          'Error',
          'Failed to fetch tasks. Please try again later.',
          hideMessageModal
        )
      }
    }

    fetchTasks()
  }, [])
  const handleDateChange = (event, date, type) => {
    if (date) {
      setTaskData(prev => ({
        ...prev,
        [type]: date.toISOString().split('T')[0] // Save date as 'YYYY-MM-DD'
      }))
    }
    // Close the respective picker
    if (type === 'startDate') setShowStartDatePicker(false)
    if (type === 'endDate') setShowEndDatePicker(false)
  }
  const handleSearch = query => {
    setSearchQuery(query)
    const filtered = tasks.filter(task =>
      task.title.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredTasks(filtered)
  }

  const handleFilterChange = status => {
    setFilter(status)
    const filtered =
      status === 'All' ? tasks : tasks.filter(task => task.status === status)
    setFilteredTasks(filtered)
  }

  const openModal = (task = null) => {
    setSelectedTask(task)
    setTaskData(
      task || {
        title: '',
        startDate: '',
        endDate: '',
        targetType: '',
        target: '',
        budget: '',
        strategicPillar: '',
        status: 'Active'
      }
    )
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedTask(null)
  }

  const handleSaveTask = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        showMessageModal(
          MessageTypes.WARNING,
          'Error',
          'User not authenticated.',
          hideMessageModal
        )
        return
      }

      if (!taskData.title || !taskData.startDate || !taskData.endDate) {
        showMessageModal(
          MessageTypes.WARNING,
          'Validation Error',
          'Please fill in all required fields.',
          hideMessageModal
        )
        return
      }

      const tasksCollection = collection(db, `Users/${userId}/tasks`)

      if (selectedTask) {
        await updateDoc(doc(tasksCollection, selectedTask.id), taskData)
        showMessageModal(
          MessageTypes.SUCCESS,
          'Success',
          'Task updated successfully.',
          hideMessageModal
        )
      } else {
        await addDoc(tasksCollection, taskData)
        showMessageModal(
          MessageTypes.SUCCESS,
          'Success',
          'Task added successfully.',
          hideMessageModal
        )
      }

      closeModal()
      const querySnapshot = await getDocs(query(tasksCollection))
      const updatedTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTasks(updatedTasks)
      setFilteredTasks(updatedTasks)
    } catch (error) {
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to save the task. Please try again later.',
        hideMessageModal
      )
    }
  }

  const handleDeleteTask = async taskId => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      await deleteDoc(doc(db, `Users/${userId}/tasks`, taskId))
      const updatedTasks = tasks.filter(task => task.id !== taskId)
      setTasks(updatedTasks)
      setFilteredTasks(updatedTasks)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Deleted',
        'Task deleted successfully.',
        hideMessageModal
      )
    } catch (error) {
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to delete the task. Please try again later.',
        hideMessageModal
      )
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title='Tasks' />
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            {['Active', 'Completed', 'Overdue', 'All'].map(status => (
              <Button
                key={status}
                title={status}
                onPress={() => handleFilterChange(status)}
                variant={filter === status ? 'contained' : 'outlined'}
                style={styles.filterButton}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder='Search tasks'
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <MaterialIcons name='add' size={24} color='#fff' />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {filteredTasks.length === 0 && (
          <Text style={styles.noTaskText}>No tasks available</Text>
        )}
        {filteredTasks.map(task => (
          <Pressable
            key={task.id}
            style={styles.taskBox}
            onPress={() => openModal(task)}
          >
            <View style={styles.taskRow}>
              <MaterialCommunityIcons
                name={statusConfig[task.status].icon}
                size={32}
                color={statusConfig[task.status].color}
              />
              <View style={styles.taskDetails}>
                <Text style={styles.taskTitle}>
                  {task.title} | {task.strategicPillar}
                </Text>
                <Text style={styles.taskDate}>
                  Period: {task.startDate} - {task.endDate}
                </Text>
                <Text style={styles.taskDate}>
                  Progress: {task.progress} / {task.target} [
                  {task.targetType === 'Percentage' ? '%' : 'Num'}]
                </Text>
                <Text style={styles.taskDate}>
                  Expenditure: {task.spent} / {task.budget}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedTask ? 'Edit Task' : 'Add Task'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder='Title'
              value={taskData.title}
              onChangeText={text =>
                setTaskData(prev => ({ ...prev, title: text }))
              }
            />
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {taskData.startDate || 'Select Start Date'}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={new Date(taskData.startDate || Date.now())}
                mode='date'
                display='default'
                onChange={(event, date) =>
                  handleDateChange(event, date, 'startDate')
                }
              />
            )}
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {taskData.endDate || 'Select End Date'}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={new Date(taskData.endDate || Date.now())}
                mode='date'
                display='default'
                onChange={(event, date) =>
                  handleDateChange(event, date, 'endDate')
                }
              />
            )}
            <SelectList
              data={[
                { key: 'percentage', value: 'Percentage' },
                { key: 'number', value: 'Number' }
              ]}
              placeholder='Select Target Type'
              setSelected={value =>
                setTaskData(prev => ({ ...prev, targetType: value }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder='Target'
              value={taskData.target.toString()}
              keyboardType='numeric'
              onChangeText={text =>
                setTaskData(prev => ({ ...prev, target: parseInt(text) }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder='Budget'
              value={taskData.budget.toString()}
              keyboardType='numeric'
              onChangeText={text =>
                setTaskData(prev => ({ ...prev, budget: parseFloat(text) }))
              }
            />
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 10,
                width: '100%'
              }}
            >
              <Button
                title='Close'
                onPress={() => {
                  setModalVisible(false) // Close the modal
                }}
                style={{
                  backgroundColor: 'crimson',
                  width: '50%',
                  marginTop: 20
                }}
              />
              <Button
                title='Save Task'
                onPress={handleSaveTask}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <MessageModal {...messageModalState} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1
  },
  filterWrapper: {
    marginBottom: 10
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    color: '#000',
    backgroundColor: '#ccc',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  taskBox: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  taskDetails: {
    flex: 1,
    marginHorizontal: 10
  },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  deleteButton: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  noTaskText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  datePickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
  },
  datePickerText: { color: '#333' },
  saveButton: { backgroundColor: '#4CAF50', marginTop: 20 }
})

export default TasksForm
