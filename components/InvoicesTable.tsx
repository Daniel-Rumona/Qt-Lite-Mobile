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
import { Flex, Button } from '@react-native-material/core'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

const statusConfig = {
  Expired: { icon: 'cancel', color: '#F44336' },
  Pending: { icon: 'clock', color: 'orange' },
  Paid: { icon: 'check-circle', color: '#4CAF50' }
}

export default function InvoicesTable () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [modalVisible, setModalVisible] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const itemsPerPage = 5

  const determineStatus = invoice => {
    const now = new Date()
    const dueDate = new Date(invoice.dueDate)
    if (invoice.paymentStatus === 'Paid') return 'Paid'
    return now > dueDate ? 'Expired' : 'Pending'
  }

  const fetchInvoices = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const invoicesSnapshot = await getDocs(
        collection(db, `Users/${userId}/invoices`)
      )
      const fetchedInvoices = invoicesSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          status: determineStatus(data)
        }
      })

      setInvoices(fetchedInvoices)
      setFilteredInvoices(fetchedInvoices)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

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

  const handleSearch = query => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredInvoices(invoices)
    } else {
      const filtered = invoices.filter(
        invoice =>
          invoice.customer.name.toLowerCase().includes(query.toLowerCase()) ||
          invoice.invoiceNumber.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredInvoices(filtered)
    }
  }

  const handleDeleteInvoice = async invoiceID => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      await deleteDoc(doc(db, `Users/${userId}/invoices`, invoiceID))
      showMessageModal(
        MessageTypes.SUCCESS,
        'Delete Success',
        'Invoice details successfully deleted!',
        hideMessageModal
      )
      fetchInvoices()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Delete Failure',
        'Failed to delete invoice details!',
        hideMessageModal
      )
    }
  }

  const handleEditInvoice = async updatedInvoice => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const invoiceRef = doc(db, `Users/${userId}/invoices`, updatedInvoice.id)
      await updateDoc(invoiceRef, updatedInvoice)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Update Success',
        'Invoice details updated successfully!',
        hideMessageModal
      )
      fetchInvoices()
    } catch (error) {
      console.error('Error updating invoice:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Update Failure',
        'Failed to edit invoice details!',
        hideMessageModal
      )
    }
  }

  const handleConfirmPayment = async invoiceID => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const invoiceRef = doc(db, `Users/${userId}/invoices`, invoiceID)
      await updateDoc(invoiceRef, { paymentStatus: 'Paid' })
      showMessageModal(
        MessageTypes.SUCCESS,
        'Payment Success',
        'Invoice payment updated successfully!',
        hideMessageModal
      )
      fetchInvoices()
    } catch (error) {
      console.error('Error confirming payment:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Payment Failure',
        'Invoice payment failed!',
        hideMessageModal
      )
    }
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / itemsPerPage)
  )

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const statusBlocks = ['Paid', 'Pending', 'Expired']

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
        {statusBlocks.map((status, index) => {
          const count = invoices.filter(
            invoice => invoice.status === status
          ).length

          return (
            <View
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                height: 80,
                width: '32%',
                backgroundColor: activeColors.primary[500],
                borderRadius: 15,
                padding: 15
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                {status}
              </Text>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: '700',
                  textAlign: 'center'
                }}
              >
                {count} of {invoices.length}
              </Text>
            </View>
          )
        })}
      </Flex>

      <TextInput
        placeholder='Search by customer or invoice number'
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.searchBar}
      />

      {paginatedInvoices.map(invoice => (
        <Pressable
          key={invoice.id}
          style={styles.quotationBox}
          onPress={() => {
            setSelectedInvoice(invoice)
            setModalVisible(true)
          }}
        >
          <Flex direction='row' style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={statusConfig[invoice.status]?.icon || 'file-document'}
              size={32}
              color={statusConfig[invoice.status]?.color || 'gray'}
            />
            <View style={styles.quotationDetails}>
              <Text style={styles.quotationTitle}>
                {invoice.customer['customerName']} | {invoice.status}
              </Text>
              <Text style={styles.quotationDate}>
                Period: {formatDate(invoice.issueDate)} -{' '}
                {formatDate(invoice.dueDate)}
              </Text>

              <Text style={styles.quotationDate}>
                Amount: {invoice.totalAmount}
              </Text>
            </View>
          </Flex>
        </Pressable>
      ))}

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
            {selectedInvoice && (
              <Text
                style={[
                  styles.modalTitle,
                  { textAlign: 'center', color: '#fff' }
                ]}
              >
                Customer: {selectedInvoice.customer['customerName'] || 'N/A'}
              </Text>
            )}
            <Flex direction='column'>
              {/* <Button
                title='Edit'
                onPress={() => {
                  handleEditInvoice(selectedInvoice)
                  setModalVisible(false)
                }}
                style={styles.modalButton}
              /> */}
              <Button
                title='Confirm Payment'
                onPress={() => {
                  handleConfirmPayment(selectedInvoice.id)
                  setModalVisible(false)
                }}
                style={styles.modalButton}
              />
              <Button
                title='Delete'
                onPress={() => {
                  handleDeleteInvoice(selectedInvoice.id)
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
