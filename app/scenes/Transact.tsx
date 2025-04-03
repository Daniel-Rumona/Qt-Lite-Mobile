import React, { useState, useContext, useEffect } from 'react'
import { Flex, Button, Text, Pressable } from '@react-native-material/core'
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  View,
  ScrollView
} from 'react-native'
import { db, auth } from '@/FirebaseConfig'
import {
  updateDoc,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore'
import { MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext' // Importing Theme Context
import { colors } from '@/config/theme'
import { categoryEmojies } from '@/constants/Emojies'
import FormAppBar from '@/components/FormAppBar'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

export default function Transact () {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Apply theme-based colors
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [currency, setCurrency] = useState('R') // Default to ZAR
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [customerModalVisible, setCustomerModalVisible] = useState(false)
  const [transactionModalVisible, setTransactionModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [productPage, setProductPage] = useState(1)
  const [customerPage, setCustomerPage] = useState(1)
  const [productList, setProductList] = useState([])
  const [editingProductIndex, setEditingProductIndex] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedProductID, setSelectedProductID] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [change, setChange] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('')
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [currentPage, setCurrentPage] = useState(1)

  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const userDocRef = doc(db, 'Users', user.uid)
        const userSnapshot = await getDoc(userDocRef)

        if (userSnapshot.exists()) {
          const data = userSnapshot.data()
          if (data.currency) setCurrency(data.currency)
        }
      } catch (err) {
        console.error('Failed to fetch user details:', err)
      }
    }

    const fetchCustomers = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

        const customerRef = collection(db, `Users/${user.uid}/customers`)
        const snapshot = await getDocs(customerRef)
        const customers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setFilteredCustomers(customers)
      } catch (error) {
        console.error('Error fetching customers from Firestore:', error)
      }
    }

    const fetchProvisions = async () => {
      try {
        const user = auth.currentUser
        if (!user) return

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

        setFilteredProducts([...products, ...services])
      } catch (error) {
        console.error('Error fetching provisions:', error)
      }
    }

    fetchUserDetails()
    fetchCustomers()
    fetchProvisions()
  }, [])

  const itemsPerPage = 2

  // Pagination for products
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  )

  // Pagination for customers
  const totalCustomerPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (customerPage - 1) * itemsPerPage,
    customerPage * itemsPerPage
  )
  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.email) {
      setCustomerModalVisible(false)
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields for the customer!',
        hideMessageModal
      )
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        alert('User not authenticated.')
        return
      }

      const customerRef = collection(db, `Users/${user.uid}/customers`)
      const docRef = await addDoc(customerRef, newCustomer)

      setFilteredCustomers(prev => [...prev, { id: docRef.id, ...newCustomer }])
      setIsAddingCustomer(false)
      setCustomerModalVisible(false)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        'Customer successfully added!',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }

  const handleNextPage = () => {
    if (currentPage < Math.ceil(productList.length / itemsPerPage)) {
      setCurrentPage(prev => prev + 1)
    }
  }
  const handleDelete = id => {
    setProductList(prevItems => prevItems.filter(item => item.id !== id))
    setEditModalVisible(false)
    // Alert.alert('Deleted', 'The item has been deleted.')
  }

  const handleEdit = () => {
    const updatedItems = productList.map(item =>
      item.id === selectedItem.id ? selectedItem : item
    )
    setProductList(updatedItems)
    setEditModalVisible(false)
    // Alert.alert('Updated', 'The item details have been updated.')
  }
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }
  // Search Products in Firestore
  const handleSearchProducts = async queryText => {
    setSearchQuery(queryText)

    if (!queryText.trim()) {
      fetchProvisions() // Reload all products if search is cleared
      return
    }

    try {
      const productsRef = collection(db, 'products')
      const q = query(
        productsRef,
        where('name', '>=', queryText),
        where('name', '<=', queryText + '\uf8ff')
      )
      const querySnapshot = await getDocs(q)

      const filteredProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setFilteredProducts(filteredProducts)
      setProductPage(1)
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  // Search Customers in Firestore
  const handleSearchCustomers = async queryText => {
    setSearchQuery(queryText)

    if (!queryText.trim()) {
      fetchCustomers() // Reload all customers if search is cleared
      return
    }

    try {
      const customersRef = collection(db, 'customers')
      const q = query(
        customersRef,
        where('name', '>=', queryText),
        where('name', '<=', queryText + '\uf8ff')
      )
      const querySnapshot = await getDocs(q)

      const filteredCustomers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setFilteredCustomers(filteredCustomers)
      setCustomerPage(1)
    } catch (error) {
      console.error('Error searching customers:', error)
    }
  }

  const handleSelectProduct = product => {
    setSelectedProductID(product.productID)
    setSelectedProduct(product.name)
    setSelectedCategory(product.category)
    setSelectedPrice(product.price.toString())
    setAmountDue((product.price * (quantity || 1)).toFixed(2))
    setProductModalVisible(false)
    // Clear product-related error
    setErrors(prevErrors => ({ ...prevErrors, product: null }))
  }

  const handleSelectCustomer = customer => {
    setSelectedCustomer(customer.name)
    setSelectedCustomerPhone(customer.phone)
    setCustomerModalVisible(false)
  }
  const addProductToList = () => {
    const validationErrors = {}
    if (!selectedProduct) validationErrors.product = 'Select a product/service.'
    if (!quantity || isNaN(quantity) || quantity <= 0)
      validationErrors.quantity = 'Enter a valid quantity.'
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const newProduct = {
      productID: selectedProductID,
      name: selectedProduct,
      category: selectedCategory,
      price: parseFloat(selectedPrice),
      quantity: parseInt(quantity),
      amountDue: parseFloat(selectedPrice) * parseInt(quantity)
    }

    if (editingProductIndex !== null) {
      const updatedList = [...productList]
      updatedList[editingProductIndex] = newProduct
      setProductList(updatedList)
      setEditingProductIndex(null)
    } else {
      setProductList([...productList, newProduct])
    }

    resetProductFields()
  }
  const resetAllFields = () => {
    setSelectedCustomer('')
    setSelectedCustomerPhone('')
    setProductList([])
    setPaidAmount('')
    setChange('')
    resetProductFields()
    setErrors({})
  }
  const resetProductFields = () => {
    setSelectedProduct('')
    setSelectedCategory('')
    setSelectedPrice('')
    setQuantity('')
    setErrors({})
  }

  const handlePaidAmountChange = amount => {
    setPaidAmount(amount)
    const changeAmount = parseFloat(amount) - parseFloat(amountDue || 0)
    setChange(changeAmount > 0 ? changeAmount.toFixed(2) : '0.00')
  }

  // Pagination logic
  const paginatedItems = productList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddProduct = async product => {
    try {
      const docRef = await addDoc(collection(db, 'products'), product)
      setFilteredProducts(prev => [...prev, { id: docRef.id, ...product }])
      setProductModalVisible(false)
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleMakeTransaction = async () => {
    if (!selectedCustomer || productList.length === 0 || !paidAmount) {
      alert('Please complete all transaction details.')
      return
    }

    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated.')

      // 🔹 Save transaction
      const transactionsRef = collection(db, `Users/${userId}/transactions`)
      const querySnapshot = await getDocs(transactionsRef)
      let nextTransactionID = 'TR0001'

      if (!querySnapshot.empty) {
        const transactions = querySnapshot.docs.map(doc => doc.data())
        const lastTransaction = transactions
          .sort((a, b) => a.id.localeCompare(b.id))
          .pop()
        if (lastTransaction && lastTransaction.id.startsWith('TR')) {
          const lastNumber = parseInt(lastTransaction.id.substring(2), 10)
          nextTransactionID = `TR${(lastNumber + 1)
            .toString()
            .padStart(4, '0')}`
        }
      }

      const newTransaction = {
        transactionID: nextTransactionID,
        customer: selectedCustomer,
        customerPhone: selectedCustomerPhone,
        products: productList,
        amountDue: parseFloat(amountDue),
        amountPaid: parseFloat(paidAmount),
        change: parseFloat(change),
        transactionType: 'Income',
        date: new Date().toISOString()
      }
      await addDoc(transactionsRef, newTransaction)

      // 🔹 Deduct from inventory
      for (const item of productList) {
        if (item.productID) {
          const inventoryRef = doc(
            db,
            `Users/${userId}/inventory`,
            item.productID
          )
          const inventorySnap = await getDoc(inventoryRef)

          if (inventorySnap.exists()) {
            const currentQty = inventorySnap.data().productQuantity || 0
            const updatedQty = Math.max(0, currentQty - item.quantity)

            await updateDoc(inventoryRef, {
              productQuantity: updatedQty
            })
          }
        }
      }

      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        'Transaction completed and inventory updated!',
        hideMessageModal
      )

      resetAllFields()
      setTransactionModalVisible(false)
    } catch (error) {
      console.error('Error completing transaction:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to complete transaction.',
        hideMessageModal
      )
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: activeColors.primary[300] }]}
    >
      <FormAppBar title={'Transaction'} />

      <Flex style={{ gap: 10, padding: 10 }}>
        {/* Product Section */}
        <Flex direction='column' style={{ marginBottom: 15 }}>
          <Text style={styles.inputLabel}>Product/Service Details</Text>
          <Pressable
            style={styles.selectBox}
            onPress={() => setProductModalVisible(true)}
          >
            {selectedProduct ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectMainText}>{selectedProduct}</Text>
                <Text style={styles.selectSubText}>
                  {currency} {selectedPrice}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectPlaceholder}>
                Select a product/service
              </Text>
            )}
            <MaterialIcons name='arrow-forward-ios' size={18} color='#888' />
          </Pressable>
        </Flex>
        {errors.product && (
          <Text style={styles.errorText}>{errors.product}</Text>
        )}
        {/* Customer Section */}
        <Flex direction='column' style={{ marginBottom: 15 }}>
          <Text style={styles.inputLabel}>Customer Details</Text>
          <Pressable
            style={styles.selectBox}
            onPress={() => setCustomerModalVisible(true)}
          >
            {selectedCustomer ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectMainText}>{selectedCustomer}</Text>
                <Text style={styles.selectSubText}>
                  {selectedCustomerPhone}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectPlaceholder}>Select a customer</Text>
            )}
            <MaterialIcons name='arrow-forward-ios' size={18} color='#888' />
          </Pressable>
        </Flex>
        {errors.customer && (
          <Text style={styles.errorText}>{errors.customer}</Text>
        )}
        <Flex direction='row' style={{ gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Price | {currency}</Text>
            <TextInput
              placeholder='Price'
              value={selectedPrice}
              editable={false}
              style={styles.modalInput}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              placeholder='Quantity'
              value={quantity}
              keyboardType='numeric'
              onChangeText={value => {
                setQuantity(value)
                setAmountDue(
                  (
                    parseFloat(selectedPrice || 0) * parseFloat(value || 1)
                  ).toFixed(2)
                )
                setErrors(prevErrors => ({ ...prevErrors, quantity: null }))
              }}
              style={styles.modalInput}
            />
          </View>
        </Flex>
        {errors.quantity && (
          <Text style={styles.errorText}>{errors.quantity}</Text>
        )}
        <Button
          style={{ marginVertical: 5, backgroundColor: 'deepskyblue' }}
          title='Add Product/Service'
          onPress={addProductToList}
        />
        {/* Provision List */}
        {productList.length > 0 && (
          <ScrollView contentContainerStyle={styles.listContainer}>
            {paginatedItems.map(item => (
              <Pressable
                key={item.id}
                style={styles.listItem}
                onPress={() => {
                  setSelectedItem({ ...item })
                  setEditModalVisible(true)
                }}
              >
                <Text style={{ fontSize: 32 }}>
                  {`${categoryEmojies[item.category] ?? ''}`}
                </Text>
                <View style={styles.listItemContent}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={styles.listItemName}>
                      Product/Service Name: {item.name}
                    </Text>
                    <Text> | </Text>
                    <Text style={styles.listItemLocation}>
                      Category: {item.category}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <Text style={styles.listItemName}>
                      Amount Due: {`${currency}`} {`${item.amountDue}`}
                    </Text>
                    <Text> | </Text>
                    <Text style={styles.listItemLocation}>
                      Quantity: {`${item.quantity}`}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {/* Pagination */}
        {productList.length > 0 && (
          <Flex
            direction='row'
            justify='center'
            style={styles.paginationContainer}
          >
            <TouchableOpacity
              onPress={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <MaterialIcons
                name='arrow-circle-left'
                size={24}
                color={currentPage === 1 ? '#000' : '#ccc'}
              />
            </TouchableOpacity>
            <Text
              style={[styles.paginationText, { color: activeColors.grey[900] }]}
            >
              {currentPage} of {Math.ceil(productList.length / itemsPerPage)}
            </Text>
            <TouchableOpacity
              onPress={handleNextPage}
              disabled={
                currentPage === Math.ceil(productList.length / itemsPerPage)
              }
            >
              <MaterialIcons
                name='arrow-circle-right'
                size={24}
                color={
                  currentPage === Math.ceil(productList.length / itemsPerPage)
                    ? '#000'
                    : '#ccc'
                }
              />
            </TouchableOpacity>
          </Flex>
        )}
        <Button
          title='Checkout '
          onPress={() => setTransactionModalVisible(true)}
          style={{ bottom: 0, backgroundColor: 'deepskyblue' }}
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
                Select Product/Service
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setProductModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>
            <TextInput
              placeholder='Search Product/Service'
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
                    <Text style={styles.provisionName}>{product.name}</Text>
                    <Text style={styles.productDetails}>
                      Category: {product.category} | Price: {currency}
                      {product.price}
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

      {/* Customer Modal */}
      <Modal visible={customerModalVisible} transparent animationType='slide'>
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
                {isAddingCustomer ? 'Add Customer' : 'Select Customer'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setCustomerModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>
            {isAddingCustomer ? (
              <ScrollView>
                <Text style={styles.inputLabel}>Customer Name</Text>
                <TextInput
                  placeholder='Enter Customer Name'
                  value={newCustomer.name}
                  onChangeText={text =>
                    setNewCustomer(prev => ({ ...prev, name: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  placeholder='Enter Email'
                  value={newCustomer.email}
                  onChangeText={text =>
                    setNewCustomer(prev => ({ ...prev, email: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  placeholder='Enter Phone'
                  value={newCustomer.phone}
                  onChangeText={text =>
                    setNewCustomer(prev => ({ ...prev, phone: text }))
                  }
                  style={styles.modalInput}
                />
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  placeholder='Enter Address'
                  value={newCustomer.address}
                  onChangeText={text =>
                    setNewCustomer(prev => ({ ...prev, address: text }))
                  }
                  style={styles.modalInput}
                />
                <Button title='Add Customer' onPress={handleAddCustomer} />
              </ScrollView>
            ) : (
              <>
                <TextInput
                  placeholder='Search Customer'
                  value={searchQuery}
                  onChangeText={handleSearchCustomers}
                  style={styles.modalInput}
                />
                <ScrollView>
                  <Flex direction='column' style={{ gap: 10 }}>
                    {paginatedCustomers.map(customer => (
                      <Pressable
                        key={customer.id}
                        style={styles.productItem}
                        onPress={() => handleSelectCustomer(customer)}
                      >
                        <Text style={styles.provisionName}>
                          {customer.name}
                        </Text>
                        <Text style={styles.productDetails}>
                          Email: {customer.email} | Phone: {customer.phone}
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
                      customerPage > 1 && setCustomerPage(customerPage - 1)
                    }
                  >
                    <MaterialIcons
                      name='arrow-circle-left'
                      size={28}
                      color={customerPage === 1 ? '#333' : '#ddd'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.paginationText}>
                    {customerPage} of {totalCustomerPages}
                  </Text>
                  <TouchableOpacity
                    style={styles.paginationButton}
                    onPress={() =>
                      customerPage < totalCustomerPages &&
                      setCustomerPage(customerPage + 1)
                    }
                  >
                    <MaterialIcons
                      name='arrow-circle-right'
                      size={28}
                      color={
                        customerPage === totalCustomerPages ? '#333' : '#ddd'
                      }
                    />
                  </TouchableOpacity>
                </Flex>
                <Button
                  title='Add New Customer'
                  style={{ marginTop: 5 }}
                  onPress={() => setIsAddingCustomer(true)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {selectedItem && (
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType='slide'
          onRequestClose={() => setEditModalVisible(false)}
        >
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
                  Edit Product
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { alignSelf: 'center' }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <MaterialIcons name='close' size={24} color='red' />
                </TouchableOpacity>
              </Flex>
              <Text style={styles.inputLabel}>Product Name</Text>
              <TextInput
                placeholder='Name'
                value={selectedItem.name}
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, name: text }))
                }
                style={styles.modalInput}
              />
              <Text style={styles.inputLabel}>Product Quantity</Text>
              <TextInput
                placeholder='Quantity'
                value={selectedItem.quantity}
                keyboardType='numeric'
                onChangeText={text =>
                  setSelectedItem(prev => ({ ...prev, quantity: text }))
                }
                style={styles.modalInput}
              />

              <Flex
                direction='row'
                justify='between'
                style={styles.modalButtons}
              >
                <Button
                  title='Delete'
                  onPress={() => handleDelete(selectedItem.id)}
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
      {productList.length > 0 && (
        <Modal
          visible={transactionModalVisible}
          transparent
          animationType='slide'
        >
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
                  Confirm Payment
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { alignSelf: 'center' }]}
                  onPress={() => setTransactionModalVisible(false)}
                >
                  <MaterialIcons name='close' size={24} color='red' />
                </TouchableOpacity>
              </Flex>
              <Text
                style={{
                  color: 'grey',
                  fontSize: 18,
                  fontWeight: 'medium',
                  margin: 5,
                  textAlign: 'center',
                  marginBottom: 10 // 👈 this helps separation
                }}
              >
                Amount Due: {currency} {amountDue}
              </Text>
              <View style={{ marginVertical: 5 }}>
                <Text style={styles.inputLabel}>Paid Amount | {currency} </Text>
                <TextInput
                  placeholder='Paid Amount'
                  value={paidAmount}
                  onChangeText={handlePaidAmountChange}
                  style={styles.modalInput}
                />
                {errors.paidAmount && (
                  <Text style={styles.errorText}>{errors.paidAmount}</Text>
                )}
              </View>
              <View style={{ marginVertical: 5 }}>
                <Text style={styles.inputLabel}>Change | {currency}</Text>
                <TextInput
                  placeholder='Change Due'
                  value={change}
                  editable={false}
                  style={styles.modalInput}
                />
              </View>
              <Button title='Transact' onPress={handleMakeTransaction}></Button>
            </View>
          </View>
        </Modal>
      )}
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
    width: '90%',
    minHeight: 250, // 👈 Add this to give it breathing room
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
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
  modalButtons: {
    marginTop: 10
  },
  deleteButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: 'red'
  },
  addButton: {
    flex: 1,
    marginLeft: 5
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
  productDetails: {
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
  },
  listContainer: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 5,
    height: 320,
    marginVertical: 5
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
    flex: 1
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  listItemLocation: {
    fontSize: 14,
    color: '#666'
  },
  listItemCategory: {
    fontSize: 12,
    color: '#888'
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  }
})
