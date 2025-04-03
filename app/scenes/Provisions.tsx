import React, { useState, useContext, useEffect } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Alert,
  TextInput,
  Modal,
  Text,
  TouchableOpacity
} from 'react-native'
import { Flex, Button, Pressable } from '@react-native-material/core'
import { SelectList } from 'react-native-dropdown-select-list'
import { MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { db, auth } from '@/FirebaseConfig'
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs
} from 'firebase/firestore'
import { SegmentedButtons } from 'react-native-paper'
import FormAppBar from '@/components/FormAppBar'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

const typeEmojies = {
  Product: '💼',
  Service: '🛠️'
}

interface Provision {
  id: string
  provisionName: string
  provisionCategory: string
  unitPrice: number
  [key: string]: any
}

const typeOptions = Object.keys(typeEmojies)
  .filter(key => key !== 'Default')
  .map((item, index) => ({ key: index.toString(), value: item }))

export default function ProvisionsForm () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [selectedType, setSelectedType] = useState<'Product' | 'Service'>(
    'Product'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [allProvisions, setAllProvisions] = useState([])
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [filteredProvisions, setFilteredProvisions] = useState<Provision[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedProvision, setSelectedProvision] = useState(null)
  const [newProvisionType, setNewProvisionType] = useState('')
  const [newProvisionName, setNewProvisionName] = useState('')
  const [newProvisionCategory, setNewProvisionCategory] = useState('')
  const [newMinimumQuantityThreshold, setNewMinimumQuantityThreshold] =
    useState('')
  const [newMaximumQuantityThreshold, setNewMaximumQuantityThreshold] =
    useState('')
  const [newSupplierID, setNewSupplierID] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newUnitPrice, setNewUnitPrice] = useState('')
  const [newDiscount, setNewDiscount] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const provisionsPerPage = 5

  const totalPages = Math.ceil(filteredProvisions.length / provisionsPerPage)

  const paginatedProducts = filteredProvisions
    .filter(item => item.type === selectedType) // double-check filter
    .slice(
      (currentPage - 1) * provisionsPerPage,
      currentPage * provisionsPerPage
    )

  const getNextProvisionID = async (userId: string): Promise<string> => {
    const provisionsRef = collection(db, `Users/${userId}/provisions`)
    const snapshot = await getDocs(provisionsRef)

    if (snapshot.empty) {
      return 'PROV0001' // First entry
    }

    // Extract provisionIDs and find the highest one
    const ids = snapshot.docs.map(doc => doc.data().provisionID)
    const lastNumber = Math.max(
      ...ids.map(id => parseInt(id.replace('PROV', ''), 10))
    )

    // Increment and format as PROV000X
    return `PROV${String(lastNumber + 1).padStart(4, '0')}`
  }

  const fetchProvisions = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.error('User not authenticated.')
        return []
      }

      const provisionsRef = collection(db, `Users/${userId}/provisions`)
      const querySnapshot = await getDocs(provisionsRef)

      const provisionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      const filtered = provisionsList.filter(item => item.type === selectedType)
      setFilteredProvisions(filtered)
      setAllProvisions(provisionsList) // so we can reuse it in search
    } catch (error) {
      console.error('Error fetching provisions:', error)
    }
  }

  useEffect(() => {
    fetchProvisions()
  }, [selectedType])

  const handleSearch = query => {
    setSearchQuery(query)
    const filtered = allProvisions.filter(
      item =>
        item.type === selectedType &&
        item.provisionName.toLowerCase().includes(query.toLowerCase())
    )

    setCurrentPage(1)
  }

  const handleAddProvision = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        showMessageModal(
          MessageTypes.FAIL,
          'Authentication Error',
          'User is not authenticated.',
          hideMessageModal
        )
        return
      }

      const newID = await getNextProvisionID(userId)

      const newProvision = {
        provisionID: newID,
        provisionName: newProvisionName,
        provisionCategory: newProvisionCategory,
        minimumQuantityThreshold: parseInt(newMinimumQuantityThreshold) || 0,
        maximumQuantityThreshold: parseInt(newMaximumQuantityThreshold) || 0,
        unit: newUnit,
        unitPrice: parseFloat(newUnitPrice) || 0,
        discount: parseFloat(newDiscount) || 0,
        supplierID: newSupplierID,
        type: selectedType, // new field
        dateAdded: new Date().toISOString()
      }

      const provisionsRef = collection(db, `Users/${userId}/provisions`)
      await addDoc(provisionsRef, newProvision)

      // ✅ Immediately Fetch Updated Provisions
      fetchProvisions()

      // ✅ Close Modal & Clear Form
      setModalVisible(false)
      setNewProvisionName('')
      setNewProvisionCategory('')
      setNewMinimumQuantityThreshold('')
      setNewMaximumQuantityThreshold('')
      setNewUnit('')
      setNewUnitPrice('')
      setNewDiscount('')
      setNewSupplierID('')

      // ✅ Show Success Message
      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        `${selectedType} added successfully.`,
        hideMessageModal
      )
    } catch (error) {
      console.error('Error adding provision:', error)
      showMessageModal(
        MessageTypes.SUCCESS,
        'FAIL',
        `Failed to add ${selectedType} successfully.`,
        hideMessageModal
      )
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        showMessageModal(
          MessageTypes.FAIL,
          'Authentication Error',
          'User is not authenticated.',
          hideMessageModal
        )
        return
      }

      const productRef = doc(db, `Users/${userId}/provisions`, id)
      await deleteDoc(productRef)

      fetchProvisions() // Refresh the list after deletion
      setEditModalVisible(false)

      showMessageModal(
        MessageTypes.SUCCESS,
        'Deleted',
        `The ${selectedType.toLowerCase()} has been successfully deleted.`,
        hideMessageModal
      )
    } catch (error) {
      console.error('Error deleting provision:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Delete Error',
        `Failed to delete the ${selectedType.toLowerCase()}.`,
        hideMessageModal
      )
    }
  }

  const handleEdit = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        showMessageModal(
          MessageTypes.FAIL,
          'Authentication Error',
          'User is not authenticated.',
          hideMessageModal
        )
        return
      }

      const productRef = doc(
        db,
        `Users/${userId}/provisions`,
        selectedProvision.id
      )
      await updateDoc(productRef, selectedProvision)

      fetchProvisions() // Refresh the list after update
      setEditModalVisible(false)

      showMessageModal(
        MessageTypes.SUCCESS,
        'Updated',
        `The ${selectedType.toLowerCase()} details have been successfully updated.`,
        hideMessageModal
      )
    } catch (error) {
      console.error('Error updating provision:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Update Error',
        `Failed to update ${selectedType.toLocaleLowerCase()}.`,
        hideMessageModal
      )
    }
  }

  return (
    <Flex
      fill
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title={'Product/Service List'} backTarget='/profile' />
      <SegmentedButtons
        value={selectedType}
        onValueChange={value => setSelectedType(value)}
        buttons={[
          {
            value: 'Product',
            label: 'Products',
            icon: 'shopping-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              selectedType === 'Product'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          },
          {
            value: 'Service',
            label: 'Services',
            icon: 'hammer-wrench',
            uncheckedColor: activeColors.grey[900],
            style:
              selectedType === 'Service'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          }
        ]}
        style={{ marginBottom: 10 }}
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
        {paginatedProducts.map(product => (
          <Pressable
            key={product.id}
            style={[
              styles.listItem,
              {
                backgroundColor: activeColors.primary[300],
                borderColor: activeColors.grey[400]
              }
            ]}
            onPress={() => {
              setSelectedProvision({ ...product })
              setEditModalVisible(true)
            }}
          >
            <Text style={styles.emoji}>
              {typeEmojies[product.type] || '📦'}
            </Text>
            <View style={styles.listItemContent}>
              <Text
                style={[styles.listItemName, { color: activeColors.grey[900] }]}
              >
                {product.provisionName}
              </Text>
              <Text
                style={[
                  styles.listItemCategory,
                  { color: activeColors.grey[800] }
                ]}
              >
                {product.provisionCategory}
              </Text>
            </View>
            <Text
              style={[styles.listItemPrice, { color: activeColors.grey[900] }]}
            >
              {product.unitPrice.toFixed(2)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Flex direction='row' justify='center' style={styles.pagination}>
        <TouchableOpacity
          style={styles.paginationButton}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        >
          <MaterialIcons
            name='arrow-circle-left'
            size={28}
            color={currentPage === 1 ? '#ddd' : '#333'}
          />
        </TouchableOpacity>
        <Text
          style={[styles.paginationText, { color: activeColors.primary[900] }]}
        >
          {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity
          style={styles.paginationButton}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        >
          <MaterialIcons
            name='arrow-circle-right'
            size={28}
            color={currentPage === totalPages ? '#ddd' : '#333'}
          />
        </TouchableOpacity>
      </Flex>

      <Button
        title='Add New'
        style={[styles.addNewButton, { backgroundColor: 'deepskyblue' }]}
        onPress={() => setModalVisible(true)}
      />
      <MessageModal {...messageModalState} />

      <Modal
        visible={modalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: activeColors.primary[200] }
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons
                name='close'
                size={24}
                color={activeColors.redAccent[500]}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalTitle,
                { color: theme.mode === 'dark' ? '#fff' : '#000' }
              ]}
            >
              Add New {selectedType}
            </Text>
            <TextInput
              placeholder={`${selectedType} Name`}
              value={newProvisionName}
              onChangeText={setNewProvisionName}
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder={`${selectedType} Category`}
              value={newProvisionCategory}
              onChangeText={setNewProvisionCategory}
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder={`${selectedType} Price`}
              value={newUnitPrice}
              onChangeText={setNewUnitPrice}
              keyboardType='numeric'
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            {selectedType == 'Product' && (
              <>
                <TextInput
                  placeholder='Unit'
                  value={newUnit}
                  onChangeText={setNewUnit}
                  placeholderTextColor={
                    theme.mode === 'light' ? '#888' : '#fff'
                  } // <-- Ensure white placeholder text in dark mode
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor:
                        theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                      color: theme.mode === 'light' ? '#000' : '#fff'
                    }
                  ]}
                />
                <TextInput
                  placeholder='Minimum Quantity Threshold'
                  value={newMinimumQuantityThreshold}
                  onChangeText={setNewMinimumQuantityThreshold}
                  placeholderTextColor={
                    theme.mode === 'light' ? '#888' : '#fff'
                  } // <-- Ensure white placeholder text in dark mode
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor:
                        theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                      color: theme.mode === 'light' ? '#000' : '#fff'
                    }
                  ]}
                />
                <TextInput
                  placeholder='Maximum Quantity Threshold'
                  value={newMaximumQuantityThreshold}
                  onChangeText={setNewMaximumQuantityThreshold}
                  placeholderTextColor={
                    theme.mode === 'light' ? '#888' : '#fff'
                  } // <-- Ensure white placeholder text in dark mode
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor:
                        theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                      color: theme.mode === 'light' ? '#000' : '#fff'
                    }
                  ]}
                />
              </>
            )}

            <Flex direction='row' justify='between'>
              <Button
                title='Cancel'
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              />
              <Button
                title='Add'
                onPress={handleAddProvision}
                style={styles.addButton}
              />
            </Flex>
          </View>
        </View>
      </Modal>

      {selectedProvision && (
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <MaterialIcons
                  name='close'
                  size={24}
                  color={activeColors.redAccent[500]}
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.mode === 'dark' ? '#fff' : '#000' }
                ]}
              >
                Edit Product
              </Text>
              <TextInput
                placeholder='Product Name'
                value={selectedProvision.provisionName}
                onChangeText={text =>
                  setSelectedProvision(prev => ({
                    ...prev,
                    provisionName: text
                  }))
                }
                placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <SelectList
                setSelected={val =>
                  setSelectedProvision(prev => ({
                    ...prev,
                    provisionCategory: val
                  }))
                }
                defaultOption={{
                  key: 'selected',
                  value: selectedProvision.provisionCategory
                }}
                data={typeOptions}
                placeholder='Select Category'
                boxStyles={{
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  borderColor: '#555',
                  borderRadius: 5
                }}
                dropdownStyles={{
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  borderColor: '#555'
                }}
                inputStyles={{
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }}
              />
              <TextInput
                placeholder='Price'
                value={String(selectedProvision.unitPrice)}
                onChangeText={text =>
                  setSelectedProvision(prev => ({
                    ...prev,
                    unitPrice: parseFloat(text)
                  }))
                }
                keyboardType='numeric'
                placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <Flex direction='row' justify='between'>
                <Button
                  title='Delete'
                  onPress={() => handleDelete(selectedProvision.id)}
                  style={styles.deleteButton}
                />
                <Button
                  title='Update'
                  onPress={handleEdit}
                  style={styles.addButton}
                />
              </Flex>
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
    padding: 10
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
    padding: 15
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1
  },
  emoji: {
    fontSize: 24,
    marginRight: 10
  },
  listItemContent: {
    flex: 1
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  listItemCategory: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  listItemPrice: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  addNewButton: {
    marginTop: 10,
    borderRadius: 10
  },
  pagination: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  paginationButton: {
    padding: 10,
    borderRadius: 8
  },
  paginationText: {
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    backgroundColor: 'white',
    elevation: 5
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    padding: 10,
    marginVertical: 8
  },
  cancelButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: 'red'
  },
  addButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: 'deepskyblue'
  },
  deleteButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: 'red'
  }
})
