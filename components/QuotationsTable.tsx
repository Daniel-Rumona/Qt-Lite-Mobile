import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable
} from 'react-native'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { db, auth } from '@/FirebaseConfig'
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { useNavigation } from '@react-navigation/native'
import { Flex, Button } from '@react-native-material/core'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

const statusConfig = {
  Paid: { icon: 'check-circle', color: '#4CAF50' },
  Expired: { icon: 'cancel', color: '#F44336' },
  Draft: { icon: 'clipboard-text', color: '#FFD700' },
  Pending: { icon: 'clock', color: 'orange' }
}

export default function QuotationsTable () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [modalVisible, setModalVisible] = useState(false)
  const [quotations, setQuotations] = useState([])
  const [filteredQuotations, setFilteredQuotations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const itemsPerPage = 5 // Number of rows per page
  const navigation = useNavigation()
  // Fetch quotations from Firestore
  const fetchQuotations = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const quotationsSnapshot = await getDocs(
        collection(db, `Users/${userId}/quotations`)
      )
      const fetchedQuotations = quotationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setQuotations(fetchedQuotations)
      setFilteredQuotations(fetchedQuotations)
    } catch (error) {
      console.error('Error fetching quotations:', error)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [])

  // Handle search
  const handleSearch = query => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredQuotations(quotations) // Reset to full list if search is cleared
    } else {
      const filtered = quotations.filter(
        quotation =>
          quotation.customerName.toLowerCase().includes(query.toLowerCase()) ||
          quotation.quotationNumber.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredQuotations(filtered)
    }
  }
  const formatDate = (value: any): string => {
    if (!value) return 'N/A'
    if (typeof value.toDate === 'function') {
      return value.toDate().toDateString()
    }
    if (typeof value === 'string') {
      return new Date(value).toDateString()
    }
    return 'Invalid Date'
  }

  const handleDeleteQuotation = async quotationID => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      await deleteDoc(doc(db, `Users/${userId}/quotations`, quotationID))
      showMessageModal(
        MessageTypes.SUCCESS,
        'Delete Success',
        'Quotation details successfully deleted!',
        hideMessageModal
      )
      fetchQuotations()
    } catch (error) {
      console.error('Error deleting quotation:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Delete Failure',
        'Failed to delete quotation details!',
        hideMessageModal
      )
    }
  }
  const handleEditQuotation = async updatedQuotation => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const quotationRef = doc(
        db,
        `Users/${userId}/quotations`,
        updatedQuotation.id
      )
      await updateDoc(quotationRef, updatedQuotation)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Update Success',
        'Quotation details updated successfully!',
        hideMessageModal
      )
      fetchQuotations()
    } catch (error) {
      console.error('Error updating quotation:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Update Failure',
        'Failed to edit quotation details!',
        hideMessageModal
      )
    }
  }

  // Pagination
  // Calculate total pages, ensuring it is at least 1
  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotations.length / itemsPerPage)
  )

  // Ensure the current page is within a valid range
  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const quotationstates = [
    {
      title: 'Accepted'
    },
    {
      title: 'Rejected'
    },
    {
      title: 'Pending'
    },
    {
      title: 'Draft'
    }
  ]

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <Flex
        direction='row'
        style={{
          padding: 5,
          gap: 5,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 10 }}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          {quotationstates.map((block, index) => {
            const count = quotations.filter(
              quotation => quotation.status === block.title
            ).length

            return (
              <View
                key={index}
                style={{
                  flexDirection: 'column',
                  justifyContent: 'space-around',
                  height: 80,
                  width: '25%',
                  backgroundColor: activeColors.primary[500],
                  borderRadius: 15,
                  padding: 15,
                  marginRight: 10
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: 14
                    }}
                  >
                    {block.title}
                  </Text>
                </View>
                <View
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignSelf: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: '700'
                    }}
                  >
                    {count} of {quotations.length}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </Flex>
      {/* Search Bar */}
      <TextInput
        placeholder='Search by customer or quotation number'
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
      />

      {paginatedQuotations.map(quotation => (
        <Pressable
          key={quotation.id}
          style={styles.quotationBox}
          onPress={() => {
            setSelectedQuotation(quotation)
            setModalVisible(true)
          }}
        >
          <Flex direction='row' style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={statusConfig[quotation.status]?.icon || 'file-document'}
              size={32}
              color={statusConfig[quotation.status]?.color || 'gray'}
            />
            <View style={styles.quotationDetails}>
              <Text style={styles.quotationTitle}>
                {quotation.customer['customerName']} | {quotation.status}
              </Text>
              <Text style={styles.quotationDate}>
                Period: {formatDate(quotation.issueDate)} -{' '}
                {formatDate(quotation.dueDate)}
              </Text>

              <Text style={styles.quotationDate}>
                Amount: {quotation.totalAmount}
              </Text>
            </View>
          </Flex>
        </Pressable>
      ))}

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage <= 1}
        >
          <MaterialIcons
            name='arrow-back'
            size={24}
            color={currentPage <= 1 ? '#ddd' : '#333'}
          />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Page {totalPages > 0 ? currentPage : 0} of {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          <MaterialIcons
            name='arrow-forward'
            size={24}
            color={currentPage >= totalPages ? '#ddd' : '#333'}
          />
        </TouchableOpacity>
      </View>
      <MessageModal {...messageModalState} />

      {/* Options Modal */}
      <Modal visible={modalVisible} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: activeColors.primary[200] }
            ]}
          >
            <Flex
              direction='row'
              style={{
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color:
                      theme.mode === 'dark'
                        ? activeColors.grey[900]
                        : activeColors.grey[100]
                  }
                ]}
              >
                Select Option
              </Text>

              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>
            {selectedQuotation && (
              <Text
                style={[
                  styles.modalTitle,
                  { textAlign: 'center', color: '#fff' }
                ]}
              >
                Customer: {selectedQuotation.customer['customerName'] || 'N/A'}
              </Text>
            )}

            <Flex direction='column'>
              <Button
                title='Edit'
                onPress={() => {
                  setModalVisible(false)
                  navigation.navigate('scenes/QuotationForm', {
                    mode: 'edit',
                    data: selectedQuotation
                  })
                }}
                style={styles.modalButton}
              />
              <Button
                title='Delete'
                onPress={() => {
                  handleDeleteQuotation(selectedQuotation.id)
                  setModalVisible(false)
                }}
                style={styles.modalButton}
              />
            </Flex>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff'
  },
  quotationBox: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10
  },
  closeButton: {
    position: 'absolute',
    top: -1,
    right: 10,
    zIndex: 10
  },
  quotationDetails: {
    flex: 1,
    marginHorizontal: 10
  },
  quotationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  quotationDate: { fontSize: 12, fontWeight: 'bold', color: 'grey' },
  searchBar: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  paginationText: {
    fontSize: 14,
    color: '#333'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  modalButton: {
    borderWidth: 1,
    backgroundColor: 'deepskyblue',
    borderRadius: 15,
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  }
})
