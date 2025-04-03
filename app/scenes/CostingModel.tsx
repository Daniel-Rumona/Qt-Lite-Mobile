import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Button } from '@react-native-material/core'
import { db, auth } from '@/FirebaseConfig'
import { collection, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore'
import FormAppBar from '@/components/FormAppBar'
import { ThemeContext } from '@/context/ThemeContext' // Importing Theme Context
import { colors } from '@/config/theme'
import UniversalModal from '@/components/UniversalModal'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

const CostingModel = () => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [filteredProvisions, setFilteredProvisions] = useState([])
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [currency, setCurrency] = useState('R') // default to $
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [productCosts, setProductCosts] = useState<any[]>([])
  const [percentageMargin, setPercentageMargin] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalCostPages = Math.ceil(productCosts.length / itemsPerPage)

  useEffect(() => {
    const fetchProvisions = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        // ✅ Fetch user document
        const userDocRef = doc(db, `Users/${user.uid}`)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          setCurrency(userData.currency || '$') // default fallback
        }

        // Fetch provisions
        const productsRef = collection(db, `Users/${user.uid}/products`)
        const servicesRef = collection(db, `Users/${user.uid}/provisions`)
        const [productsSnap, servicesSnap] = await Promise.all([
          getDocs(productsRef),
          getDocs(servicesRef)
        ])

        const products = productsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().productName,
          category: doc.data().category,
          price: doc.data().unitPrice,
          type: 'Product'
        }))

        const services = servicesSnap.docs
          .map(doc => doc.data())
          .filter(doc => doc.type === 'Service')
          .map((doc, i) => ({
            id: `svc-${i}`,
            name: doc.provisionName,
            category: doc.provisionCategory,
            price: doc.unitPrice,
            type: 'Service'
          }))

        setFilteredProvisions([...products, ...services])
      } catch (error) {
        console.error('Error fetching provisions or user data:', error)
      }
    }

    fetchProvisions()
  }, [])

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setAmountDue(
      (parseFloat(product.price) * parseFloat(quantity || '1')).toFixed(2)
    )
  }

  const handleAddProductCost = () => {
    setProductCosts(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', amount: '' }
    ])
  }

  const handleUpdateCost = (id: string, field: string, value: string) => {
    setProductCosts(prev =>
      prev.map(cost => (cost.id === id ? { ...cost, [field]: value } : cost))
    )
  }

  const handleDeleteCost = (id: string) => {
    setProductCosts(prev => prev.filter(cost => cost.id !== id))
  }

  const handleCalculatePrice = () => {
    const totalCost = productCosts.reduce(
      (acc, cost) => acc + parseFloat(cost.amount || '0'),
      0
    )
    const marginMultiplier = 1 + parseFloat(percentageMargin || '0') / 100
    const calculatedPrice = (totalCost * marginMultiplier).toFixed(2)
    alert(`Calculated Price: ${currency}${calculatedPrice}`)
  }
  const handleSubmit = async () => {
    try {
      const user = auth.currentUser
      if (!user || !selectedProduct) return

      // Calculate new unit price from costs and margin
      const totalCost = productCosts.reduce(
        (acc, cost) => acc + parseFloat(cost.amount || '0'),
        0
      )
      const marginMultiplier = 1 + parseFloat(percentageMargin || '0') / 100
      const calculatedPrice = parseFloat(
        (totalCost * marginMultiplier).toFixed(2)
      )

      // Determine Firestore path
      const collectionName =
        selectedProduct.type === 'Product' ? 'products' : 'provisions'
      const docRef = doc(
        db,
        `Users/${user.uid}/${collectionName}`,
        selectedProduct.id
      )

      // Update Firestore
      await updateDoc(docRef, { unitPrice: calculatedPrice })

      alert(`Successfully updated price to ${currency}${calculatedPrice}`)
    } catch (error) {
      console.error('Error updating price:', error)
      alert('Failed to update price.')
    }
  }

  const paginatedCosts = productCosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleNextCostPage = () => {
    if (currentPage < totalCostPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousCostPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: activeColors.primary[300] }]}
    >
      <FormAppBar title={'Costing Model'} />
      <TouchableOpacity
        style={styles.selectProductButton}
        onPress={() => setProductModalVisible(true)}
      >
        <Text style={styles.buttonText}>
          {selectedProduct ? selectedProduct.name : 'Select Product/Service'}
        </Text>
      </TouchableOpacity>
      <TextInput
        placeholder='Quantity'
        keyboardType='numeric'
        value={quantity}
        onChangeText={value => {
          setQuantity(value)
          if (selectedProduct) {
            setAmountDue(
              (
                parseFloat(selectedProduct.price) * parseFloat(value || '1')
              ).toFixed(2)
            )
          }
        }}
        style={styles.input}
      />
      <Text style={styles.label}>
        Amount Due: {currency}
        {amountDue}
      </Text>

      {productCosts.length > 0 && (
        <>
          <Text
            style={[
              styles.formTitle,
              {
                color:
                  theme.mode === 'dark'
                    ? activeColors.grey[900]
                    : activeColors.grey[100]
              }
            ]}
          >
            Product Costs
          </Text>
          <View style={styles.costContainer}>
            {paginatedCosts.map(cost => (
              <View key={cost.id} style={styles.productCost}>
                <TextInput
                  style={[styles.descriptionInput, { color: '#fff' }]}
                  value={cost.description}
                  onChangeText={value =>
                    handleUpdateCost(cost.id, 'description', value)
                  }
                  placeholder='Cost description'
                  placeholderTextColor='#fff'
                />
                <TextInput
                  style={[styles.amountInput, { color: '#fff' }]}
                  value={cost.amount}
                  onChangeText={value =>
                    handleUpdateCost(cost.id, 'amount', value)
                  }
                  placeholder='Amount'
                  placeholderTextColor='#fff'
                  keyboardType='numeric'
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCost(cost.id)}
                >
                  <MaterialIcons name='delete' size={24} color='white' />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={handlePreviousCostPage}
              disabled={currentPage === 1}
            >
              <Text
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.disabledButton
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.paginationText,
                {
                  color:
                    theme.mode === 'dark'
                      ? activeColors.grey[900]
                      : activeColors.grey[100]
                }
              ]}
            >{`Page ${currentPage} of ${totalCostPages}`}</Text>
            <TouchableOpacity
              onPress={handleNextCostPage}
              disabled={currentPage === totalCostPages}
            >
              <Text
                style={[
                  styles.paginationButton,
                  currentPage === totalCostPages && styles.disabledButton
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <TouchableOpacity
        onPress={handleAddProductCost}
        style={styles.addCostButton}
      >
        <Text style={styles.addCostButtonText}>Add Product Cost</Text>
      </TouchableOpacity>
      <View style={styles.marginContainer}>
        <TextInput
          style={styles.marginInput}
          value={percentageMargin}
          onChangeText={setPercentageMargin}
          placeholder='Margin (%)'
          placeholderTextColor='#aaa'
          keyboardType='numeric'
        />
        <TouchableOpacity
          onPress={handleCalculatePrice}
          style={styles.calculateButton}
        >
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
      </View>
      <Button
        title='Submit'
        onPress={handleSubmit}
        style={styles.submitButton}
      />

      <UniversalModal
        visible={productModalVisible}
        onClose={() => setProductModalVisible(false)}
        onSelect={handleSelectProduct}
        title='Select Product/Service'
        data={filteredProvisions} // ✅ send pre-fetched + combined list
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  selectProductButton: {
    backgroundColor: 'deepskyblue',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: '#fff',
    padding: 10,
    marginBottom: 20
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  costContainer: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20
  },
  productCost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  descriptionInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minWidth: 0 // prevents overflow on small screens
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minWidth: 0
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'crimson',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10
  },
  paginationButton: {
    color: 'deepskyblue',
    fontWeight: 'bold'
  },
  disabledButton: {
    color: '#ccc'
  },
  paginationText: {
    fontSize: 16
  },
  addCostButton: {
    backgroundColor: 'deepskyblue',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  addCostButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  marginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  marginInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 10
  },
  calculateButton: {
    backgroundColor: 'deepskyblue',
    padding: 10,
    borderRadius: 8
  },
  calculateButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: 'deepskyblue'
  }
})

export default CostingModel
