import React, { useContext, useEffect, useState } from 'react'
import { Flex, Button, Text, Pressable } from '@react-native-material/core'
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  View,
  ScrollView
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext' // Importing Theme Context
import { productsData, suppliersData } from '@/data/mockData'
import { colors } from '@/config/theme'
import { db, auth } from '@/FirebaseConfig'
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore'
import FormAppBar from '@/components/FormAppBar'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

export default function Purchase () {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [currency, setCurrency] = useState('R') // Default to ZAR
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [supplierModalVisible, setSupplierModalVisible] = useState(false)
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [productPage, setProductPage] = useState(1)
  const [supplierPage, setSupplierPage] = useState(1)

  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [provisionID, setProvisionID] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [expectedProfit, setExpectedProfit] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedSupplierPhone, setSelectedSupplierPhone] = useState('')
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const [errors, setErrors] = useState({})

  const itemsPerPage = 4

  // Pagination for products
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  )

  // Pagination for suppliers
  const totalSupplierPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / itemsPerPage)
  )
  const paginatedSuppliers = filteredSuppliers.slice(
    (supplierPage - 1) * itemsPerPage,
    supplierPage * itemsPerPage
  )
  // Fetch Currency from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (userId) {
          const userDocRef = doc(db, 'Users', userId)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setCurrency(userData.currency || '$')
          }
        } else {
        }
      } catch (error) {}
    }

    fetchUserData()
  }, [])
  // UseEffect for dynamic calculation
  useEffect(() => {
    const calculateProfit = () => {
      const quantityValue = parseFloat(quantity) || 0
      const purchaseValue = parseFloat(purchasePrice) || 0
      const sellingValue = parseFloat(sellingPrice) || 0

      // Total Profit
      const totalProfit = (sellingValue - purchaseValue) * quantityValue

      // Total Cost
      const totalCost = purchaseValue * quantityValue

      // Calculate Profit Percentage (avoid division by zero)
      const percentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

      // Update State
      if (purchasePrice) {
        setExpectedProfit(totalProfit.toFixed(2))
      }
    }

    calculateProfit()
  }, [quantity, purchasePrice, sellingPrice])

  // 🔥 Fetch Products from `provisions`
  useEffect(() => {
    const fetchProvisions = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        const provisionsRef = collection(db, `Users/${userId}/provisions`)
        const querySnapshot = await getDocs(provisionsRef)
        const provisionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setFilteredProducts(
          provisionsList.filter(item => item.type === 'Product')
        )
      } catch (error) {
        console.error('Error fetching provisions:', error)
      }
    }

    fetchProvisions()
  }, [])

  // 🔥 Fetch Suppliers from `suppliers`
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        const suppliersRef = collection(db, `Users/${userId}/suppliers`)
        const querySnapshot = await getDocs(suppliersRef)
        const suppliersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setFilteredSuppliers(suppliersList)
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      }
    }

    fetchSuppliers()
  }, [])

  // 📌 Select Product
  const handleSelectProduct = product => {
    setSelectedProduct(product.provisionName)
    setSelectedCategory(product.provisionCategory)
    setSellingPrice(product.unitPrice.toString())
    setProductModalVisible(false)
    setErrors(prevErrors => ({ ...prevErrors, product: null }))

    // ✅ Store provisionID for saving later
    setProvisionID(product.provisionID)
  }

  // 📌 Select Supplier
  const handleSelectSupplier = supplier => {
    setSelectedSupplier(supplier.name)
    setSelectedSupplierPhone(supplier.phone)
    setSupplierModalVisible(false)
    setErrors(prevErrors => ({ ...prevErrors, supplier: null }))
  }

  // 🔥 Save Purchase to `transactions`
  const handleMakePurchase = async () => {
    const validationErrors = {}
    if (!selectedProduct) validationErrors.product = 'Please select a product.'
    if (!selectedSupplier)
      validationErrors.supplier = 'Please select a supplier.'
    if (!quantity || isNaN(quantity) || quantity <= 0)
      validationErrors.quantity = 'Enter a valid quantity.'
    if (!purchasePrice || isNaN(purchasePrice) || purchasePrice <= 0)
      validationErrors.purchasePrice = 'Enter a valid purchase price.'
    if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0)
      validationErrors.sellingPrice = 'Enter a valid selling price.'
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const transactionsRef = collection(db, `Users/${userId}/transactions`)
      const querySnapshot = await getDocs(transactionsRef)
      let nextTransactionID = 'TR0001'

      if (!querySnapshot.empty) {
        const transactions = querySnapshot.docs.map(doc => doc.data())
        const lastTransaction = transactions
          .filter(t => t.transactionID?.startsWith('TR'))
          .sort((a, b) => a.transactionID.localeCompare(b.transactionID))
          .pop()

        if (lastTransaction?.transactionID) {
          const lastNumber = parseInt(
            lastTransaction.transactionID.substring(2),
            10
          )
          nextTransactionID = `TR${(lastNumber + 1)
            .toString()
            .padStart(4, '0')}`
        }
      }

      const totalAmountDue = parseFloat(purchasePrice) * parseInt(quantity)
      const amountPaid = totalAmountDue
      const change = 0

      const newTransaction = {
        transactionID: nextTransactionID,
        product: selectedProduct,
        quantity: parseInt(quantity),
        price: parseFloat(purchasePrice),
        amountDue: totalAmountDue,
        amountPaid: amountPaid,
        change: change,
        transactionType: 'expense',
        category: selectedCategory,
        supplierDetails: {
          name: selectedSupplier,
          phone: selectedSupplierPhone,
          address: 'N/A',
          location: 'N/A',
          email: 'N/A'
        },
        date: new Date().toISOString()
      }

      await addDoc(transactionsRef, newTransaction)

      const productDetails = {
        provisionID,
        provisionName: selectedProduct,
        provisionCategory: selectedCategory,
        unitPrice: parseFloat(sellingPrice),
        quantity: parseInt(quantity),
        quantityThreshold: 10,
        supplierID: selectedSupplier
      }

      await saveProductToInventory(productDetails)
      await saveProduct(productDetails)

      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        `Purchase recorded successfully!`,
        hideMessageModal
      )

      setSelectedProduct('')
      setSelectedCategory('')
      setQuantity('')
      setPurchasePrice('')
      setSellingPrice('')
      setExpectedProfit('')
      setSelectedSupplier('')
      setSelectedSupplierPhone('')
    } catch (error) {
      console.error('Error saving purchase:', error)
    }
  }

  // Function to save product details to inventory collection
  const saveProductToInventory = async product => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.error('User not authenticated.')
        return
      }

      const productsRef = collection(db, `Users/${userId}/inventory`)

      // Check if the product already exists
      const newProduct = {
        provisionID: product.provisionID, // ✅ Save provisionID
        productName: product.provisionName,
        category: product.provisionCategory,
        unitPrice: product.unitPrice,
        productQuantity: product.quantity,
        supplierID: product.supplierID,
        dateAdded: new Date().toISOString()
      }

      await addDoc(productsRef, newProduct)
      console.log('Inventory successfully updated.')
    } catch (error) {
      console.error('Error saving product to inventory:', error)
    }
  }
  const saveProduct = async product => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) {
        console.error('User not authenticated.')
        return
      }

      const productsRef = collection(db, `Users/${userId}/products`)

      // Check if the product already exists
      const newProduct = {
        productID: product.provisionID, // ✅ Save provisionID
        productName: product.provisionName,
        category: product.provisionCategory,
        unitPrice: product.unitPrice,
        productQuantity: product.quantity,
        productThreshold: product.quantityThreshold,
        supplierID: product.supplierID,
        dateAdded: new Date().toISOString()
      }

      await addDoc(productsRef, newProduct)
      console.log('Product successfully added.')
    } catch (error) {
      console.error('Error saving product: ', error)
    }
  }

  const handleSearchProducts = query => {
    setSearchQuery(query)
    const filtered = productsData.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredProducts(filtered)
    setProductPage(1)
  }

  const handleSearchSuppliers = query => {
    setSearchQuery(query)
    const filtered = suppliersData.filter(supplier =>
      supplier.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredSuppliers(filtered)
    setSupplierPage(1)
  }

  const handleExpectedProfit = () => {
    const profit =
      (parseFloat(sellingPrice || 0) - parseFloat(purchasePrice || 0)) *
      parseFloat(quantity || 0)
    setExpectedProfit(profit.toFixed(2))
  }

  // 🔥 Save New Supplier to Firestore
  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.phone || !newSupplier.email) {
      setSupplierModalVisible(false)
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields for the supplier!',
        hideMessageModal
      )
      return
    }

    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const suppliersRef = collection(db, `Users/${userId}/suppliers`)
      const newSupplierData = {
        name: newSupplier.name,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
        dateAdded: new Date().toISOString()
      }

      await addDoc(suppliersRef, newSupplierData)

      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        'Supplier added successfully!',
        hideMessageModal
      )

      // ✅ Fetch updated supplier list immediately
      const querySnapshot = await getDocs(suppliersRef)
      const suppliersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setFilteredSuppliers(suppliersList) // ✅ Update the state

      // Reset Fields
      setNewSupplier({ name: '', email: '', phone: '', address: '' })
      setIsAddingSupplier(false)
      setSupplierModalVisible(false)
    } catch (error) {
      console.error('Error adding supplier:', error)
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: activeColors.primary[300] }]}
    >
      <FormAppBar title={'Product Purchase'} />

      <Flex style={{ gap: 10, padding: 10 }}>
        {/* Product Section */}
        <Flex direction='column' style={{ marginBottom: 15 }}>
          <Text style={styles.inputLabel}>Product Details</Text>
          <Pressable
            style={styles.selectBox}
            onPress={() => setProductModalVisible(true)}
          >
            {selectedProduct ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectMainText}>{selectedProduct}</Text>
                <Text style={styles.selectSubText}>
                  {currency} {sellingPrice}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectPlaceholder}>Select a product/service</Text>
            )}
            <MaterialIcons name='arrow-forward-ios' size={18} color='#888' />
          </Pressable>
          {errors.product && (
            <Text style={styles.errorText}>{errors.product}</Text>
          )}
        </Flex>
        {/* Supplier Section */}
        <Flex direction='column' style={{ marginBottom: 15 }}>
          <Text style={styles.inputLabel}>Supplier</Text>
          <Pressable
            style={styles.selectBox}
            onPress={() => setSupplierModalVisible(true)}
          >
            {selectedSupplier ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectMainText}>{selectedSupplier}</Text>
                <Text style={styles.selectSubText}>
                  {selectedSupplierPhone}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectPlaceholder}>Select a supplier</Text>
            )}
            <MaterialIcons name='arrow-forward-ios' size={18} color='#888' />
          </Pressable>
          {errors.supplier && (
            <Text style={styles.errorText}>{errors.supplier}</Text>
          )}
        </Flex>
        <Flex direction='row' style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Selling Price | {currency}</Text>
            <TextInput
              placeholder='Selling Price'
              value={sellingPrice} // Dynamically updates with the selected product's price
              editable={false}
              style={styles.modalInput}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Purchase Price | {currency}</Text>
            <TextInput
              placeholder='Purchase Price'
              value={purchasePrice}
              onChangeText={value => {
                setPurchasePrice(value)
              }}
              style={styles.modalInput}
            />
          </View>
        </Flex>

        <Flex direction='row' style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              placeholder='Quantity'
              value={quantity}
              onChangeText={value => {
                setQuantity(value)
                handleExpectedProfit()
                setErrors(prevErrors => ({ ...prevErrors, quantity: null }))
              }}
              style={styles.modalInput}
            />
            {errors.quantity && (
              <Text style={styles.errorText}>{errors.quantity}</Text>
            )}
          </View>
        </Flex>

        <Text style={styles.inputLabel}>Expected Profit</Text>
        <TextInput
          placeholder='Expected Profit'
          value={`${currency} ${expectedProfit}`}
          editable={false}
          style={[
            styles.modalInput,
            { textAlign: 'center', fontWeight: 'bold' }
          ]}
        />

        <Button
          title='Make Purchase'
          onPress={handleMakePurchase}
          style={{ backgroundColor: 'deepskyblue' }}
        />
      </Flex>
      <MessageModal {...messageModalState} />
      {/* Product Modal */}
      <Modal visible={productModalVisible} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? activeColors.primary[500]
                    : activeColors.primary[100]
              }
            ]}
          >
            <Flex
              direction='row'
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
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
                Select Product
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setProductModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>

            <TextInput
              placeholder='Search Product'
              value={searchQuery}
              onChangeText={handleSearchProducts}
              style={styles.modalInput}
            />
            <ScrollView>
              <Flex direction='column' style={{ gap: 10 }}>
                {paginatedProducts.map(product => (
                  <Pressable
                    key={product.id}
                    style={styles.productItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <Text style={styles.provisionName}>
                      {product.provisionName}
                    </Text>
                    <Text style={[styles.provisionDetails]}>
                      Category:
                      {product.provisionCategory ?? 'N/A'} | Price:{currency}
                      {product.unitPrice ?? 0}
                    </Text>
                  </Pressable>
                ))}
              </Flex>
            </ScrollView>
            <Flex
              direction='row'
              justify='center'
              style={{ gap: 20, marginTop: 15 }}
            >
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={() =>
                  productPage > 1 && setProductPage(productPage - 1)
                }
              >
                <MaterialIcons
                  name='arrow-circle-left'
                  size={28}
                  color={productPage === 1 ? '#333' : '#ddd'}
                />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                {productPage} of {totalProductPages}
              </Text>
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={() =>
                  productPage < totalProductPages &&
                  setProductPage(productPage + 1)
                }
              >
                <MaterialIcons
                  name='arrow-circle-right'
                  size={28}
                  color={productPage === totalProductPages ? '#333' : '#ddd'}
                />
              </TouchableOpacity>
            </Flex>
          </View>
        </View>
      </Modal>

      {/* Supplier Modal */}
      <Modal visible={supplierModalVisible} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? activeColors.primary[500]
                    : activeColors.primary[100]
              }
            ]}
          >
            <Flex>
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
                {isAddingSupplier ? 'Add Supplier' : 'Select Supplier'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setSupplierModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>

            {isAddingSupplier ? (
              <ScrollView>
                <Text style={styles.inputLabel}>Supplier Name</Text>
                <TextInput
                  placeholder='Enter Supplier Name'
                  value={newSupplier.name}
                  onChangeText={text =>
                    setNewSupplier(prev => ({ ...prev, name: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  placeholder='Enter Email'
                  value={newSupplier.email}
                  onChangeText={text =>
                    setNewSupplier(prev => ({ ...prev, email: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  placeholder='Enter Phone'
                  value={newSupplier.phone}
                  onChangeText={text =>
                    setNewSupplier(prev => ({ ...prev, phone: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  placeholder='Enter Address'
                  value={newSupplier.address}
                  onChangeText={text =>
                    setNewSupplier(prev => ({ ...prev, address: text }))
                  }
                  style={styles.modalInput}
                />
                <Button title='Add Supplier' onPress={handleAddSupplier} />
              </ScrollView>
            ) : (
              <>
                <TextInput
                  placeholder='Search Supplier'
                  value={searchQuery}
                  onChangeText={handleSearchSuppliers}
                  style={styles.modalInput}
                />
                <ScrollView>
                  <Flex direction='column' style={{ gap: 10 }}>
                    {paginatedSuppliers.map(supplier => (
                      <Pressable
                        key={supplier.id}
                        style={styles.productItem}
                        onPress={() => handleSelectSupplier(supplier)}
                      >
                        <Text style={styles.provisionName}>
                          {supplier.name}
                        </Text>
                        <Text style={styles.provisionDetails}>
                          Email: {supplier.email} | Phone: {supplier.phone}
                        </Text>
                      </Pressable>
                    ))}
                  </Flex>
                </ScrollView>
                <Flex
                  direction='row'
                  justify='center'
                  style={{ gap: 20, marginTop: 15 }}
                >
                  <TouchableOpacity
                    style={styles.paginationButton}
                    onPress={() =>
                      supplierPage > 1 && setSupplierPage(supplierPage - 1)
                    }
                  >
                    <MaterialIcons
                      name='arrow-circle-left'
                      size={28}
                      color={productPage === 1 ? '#333' : '#ddd'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>
                    {supplierPage} of {totalSupplierPages}
                  </Text>
                  <TouchableOpacity
                    style={styles.paginationButton}
                    onPress={() =>
                      supplierPage < totalSupplierPages &&
                      setSupplierPage(supplierPage + 1)
                    }
                  >
                    <MaterialIcons
                      name='arrow-circle-right'
                      size={28}
                      color={
                        supplierPage === totalSupplierPages ? '#333' : '#ddd'
                      }
                    />
                  </TouchableOpacity>
                </Flex>
                <Button
                  title='Add New Supplier'
                  style={{ marginTop: 5 }}
                  onPress={() => setIsAddingSupplier(true)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  containerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff'
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 5
  },
  selectMainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  selectSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#aaa',
    flex: 1
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 8,
    fontSize: 16,
    color: '#333'
  },
  closeButton: {
    position: 'absolute',
    top: -1,
    right: 10,
    zIndex: 10
  },
  productItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  provisionName: {
    fontSize: 16,
    color: '#fff'
  },
  provisionDetails: {
    fontSize: 12,
    color: '#666'
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginTop: -8,
    marginBottom: 8
  },
  paginationButton: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  paginationText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333'
  }
})
