import React, { useEffect, useState, useContext, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialIcons, AntDesign } from '@expo/vector-icons'
import moment from 'moment'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  getDoc,
  getDocs,
  doc,
  deleteDoc
} from 'firebase/firestore'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

interface Transaction {
  id: string
  product: string
  quantity: number
  price: number
  amountDue: number
  amountPaid: number
  change: number
  transactionType: string
  category: string
  customerDetails?: {
    name: string
    phone: string
    age: string
    address: string
    location: string
    email: string
  }
  supplierDetails?: {
    name: string
    phone: string
    age: string
    address: string
    location: string
    email: string
  }
  date?: any
}

const TransactionsList = ({ filter = 'All' }: { filter?: string }) => {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [currency, setCurrency] = useState('R')
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        // Fetch currency preference
        const userDoc = await getDoc(doc(db, `Users/${userId}`))
        if (userDoc.exists()) {
          setCurrency(userDoc.data()?.currency || 'R')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(db, `Users/${user.uid}/transactions`)
        const transactionsSnapshot = await getDocs(transactionsRef)

        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[]

        setTransactions(transactionsData)
      } catch (error) {
        console.error('Error fetching transactions from Firebase:', error)
        Alert.alert('Error', 'Failed to fetch transactions.')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  const filteredTransactions = useMemo(() => {
    if (filter === 'All') return transactions
    return transactions.filter(
      transaction =>
        transaction.transactionType.toLowerCase() === filter.toLowerCase()
    )
  }, [transactions, filter])

  // Replace this inside TransactionsList component:

  const confirmDelete = (id: string) => {
    showMessageModal(
      MessageTypes.DANGEROUS_DECISION,
      'Confirm Deletion',
      'You are about to permanently delete this transaction. This action cannot be undone. Do you want to proceed?',
      () => handleDelete(id),
      {
        onReject: hideMessageModal,
        buttonText: 'Delete',
        altButtonText: 'Cancel'
      }
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const transactionRef = doc(db, `Users/${user.uid}/transactions`, id)
      await deleteDoc(transactionRef)

      setTransactions(prev => prev.filter(transaction => transaction.id !== id))

      showMessageModal(
        MessageTypes.SUCCESS,
        'Deleted',
        'Transaction deleted successfully.',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Error',
        'Failed to delete transaction.',
        hideMessageModal
      )
    }
  }

  if (loading) {
    return <ActivityIndicator size='large' color={activeColors.primary[200]} />
  }

  return (
    <>
      <FlatList
        data={filteredTransactions.flatMap(item => {
          const baseDetails = {
            id: item.id,
            date: item.date,
            transactionType: item.transactionType,
            customerDetails: item.customerDetails,
            supplierDetails: item.supplierDetails,
            amountPaid: item.amountPaid,
            change: item.change
          }

          if (Array.isArray(item.products)) {
            return item.products.map(product => ({
              ...baseDetails,
              product: product.name,
              category: product.category,
              price: product.price,
              quantity: product.quantity,
              amountDue: product.amountDue || product.price * product.quantity
            }))
          }

          // fallback for older transaction structure
          return [item]
        })}
        keyExtractor={(item, index) => `${item.id}-${item.product}-${index}`}
        renderItem={({ item }) => {
          const isExpense = item.transactionType?.toLowerCase() === 'expense'
          const personTypeLabel = isExpense ? 'Supplier' : 'Customer'
          const personDetails = isExpense
            ? item.supplierDetails
            : item.customerDetails

          const iconName = isExpense ? 'minuscircle' : 'pluscircle'
          const iconColor = isExpense
            ? activeColors.redAccent[500]
            : 'deepskyblue'

          return (
            <View
              style={[
                styles.cardContainer,
                {
                  borderColor: 'white',
                  backgroundColor: activeColors.primary[300]
                }
              ]}
            >
              <View style={{ width: '35%', gap: 3 }}>
                <View style={styles.row}>
                  <AntDesign name={iconName} size={18} color={iconColor} />
                  <Text
                    style={[
                      styles.amountText,
                      { color: activeColors.grey[900] }
                    ]}
                  >
                    {currency} {item.amountDue}
                  </Text>
                </View>
                <View style={[styles.categoryContainer]}>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: activeColors.grey[900] }
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionInfo}>
                <Text
                  style={[
                    styles.transactionText,
                    { color: activeColors.grey[900] }
                  ]}
                >
                  Product: {item.product}
                </Text>
                <Text
                  style={[
                    styles.transactionText,
                    { color: activeColors.grey[900] }
                  ]}
                >
                  Quantity: {item.quantity}
                </Text>
                <Text
                  style={[
                    styles.transactionText,
                    { color: activeColors.grey[900] }
                  ]}
                >
                  Date:
                  {item.date ? moment(item.date).format('YYYY-MM-DD') : 'N/A'}
                </Text>
                <Text
                  style={[
                    styles.transactionText,
                    { color: activeColors.grey[900] }
                  ]}
                >
                  {personTypeLabel} Name: {personDetails?.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <MaterialIcons
                    name='delete'
                    size={24}
                    color={activeColors.redAccent[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />
      <MessageModal {...messageModalState} />
    </>
  )
}

export default TransactionsList

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '95%',
    marginVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  amountText: {
    fontSize: 18,
    fontWeight: '900'
  },
  categoryContainer: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start'
  },
  categoryText: {
    fontSize: 12
  },
  transactionInfo: {
    flexGrow: 5,
    gap: 6,
    flexShrink: 5
  },
  transactionText: {
    fontSize: 16
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 50
  }
})
