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
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where
} from 'firebase/firestore'
import DateTimePicker from '@react-native-community/datetimepicker'
import FormHeader from '@/components/FormAppBar'
import QuotationsTable from '@/components/QuotationsTable'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'
import { QuotationDetails } from '@/types/invoice'
import { saveQuotation } from '@/utils/firebase/invoiceService'
import emailjs from 'emailjs-com'
import { useRoute } from '@react-navigation/native'

export default function QuotationForm () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  const route = useRoute()
  const { mode, data } = route.params || {}
  const [view, setView] = useState('List')
  const [customerModalVisible, setCustomerModalVisible] = useState(false)
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [currency, setCurrency] = useState('R')
  const [businessName, setBusinessName] = useState('Quantilytix')
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [customerID, setCustomerID] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('')
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [quantity, setQuantity] = useState('')
  const [discount, setDiscount] = useState('')
  const [productList, setProductList] = useState([])
  const [quotationNumber, setQuotationNumber] = useState('QT0001')
  const [issueDate, setIssueDate] = useState(new Date())
  const [dueDate, setDueDate] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showDuePicker, setShowDuePicker] = useState(false)

  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  const [selectedItem, setSelectedItem] = useState(null)
  const [customerPage, setCustomerPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('')
  const [searchProductQuery, setSearchProductQuery] = useState('')

  const itemsPerPage = 5
  useEffect(() => {
    if (mode === 'edit' && data) {
      setView('Generation')
      setQuotationNumber(data.quotationNumber || 'QT0001')
      setIssueDate(
        data.issueDate?.toDate
          ? data.issueDate.toDate()
          : new Date(data.issueDate)
      )
      setDueDate(
        data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate)
      )

      if (data.customer) {
        setCustomerID(data.customer.customerID || '')
        setSelectedCustomer(data.customer.customerName || '')
        setSelectedCustomerPhone(data.customer.customerContact || '')
        setSelectedCustomerEmail(data.customer.customerEmail || '')
      }

      if (data.products) {
        setProductList(
          data.products.map(product => ({
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            discount: product.discount,
            total: product.total
          }))
        )
      }
    }
  }, [mode, data])

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid
        if (!userId) return

        // Fetch currency preference
        const userDoc = await getDoc(doc(db, `Users/${userId}`))
        if (userDoc.exists()) {
          setCurrency(userDoc.data()?.currency || '$')
          setBusinessName(userDoc.data()?.businessName || 'Quantilytix')
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
    customer.name.toLowerCase().includes(searchCustomerQuery.toLowerCase())
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
  const generateQuotationNumber = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const quotationsRef = collection(db, `Users/${userId}/quotations`)
      const snapshot = await getDocs(quotationsRef)

      if (snapshot.empty) {
        setQuotationNumber('QT0001')
        return
      }

      const existingIDs = snapshot.docs
        .map(doc => doc.data().quotationNumber) // ✅ Should be quotationNumber, not invoiceNumber
        .filter(id => typeof id === 'string' && id.startsWith('QT'))
        .sort()

      const lastQuotation = existingIDs.pop()

      if (!lastQuotation) {
        setQuotationNumber('QT0001')
        return
      }

      const lastNumber = parseInt(lastQuotation.replace('QT', ''), 10)
      const nextNumber = lastNumber + 1
      setQuotationNumber(`QT${String(nextNumber).padStart(4, '0')}`)
    } catch (error) {
      console.error('Error generating quotation number:', error)
    }
  }

  const handleAddProduct = () => {
    if (!selectedProduct || !quantity || isNaN(quantity) || quantity <= 0) {
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields for the product!',
        hideMessageModal
      )
      return
    }

    const totalPrice = parseFloat(calculateSubtotal())

    const newProduct = {
      name: selectedProduct,
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
    setProductModalVisible(false)
  }

  const handleSearchProducts = query => {
    setSearchProductQuery(query) // you should be using searchProductQuery, not a separate one
    setProductPage(1)
  }

  const handleEditProduct = product => {
    setSelectedItem(product)
    setSelectedProduct(product.name)
    setSelectedPrice(product.price.toString())
    setQuantity(product.quantity.toString())
    setDiscount(product.discount.toString())
    setEditModalVisible(true)
  }

  const handleUpdateProduct = () => {
    if (!selectedItem || !quantity || isNaN(quantity) || quantity <= 0) {
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields for the product!',
        hideMessageModal
      )
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
      name: selectedProduct,
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
  const handleSaveQuotation = async (): Promise<void> => {
    if (
      !selectedCustomer ||
      !customerID ||
      !selectedCustomerPhone ||
      !selectedCustomerEmail ||
      !productList.length
    ) {
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please complete all customer details and add at least one product!',
        hideMessageModal
      )
      return
    }

    try {
      const quotationDetails: QuotationDetails = {
        quotationNumber,
        issueDate,
        dueDate,
        customerID,
        customer: {
          customerID: customerID,
          customerName: selectedCustomer,
          customerContact: selectedCustomerPhone,
          customerEmail: selectedCustomerEmail
        },
        products: productList.map(product => ({
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          discount: product.discount,
          total: product.total
        })),
        status: 'Pending',
        totalAmount: parseFloat(calculateTotal())
      }

      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const quotationRef = collection(db, `Users/${userId}/quotations`)

      if (mode === 'edit' && data?.id) {
        const docRef = doc(db, `Users/${userId}/quotations`, data.id)
        await updateDoc(docRef, quotationDetails)
        showMessageModal(
          MessageTypes.SUCCESS,
          'Quotation Updated',
          `Quotation ${quotationNumber} updated successfully.`,
          hideMessageModal
        )
      } else {
        await addDoc(quotationRef, quotationDetails)
        showMessageModal(
          MessageTypes.SUCCESS,
          'Quotation Saved',
          `Quotation ${quotationNumber} saved successfully.`,
          hideMessageModal
        )
      }

      resetFields()
      resetProductFields()
      generateQuotationNumber()
      setView('List')
    } catch (error) {
      console.error('Error saving quotation:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Error',
        'Failed to save quotation. Please try again.',
        hideMessageModal
      )
    }
  }

  const handleDeleteProduct = () => {
    setProductList(prevList => prevList.filter(item => item !== selectedItem))
    setEditModalVisible(false)
  }
  const resetFields = () => {
    setSelectedCustomer('')
    setSelectedCustomerEmail('')
    setSelectedCustomerPhone('')
    setProductList([])
  }
  const resetProductFields = () => {
    setSelectedProduct('')
    setSelectedPrice('')
    setQuantity('')
    setDiscount('')
  }
  const sendEmail = async () => {
    try {
      const serviceID = 'service_sk0x9vk'
      const templateID = 'template_888bmff'
      const userID = '3J0XpgBiTM1W-kC6L'

      const templateParams = {
        from_name: businessName, // <- update this!
        to_name: selectedCustomer,
        email: selectedCustomerEmail,
        quotation_id: quotationNumber,
        issue_date: issueDate.toLocaleDateString(),
        due_date: dueDate.toLocaleDateString(),
        customer_name: selectedCustomer,
        customer_phone: selectedCustomerPhone,
        currency: currency,
        total_amount: calculateTotal(),
        provisions: productList.map(product => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price.toFixed(2),
          total: product.total.toFixed(2),
          currency
        }))
      }

      const payload = {
        service_id: serviceID,
        template_id: templateID,
        user_id: userID,
        template_params: templateParams
      }

      const response = await fetch(
        'https://api.emailjs.com/api/v1.0/email/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      if (response.status === 200) {
        showMessageModal(
          MessageTypes.SUCCESS,
          'Success',
          'Quotation sent to customer email!',
          hideMessageModal
        )
      } else {
        const errorText = await response.text()
        console.error('Failed to send email:', response.status, errorText)
        showMessageModal(
          MessageTypes.FAIL,
          'Email Error',
          `Server responded with ${response.status}: ${errorText}`,
          hideMessageModal
        )
      }
    } catch (error) {
      console.error('Email send error:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Error',
        'Failed to send email. Please try again.',
        hideMessageModal
      )
    }
  }

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: activeColors.primary[200] }
        ]}
      >
        <FormHeader title='Quotation Generation' />
        {view === 'List' && (
          <>
            <QuotationsTable />
            <Button
              title='Create Quotation'
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
              {/* Quotation Details */}
              <Flex direction='row' style={styles.row}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Quotation Number</Text>
                  <TextInput
                    placeholder='Quotation Number'
                    value={quotationNumber}
                    style={styles.input}
                    onChangeText={setQuotationNumber}
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
                  style={[styles.input, { marginBottom: 5 }]}
                />
              </View>

              <Text style={styles.summaryText}>
                Subtotal: {currency}
                {calculateSubtotal()}
              </Text>
              <Text style={styles.summaryText}>
                Total: {currency}
                {calculateTotal()}
              </Text>

              <Button
                title='Add Product'
                onPress={handleAddProduct}
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
                    <Text>{product.name}</Text>
                    <Text>{product.quantity} pcs</Text>
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
                title='Preview Quotation'
                onPress={() => setPreviewModalVisible(true)}
              />
              <Button
                style={{ margin: 10, backgroundColor: 'deepskyblue' }}
                title='Confirm Quotation'
                onPress={() => {
                  handleSaveQuotation()
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
            <Text style={styles.modalTitle}>Quotation Preview</Text>
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Quotation Number: {quotationNumber}
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
            <Text style={{ marginVertical: 5, fontWeight: 550 }}>
              Email: {selectedCustomerEmail}
            </Text>
            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Products:</Text>
            {productList.map((product, index) => (
              <Text key={index}>
                {`${product.name} - ${
                  product.quantity
                } pcs - ${currency}${product.total.toFixed(2)}`}
              </Text>
            ))}

            <Button
              title='Edit'
              onPress={() => setPreviewModalVisible(false)}
              style={{ backgroundColor: 'deepskyblue', marginVertical: '10px' }}
            />
            <Flex direction='row' style={{ gap: 5, alignItems: 'center' }}>
              <Button
                title='Download'
                onPress={() => setPreviewModalVisible(false)}
                style={styles.quotationButton}
              />
              <Button
                title='Send Via Email'
                onPress={() => {
                  setPreviewModalVisible(false)
                  sendEmail()
                }}
                style={styles.quotationButton}
              />
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
                onPress={() => {
                  setCustomerModalVisible(false)
                  setIsAddingCustomer(false)
                }}
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
                        <Text style={styles.productName}>{customer.name}</Text>
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
              onChangeText={handleSearchProducts}
              style={styles.modalInput}
            />
            <ScrollView>
              <Flex direction='column' style={{ gap: 10 }}>
                {paginatedProducts.map(product => (
                  <Pressable
                    key={product.id}
                    style={styles.productItem}
                    onPress={() => handleProductSelect(product)}
                  >
                    <Text
                      style={styles.productName}
                    >{`${product.productName}`}</Text>
                    <Text style={[styles.productDetails]}>
                      {`Category: ${
                        product.category ?? 'N/A'
                      } | Price: ${currency} ${product.unitPrice ?? 0}`}
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
  // Same styles as InvoiceForm
  container: {
    flex: 1,
    padding: 10
  },
  row: {
    alignItems: 'flex-end',
    marginBottom: 15,
    gap: 10
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
    margin: 5,
    color: '#fff'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
  modal: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
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
  productName: {
    fontSize: 16,
    color: '#fff'
  },
  productDetails: {
    fontSize: 12,
    color: '#666'
  },
  quotationButton: {
    backgroundColor: 'deepskyblue',
    width: '50%',
    borderRadius: 15
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
