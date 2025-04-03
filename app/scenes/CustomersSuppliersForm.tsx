import React, { useState, useContext, useEffect } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity
} from 'react-native'
import { Flex, Button, Text, Pressable } from '@react-native-material/core'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { SelectList } from 'react-native-dropdown-select-list'
import { SegmentedButtons } from 'react-native-paper'
import FormAppBar from '@/components/FormAppBar'
import { auth, db } from '@/FirebaseConfig'
import { generateNextID } from '@/utils/firebase/idService'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'

export default function CustomersSuppliersForm () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [generatedID, setGeneratedID] = useState('')
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonContact, setNewPersonContact] = useState('')
  const [newPersonEmail, setNewPersonEmail] = useState('')
  const [newPersonLocation, setNewPersonLocation] = useState('')
  const [newPersonCategory, setNewPersonCategory] = useState('')
  const [newPersonSupplyCategory, setNewPersonSupplyCategory] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchCustomers()
    fetchSuppliers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not logged in.')
      }

      const customersRef = collection(doc(db, 'Users', userId), 'customers')
      const querySnapshot = await getDocs(customersRef)
      const fetchedCustomers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCustomers(fetchedCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Fetch Failure',
        'Failed to fetch customers.',
        hideMessageModal
      )
    }
  }

  const fetchSuppliers = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        throw new Error('User not logged in.')
      }

      const suppliersRef = collection(doc(db, 'Users', userId), 'suppliers')
      const querySnapshot = await getDocs(suppliersRef)
      const fetchedSuppliers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setSuppliers(fetchedSuppliers)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Fetch Failure',
        'Failed to fetch suppliers.',
        hideMessageModal
      )
    }
  }
  const getIcon = isSupplier => (
    <MaterialIcons
      name={isSupplier ? 'business' : 'person'}
      size={24}
      color={activeColors.blueAccent[300]}
    />
  )
  const handleCategorySelect = async (selected: string) => {
    setNewPersonCategory(selected)

    const userId = auth.currentUser?.uid
    if (!userId) return

    const collectionName = selected === 'Customer' ? 'customers' : 'suppliers'
    const idField = selected === 'Customer' ? 'customerID' : 'supplierID'
    const prefix = selected === 'Customer' ? 'CU' : 'SU'

    try {
      const nextID = await generateNextID(
        userId,
        collectionName,
        prefix,
        idField
      )
      setGeneratedID(nextID)
    } catch (err) {
      console.error('Error generating ID:', err)
      setGeneratedID('')
    }
  }

  const handleAddNew = async () => {
    if (!newPersonName || !newPersonCategory) {
      Alert.alert('Error', 'Name and category are required!')
      return
    }

    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert('Error', 'User not logged in.')
      return
    }

    // ✅ Determine collection and ID prefix
    const collectionName =
      newPersonCategory === 'Customer' ? 'customers' : 'suppliers'
    const idField =
      newPersonCategory === 'Customer' ? 'customerID' : 'supplierID'
    const prefix = newPersonCategory === 'Customer' ? 'CU' : 'SU'

    try {
      // ✅ Fetch existing records from Firestore
      const targetCollectionRef = collection(
        doc(db, 'Users', userId),
        collectionName
      )
      const querySnapshot = await getDocs(targetCollectionRef)

      // ✅ Extract IDs safely (avoid missing `id` fields)
      const existingRecords = querySnapshot.docs
        .map(doc => doc.data()[idField])
        .filter(id => id && id.startsWith(prefix)) // Ensure ID exists and is correctly formatted
        .sort()

      // ✅ Generate the next sequential ID (CU0001, SU0001, etc.)
      const nextID = await generateNextID(
        userId,
        collectionName,
        prefix,
        idField
      )
      setGeneratedID(nextID)

      // ✅ Create the new record
      const newPerson = {
        [idField]: nextID, // 🔥 Unique formatted ID
        name: newPersonName,
        email: newPersonEmail,
        phone: newPersonContact,
        location: newPersonLocation,
        dateAdded: new Date().toISOString()
      }

      // ✅ Only add `supplyCategory` if it's a Supplier
      if (newPersonCategory === 'Supplier') {
        newPerson.supplyCategory = newPersonSupplyCategory
      }

      // ✅ Save to Firestore
      await addDoc(targetCollectionRef, newPerson)

      // ✅ Refresh data
      newPersonCategory === 'Customer' ? fetchCustomers() : fetchSuppliers()

      // ✅ Success message
      const categoryMessage =
        newPersonCategory === 'Customer'
          ? `Customer added successfully!`
          : `Supplier added successfully!`

      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        categoryMessage,
        hideMessageModal
      )

      // ✅ Reset fields
      setNewPersonName('')
      setNewPersonEmail('')
      setNewPersonContact('')
      setNewPersonLocation('')
      setNewPersonCategory('')
      setNewPersonSupplyCategory('')
      setAddModalVisible(false)
    } catch (error) {
      console.error('Error adding document:', error)
      Alert.alert('Error', 'Failed to add new person.')
    }
  }

  const handleUpdate = async () => {
    if (!selectedItem) return

    const userId = auth.currentUser?.uid
    if (!userId) {
      Alert.alert('Error', 'User not logged in.')
      return
    }

    const collectionName = selectedItem.supplyCategory
      ? 'suppliers'
      : 'customers'

    try {
      // ✅ Correct Firestore reference
      const targetCollection = collection(
        doc(db, 'Users', userId),
        collectionName
      )
      const docRef = doc(targetCollection, selectedItem.id)

      // ✅ Ensure correct fields before updating
      const updatedData = {
        name: selectedItem.name,
        email: selectedItem.email,
        phone: selectedItem.phone,
        location: selectedItem.location,
        dateUpdated: new Date().toISOString()
      }

      if (selectedItem.supplyCategory) {
        updatedData.supplyCategory = selectedItem.supplyCategory
      }

      await updateDoc(docRef, updatedData)

      // ✅ Refresh the correct data list
      if (collectionName === 'customers') {
        fetchCustomers()
      } else {
        fetchSuppliers()
      }
      setEditModalVisible(false)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        `${
          collectionName === 'customers' ? 'Customer' : 'Supplier'
        } updated successfully!`,
        hideMessageModal
      )

      setEditModalVisible(false)
    } catch (error) {
      console.error('Error updating document:', error)
      setEditModalVisible(false)
      showMessageModal(
        MessageTypes.FAIL,
        'Update Error',
        'Failed to update details!',
        hideMessageModal
      )
    }
  }

  const handleDelete = async (id, isSupplier) => {
    const userId = auth.currentUser?.uid
    if (!userId) {
      showMessageModal(
        MessageTypes.FAIL,
        'Authentication Error',
        'No user currently logged in!',
        hideMessageModal
      )
      return
    }

    const collectionName = isSupplier ? 'suppliers' : 'customers'

    try {
      // ✅ Correct Firestore reference for subcollections
      const targetCollection = collection(
        doc(db, 'Users', userId),
        collectionName
      )
      const docRef = doc(targetCollection, id)

      await deleteDoc(docRef)

      // ✅ Refresh data after successful deletion
      if (isSupplier) {
        fetchSuppliers()
      } else {
        fetchCustomers()
      }
      setEditModalVisible(false)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        `${isSupplier ? 'Supplier' : 'Customer'} deleted successfully!`,
        hideMessageModal
      )
    } catch (error) {
      console.error('Error deleting document:', error)
      Alert.alert('Error', 'Failed to delete item.')
    }
  }

  const filteredItems =
    filter === 'All'
      ? [...customers, ...suppliers]
      : filter === 'Customers'
      ? customers
      : suppliers

  const searchFilteredItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Flex
      fill
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title={'Personel List'} backTarget='/profile' />
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          {
            value: 'All',
            label: 'All',
            icon: 'layers-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              filter === 'All'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          },
          {
            value: 'Customers',
            label: 'Customers',
            icon: 'account-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              filter === 'Customers'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          },
          {
            value: 'Suppliers',
            label: 'Suppliers',
            icon: 'store-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              filter === 'Suppliers'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          }
        ]}
        style={styles.segmentedButtons}
      />
      <Flex
        direction='column'
        justify='center'
        center={true}
        style={styles.searchContainer}
      >
        <View style={styles.inputWrapper}>
          <MaterialIcons
            name='search'
            size={24}
            color='#000'
            style={styles.searchIcon}
          />
          <TextInput
            placeholder='Search'
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </Flex>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {searchFilteredItems.map(item => (
          <Pressable
            key={item.id}
            style={[
              styles.listItem,
              { backgroundColor: activeColors.primary[300] }
            ]}
            onPress={() => {
              setSelectedItem({ ...item })
              setEditModalVisible(true)
            }}
          >
            {getIcon(!!item.supplyCategory)}
            <View style={styles.listItemContent}>
              <Text style={styles.listItemName}>{item.name}</Text>
              <Text style={styles.listItemLocation}>{item.location}</Text>
              {item.supplyCategory && (
                <Text style={styles.listItemCategory}>
                  {item.supplyCategory}
                </Text>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Button
        title='Add New'
        onPress={() => setAddModalVisible(true)}
        style={styles.addNewButton}
      />
      <MessageModal {...messageModalState} />

      <Modal
        visible={addModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: activeColors.primary[200] }
            ]}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 5
              }}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.mode === 'dark' ? '#fff' : '#000' }
                ]}
              >
                Add New
                {newPersonCategory === 'Customer' ? ' Customer' : ' Supplier'}
              </Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name='close' size={24} color={'crimson'} />
              </TouchableOpacity>
            </View>

            <SelectList
              setSelected={handleCategorySelect}
              data={['Customer', 'Supplier']}
              placeholder='Select Category'
              boxStyles={{
                backgroundColor: theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                borderColor: '#555',
                borderRadius: 5
              }}
              dropdownStyles={{
                backgroundColor: theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                borderColor: '#555'
              }}
              inputStyles={{
                color: theme.mode === 'light' ? '#000' : '#fff' // White text for dark mode
              }}
              dropdownTextStyles={{
                color: theme.mode === 'light' ? '#000' : '#fff' // Ensures dropdown items are white in dark mode
              }}
            />
            <TextInput
              placeholder='Generated ID'
              value={generatedID}
              editable={false}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />

            <TextInput
              placeholder='Full Name'
              value={newPersonName}
              onChangeText={setNewPersonName}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder='Email'
              value={newPersonEmail}
              onChangeText={setNewPersonEmail}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder='Contact'
              value={newPersonContact}
              onChangeText={setNewPersonContact}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder='Location'
              value={newPersonLocation}
              onChangeText={setNewPersonLocation}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            {newPersonCategory === 'Supplier' && (
              <TextInput
                placeholder='Supply Category'
                value={newPersonSupplyCategory}
                onChangeText={setNewPersonSupplyCategory}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
            )}
            <Flex direction='row' justify='between'>
              <Button
                title='Cancel'
                onPress={() => setAddModalVisible(false)}
                style={styles.cancelButton}
              />
              <Button
                title='Add'
                onPress={handleAddNew}
                style={styles.addButton}
              />
            </Flex>
          </View>
        </View>
      </Modal>

      {selectedItem && (
        <Modal
          visible={editModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: activeColors.primary[200] }
              ]}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 5
                }}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.mode === 'dark' ? '#fff' : '#000' }
                  ]}
                >
                  Edit {selectedItem.supplyCategory ? 'Supplier' : 'Customer'}
                </Text>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons name='close' size={24} color={'crimson'} />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder='Full Name'
                value={selectedItem.name}
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, name: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Email'
                value={selectedItem.email}
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, email: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Contact'
                value={selectedItem.phone}
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, phone: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Location'
                value={selectedItem.location}
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, location: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              {selectedItem.supplyCategory && (
                <TextInput
                  placeholder='Supply Category'
                  value={selectedItem.supplyCategory}
                  onChangeText={text =>
                    setSelectedItem(prev => ({ ...prev, supplyCategory: text }))
                  }
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor:
                        theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                      color: theme.mode === 'light' ? '#000' : '#fff'
                    }
                  ]}
                />
              )}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 5
                }}
              >
                <Button
                  title='Update'
                  onPress={handleUpdate}
                  style={{ width: '50%', marginTop: 10 }}
                />
                <Button
                  title='Delete'
                  onPress={() =>
                    handleDelete(selectedItem.id, !!selectedItem.supplyCategory)
                  }
                  style={{
                    width: '50%',
                    backgroundColor: 'red',
                    marginTop: 10
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Flex>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  segmentedButtons: {
    marginVertical: 10
  },
  searchContainer: {
    marginVertical: 10
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  searchIcon: {
    marginRight: 5
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    width: 220
  },
  listContainer: {
    marginTop: 10
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10
  },
  listItemContent: {
    marginLeft: 10,
    flex: 1
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  listItemLocation: {
    fontSize: 14,
    color: '#666'
  },
  listItemCategory: {
    fontSize: 12,
    color: '#888'
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: 'crimson'
  },
  addNewButton: { marginTop: 15, backgroundColor: 'deepskyblue' },
  addButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: 'deepskyblue'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  closeButton: {
    position: 'absolute',
    right: 0
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    padding: 10,
    marginVertical: 8
  }
})
