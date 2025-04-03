import React, { useState, useContext, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  View
} from 'react-native'
import { Flex, Button, Pressable } from '@react-native-material/core'
import { MaterialIcons } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { db, auth } from '@/FirebaseConfig'
import { collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore'
import { Checkbox } from 'react-native-paper'
import FormHeader from '@/components/FormAppBar'
import InvoicesTable from '@/components/InvoicesTable'
import { saveInvoice } from '@/utils/firebase/invoiceService'
import { InvoiceDetails } from '@/types/invoice'
import DateTimePicker from '@react-native-community/datetimepicker'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

export default function InvoiceForm () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [view, setView] = useState('List')

  const [customerModalVisible, setCustomerModalVisible] = useState(false)
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [currency, setCurrency] = useState('R')

  const [customerID, setCustomerID] = useState('')
  const [provisionID, setProvisionID] = useState('')
  const [transactionID, setTransactionID] = useState('')
  const [invoiceID, setInvoiceID] = useState('')
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('')
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [discount, setDiscount] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [paymentMethod, setpaymentMethod] = useState('Cash')
  const [paymentConfirmed, setpaymentConfirmed] = useState('Paid')
  const [productList, setProductList] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState('INV0001')
  const [issueDate, setIssueDate] = useState(new Date())
  const [dueDate, setDueDate] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showDuePicker, setShowDuePicker] = useState(false)

  const [selectedItem, setSelectedItem] = useState(null)

  const [customerPage, setCustomerPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('')
  const [searchProductQuery, setSearchProductQuery] = useState('')

  const itemsPerPage = 4
  // Fetch user data from Firebase
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

        // Fetch customers
        const customerSnapshot = await getDocs(
          collection(db, `Users/${userId}/customers`)
        )
        const fetchedCustomers = []
        customerSnapshot.forEach(doc => {
          fetchedCustomers.push({ id: doc.id, ...doc.data() })
        })
        setCustomers(fetchedCustomers)

        // Fetch products
        const productSnapshot = await getDocs(
          collection(db, `Users/${userId}/products`)
        )
        const fetchedProducts = []
        productSnapshot.forEach(doc => {
          fetchedProducts.push({ id: doc.id, ...doc.data() })
        })
        setProducts(fetchedProducts)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Pagination for customers
  const filteredCustomers = customers.filter(customer =>
    (customer.name || customer.customerName || '')
      .toLowerCase()
      .includes(searchCustomerQuery.toLowerCase())
  )

  // Pagination for customers
  const totalCustomerPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (customerPage - 1) * itemsPerPage,
    customerPage * itemsPerPage
  )

  // Pagination for products
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchProductQuery.toLowerCase())
  )
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  )
  const generateInvoiceNumber = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const invoicesRef = collection(db, `Users/${userId}/invoices`)
      const snapshot = await getDocs(invoicesRef)

      if (snapshot.empty) {
        setInvoiceNumber('INV0001')
        return
      }

      const existingIDs = snapshot.docs
        .map(doc => doc.data().invoiceNumber)
        .filter(id => typeof id === 'string' && id.startsWith('INV'))

      const lastInvoice = existingIDs.sort().pop()
      const lastNumber = parseInt(lastInvoice.replace('INV', ''), 10) + 1

      setInvoiceNumber(`INV${String(lastNumber).padStart(4, '0')}`)
    } catch (error) {
      console.error('Error generating invoice number:', error)
    }
  }

  useEffect(() => {
    generateInvoiceNumber()
  }, [])

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

      //   setFilteredCustomers(prev => [...prev, { id: docRef.id, ...newCustomer }])
      setIsAddingCustomer(false)
      setCustomerModalVisible(false)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Success',
        'Customer added successfully!',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }
  const handleSaveInvoice = async (): Promise<void> => {
    if (!selectedCustomer || !customerID || !productList.length) {
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields!',
        hideMessageModal
      )
      return
    }

    try {
      const invoiceDetails: InvoiceDetails = {
        invoiceNumber, // ✅ Save invoice ID
        issueDate,
        dueDate,
        customer: {
          customerID: customerID,
          customerName: selectedCustomer,
          customerContact: selectedCustomerPhone,
          customerEmail: selectedCustomerEmail
        },
        products: productList.map(product => ({
          provisionID: product.provisionID, // ✅ Save provision ID
          name: product.productName,
          price: product.price,
          quantity: product.quantity,
          discount: product.discount,
          total: product.total
        })),
        status: 'Pending',
        paymentStatus: paymentConfirmed ? 'Paid' : 'Unpaid',
        paymentMethod,
        totalAmount: parseFloat(calculateTotal())
      }

      const invoiceId = await saveInvoice(invoiceDetails)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Invoice Saved',
        `Invoice saved successfully!`,
        hideMessageModal
      )

      // Reset form after saving
      resetFields()
      generateInvoiceNumber()
    } catch (error) {
      showMessageModal(
        MessageTypes.FAIL,
        'Save Failure',
        `Failed to save invoice. Please try again.`,
        hideMessageModal
      )
      console.error(error)
    }
  }

  const resetProductFields = () => {
    setSelectedProduct('')
    setSelectedPrice('')
    setQuantity('')
    setDiscount('')
    setAmountDue('')
  }
  const resetFields = () => {
    setSelectedCustomer('')
    setCustomerID('') // ✅ Reset customer ID
    setSelectedCustomerPhone('')
    setSelectedCustomerEmail('')
    setProductList([])
  }
  const calculateSubtotal = () => {
    const price = selectedPrice ? parseFloat(selectedPrice) : 0
    const qty = quantity ? parseInt(quantity) : 0
    const discountValue = discount
      ? (parseFloat(discount) / 100) * price * qty
      : 0
    return (price * qty - discountValue).toFixed(2)
  }

  const calculateTotal = () => {
    return productList
      .reduce((sum, product) => sum + product.total, 0)
      .toFixed(2)
  }

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  const handleSearchProducts = async queryText => {
    setSearchProductQuery(queryText)

    if (!queryText.trim()) {
      fetchProducts() // Reload all products if search is cleared
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
    setSearchCustomerQuery(queryText)

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

  const handleAddProduct = () => {
    if (!selectedProduct || !quantity || isNaN(quantity) || quantity <= 0) {
      alert('Please provide valid product details and quantity.')
      return
    }

    const totalPrice = parseFloat(subtotal)

    const newProduct = {
      productName: selectedProduct,
      price: parseFloat(selectedPrice),
      quantity: parseInt(quantity),
      discount: parseFloat(discount) || 0,
      total: totalPrice
    }

    setProductList(prevList => [...prevList, newProduct])
    resetProductFields()
  }

  const handleCustomerSelect = customer => {
    setSelectedCustomer(customer.name)
    setSelectedCustomerPhone(customer.phone)
    setSelectedCustomerEmail(customer.email)
    setCustomerID(customer.customerID)
    setCustomerModalVisible(false)
  }

  const handleProductSelect = product => {
    setSelectedProduct(product.productName)
    setSelectedPrice(product.unitPrice.toString())
    setProvisionID(product.provisionID)
    setProductModalVisible(false)
  }

  const handleEditProduct = product => {
    setSelectedItem(product)
    setSelectedProduct(product.productName)
    setSelectedPrice(product.price.toString())
    setQuantity(product.quantity.toString())
    setDiscount(product.discount.toString())
    setEditModalVisible(true)
  }

  const handleUpdateProduct = () => {
    if (!selectedItem || !quantity || isNaN(quantity) || quantity <= 0) {
      alert('Please provide valid product details and quantity.')
      return
    }

    // Calculate the updated total for the edited product
    const updatedPrice = parseFloat(selectedPrice)
    const updatedQuantity = parseInt(quantity)
    const updatedDiscount = parseFloat(discount) || 0
    const updatedTotal =
      updatedPrice * updatedQuantity -
      (updatedDiscount / 100) * updatedPrice * updatedQuantity

    const updatedProduct = {
      ...selectedItem,
      provisionID: selectedItem.provisionID, // ✅ Keep provision ID
      productName: selectedProduct,
      price: updatedPrice,
      quantity: updatedQuantity,
      discount: updatedDiscount,
      total: updatedTotal
    }

    // Update the product in the product list
    const updatedList = productList.map(item =>
      item === selectedItem ? updatedProduct : item
    )
    setProductList(updatedList)

    resetProductFields()
    setEditModalVisible(false)
  }

  const handleDeleteProduct = () => {
    setProductList(prevList => prevList.filter(item => item !== selectedItem))
    setEditModalVisible(false)
  }

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: activeColors.primary[200] }
        ]}
      >
        <FormHeader title={'Invoice Generation'} />
        {view === 'List' && (
          <>
            <InvoicesTable />
            <Button
              title='Create Invoice'
              onPress={() => {
                setView('Generation')
              }}
              style={{ backgroundColor: 'deepskyblue' }}
            />
          </>
        )}
        {view === 'Generation' && (
          <ScrollView>
            <ScrollView
              style={[
                styles.container,
                { backgroundColor: activeColors.primary[200] }
              ]}
            >
              {/* Invoice Details */}
              <Flex direction='row' style={styles.row}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Invoice Number</Text>
                  <TextInput
                    placeholder='Invoice Number'
                    value={invoiceNumber}
                    style={styles.input}
                    onChangeText={setInvoiceNumber}
                    editable={false}
                  />
                </View>
              </Flex>
              <View style={[styles.fieldContainer, { marginBottom: 30 }]}>
                {/* Start Date (Read-only or pickable if you want) */}
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={styles.input}
                >
                  <Text>{issueDate.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={issueDate}
                    mode='date'
                    display='default'
                    onChange={(event, selectedDate) => {
                      setShowStartPicker(false)
                      if (selectedDate) {
                        setIssueDate(selectedDate)
                      }
                    }}
                  />
                )}

                {/* Due Date */}
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDuePicker(true)}
                  style={styles.input}
                >
                  <Text>{dueDate.toISOString().split('T')[0]}</Text>
                </TouchableOpacity>
                {showDuePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode='date'
                    display='default'
                    onChange={(event, selectedDate) => {
                      setShowDuePicker(false)
                      if (selectedDate) {
                        setDueDate(selectedDate)
                      }
                    }}
                  />
                )}
              </View>

              {/* Customer Section */}
              <Flex direction='column' style={{ marginBottom: 15 }}>
                <Text style={styles.label}>Customer</Text>
                <Pressable
                  style={styles.selectBox}
                  onPress={() => setCustomerModalVisible(true)}
                >
                  {selectedCustomer ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectMainText}>
                        {selectedCustomer}
                      </Text>
                      <Text style={styles.selectSubText}>
                        {selectedCustomerPhone}
                      </Text>
                      <Text style={styles.selectSubText}>
                        {selectedCustomerEmail}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectPlaceholder}>
                      Select a customer
                    </Text>
                  )}
                  <MaterialIcons
                    name='arrow-forward-ios'
                    size={18}
                    color='#888'
                  />
                </Pressable>
              </Flex>

              {/* Product Section */}
              <Flex direction='column' style={{ marginBottom: 15 }}>
                <Text style={styles.label}>Product</Text>
                <Pressable
                  style={styles.selectBox}
                  onPress={() => setProductModalVisible(true)}
                >
                  {selectedProduct ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectMainText}>
                        {selectedProduct}
                      </Text>
                      <Text style={styles.selectSubText}>
                        {currency} {selectedPrice}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectPlaceholder}>
                      Select a product
                    </Text>
                  )}
                  <MaterialIcons
                    name='arrow-forward-ios'
                    size={18}
                    color='#888'
                  />
                </Pressable>
              </Flex>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  placeholder='Quantity'
                  value={quantity}
                  keyboardType='numeric'
                  onChangeText={value => {
                    setQuantity(value)
                    calculateTotal()
                  }}
                  style={styles.input}
                />
              </View>
              <Flex
                direction='row'
                style={[styles.row, { justifyContent: 'space-evenly' }]}
              >
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Discount (%)</Text>
                  <TextInput
                    placeholder='Discount'
                    value={discount}
                    keyboardType='numeric'
                    onChangeText={value => {
                      setDiscount(value)
                      calculateTotal()
                    }}
                    style={styles.input}
                    editable={hasDiscount === true}
                  />
                </View>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Checkbox
                    status={hasDiscount ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setHasDiscount(!hasDiscount)
                    }}
                    color={'deepskyblue'}
                  />
                </View>
              </Flex>

              <Text style={styles.summaryText}>
                Subtotal: {currency}
                {subtotal}
              </Text>
              <Text style={styles.summaryText}>
                Total: {currency}
                {total}
              </Text>

              <Button
                title='Add Product'
                onPress={() => {
                  handleAddProduct()
                  calculateSubtotal()
                }}
                style={{ backgroundColor: 'deepskyblue' }}
              />

              {/* Product List */}
              <ScrollView style={styles.list}>
                {productList.map((product, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.listItem}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Text>{product.productName}</Text>
                    <Text>
                      {product.quantity} {product.unit}
                    </Text>
                    <Text>
                      {currency}
                      {product.total.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <Flex
              direction='row'
              style={{
                padding: 10,
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Button
                style={{ margin: 10, backgroundColor: 'deepskyblue' }}
                title='Preview Invoice'
                onPress={() => setPreviewModalVisible(true)}
              />
              <Button
                style={{ margin: 10, backgroundColor: 'deepskyblue' }}
                title='Confirm Invoice'
                onPress={() => {
                  handleSaveInvoice()
                  setView('List')
                }}
              />
            </Flex>
          </ScrollView>
        )}
      </View>
      <MessageModal {...messageModalState} />
      {/* Preview Modal */}
      <Modal visible={previewModalVisible} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invoice Preview</Text>
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Invoice Number: {invoiceNumber}
            </Text>
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Valid from: {issueDate.toLocaleDateString()} to
              {dueDate.toLocaleDateString()}.
            </Text>
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Customer: {selectedCustomer}
            </Text>
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Contact: {selectedCustomerPhone}
            </Text>
            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Products:</Text>
            {productList.map((product, index) => (
              <Text key={index}>
                {product.productName} - {product.quantity} pcs - {currency}
                {product.total.toFixed(2)}
              </Text>
            ))}
            <Button
              style={{ margin: 5, backgroundColor: 'deepskyblue' }}
              title='Close Preview'
              onPress={() => setPreviewModalVisible(false)}
            />
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
                  value={searchCustomerQuery}
                  onChangeText={handleSearchCustomers}
                  style={styles.modalInput}
                />
                <ScrollView>
                  <Flex direction='column' style={{ gap: 10 }}>
                    {paginatedCustomers.map(customer => (
                      <Pressable
                        key={customer.id}
                        style={styles.productItem}
                        onPress={() => handleCustomerSelect(customer)}
                      >
                        <Text style={styles.productName}>
                          {customer.name || customer.customerName || 'Unnamed'}
                        </Text>
                        <Text style={styles.productDetails}>
                          Email: {customer.email || 'N/A'} | Phone:{' '}
                          {customer.phone || 'N/A'}
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
              value={searchProductQuery}
              onChangeText={setSearchProductQuery}
              style={styles.input}
            />
            <ScrollView>
              <Flex direction='column' style={{ gap: 10 }}>
                {paginatedProducts.map(product => (
                  <Pressable
                    key={product.id}
                    style={styles.productItem}
                    onPress={() => handleProductSelect(product)}
                  >
                    <Text style={styles.productName}>
                      {product.productName}
                    </Text>
                    <Text style={[styles.productDetails]}>
                      Category: {product.category} | Price: {currency}{' '}
                      {product.unitPrice}
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
      {/* Edit Product Modal */}
      <Modal visible={editModalVisible} transparent animationType='slide'>
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
                Edit Product
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { alignSelf: 'center' }]}
                onPress={() => setEditModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='red' />
              </TouchableOpacity>
            </Flex>
            <Text
              style={[
                styles.modalText,
                {
                  color:
                    theme.mode === 'dark'
                      ? activeColors.grey[900]
                      : activeColors.grey[100]
                }
              ]}
            >
              Product Name
            </Text>
            <TextInput
              placeholder='Product Name'
              value={selectedProduct}
              onChangeText={text => setSelectedProduct(text)}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <Text
              style={[
                styles.modalText,
                {
                  color:
                    theme.mode === 'dark'
                      ? activeColors.grey[900]
                      : activeColors.grey[100]
                }
              ]}
            >
              Product Price
            </Text>
            <TextInput
              placeholder='Price'
              value={selectedPrice}
              keyboardType='numeric'
              onChangeText={text => setSelectedPrice(text)}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <Text
              style={[
                styles.modalText,
                {
                  color:
                    theme.mode === 'dark'
                      ? activeColors.grey[900]
                      : activeColors.grey[100]
                }
              ]}
            >
              Product Quantity
            </Text>
            <TextInput
              placeholder='Quantity'
              value={quantity}
              keyboardType='numeric'
              onChangeText={text => setQuantity(text)}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <Text
              style={[
                styles.modalText,
                {
                  color:
                    theme.mode === 'dark'
                      ? activeColors.grey[900]
                      : activeColors.grey[100]
                }
              ]}
            >
              Discount (%)
            </Text>
            <TextInput
              placeholder='Discount (%)'
              value={discount}
              keyboardType='numeric'
              onChangeText={text => setDiscount(text)}
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <Flex
              direction='row'
              justify='space-between'
              style={{ marginTop: 10 }}
            >
              <Button
                style={{ backgroundColor: 'crimson' }}
                title='Delete'
                onPress={handleDeleteProduct}
              />
              <Button
                style={{ backgroundColor: 'deepskyblue' }}
                title='Update'
                onPress={handleUpdateProduct}
              />
            </Flex>
          </View>
        </View>
      </Modal>
    </>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
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
  row: {
    alignItems: 'flex-end',
    marginBottom: 15,
    gap: 10
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
  productName: {
    fontSize: 16,
    color: '#fff'
  },
  productDetails: {
    fontSize: 12,
    color: '#666'
  },
  fieldContainer: {
    flex: 1
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
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#fff'
  },
  summaryText: { fontSize: 14, marginBottom: 5, color: '#fff' },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff'
  },
  list: {
    marginTop: 15
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    gap: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10
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
