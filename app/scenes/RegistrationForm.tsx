import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native'
import { SelectList } from 'react-native-dropdown-select-list'
import { useRouter } from 'expo-router'
import { useMessageModal } from '@/hooks'
import { MessageTypes } from '@/components/modals/types'
import MessageModal from '@/components/modals/MessageModal'
import { auth, db } from '../../FirebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'

const RegistrationForm = () => {
  const router = useRouter()
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    businessName: '',
    businessSector: '',
    businessSubSector: '',
    currency: '',
    email: '',
    fullName: '',
    gender: '',
    location: '',
    phoneNumber: '',
    password: ''
  })

  const handleCancel = () => {
    router.push('/scenes/LoginForm')
  }

  const handleFormSubmit = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill in all required fields.',
        hideMessageModal,
        { buttonText: 'OK' }
      )
      return
    }

    try {
      // Add the user to Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      const userId = userCredential.user.uid

      // Save additional details to Firestore
      await setDoc(doc(db, 'Users', userId), {
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        businessName: formData.businessName,
        businessSector: formData.businessSector,
        businessSubSector: formData.businessSubSector,
        currency: formData.currency,
        email: formData.email,
        fullName: formData.fullName,
        gender: formData.gender,
        location: formData.location,
        phoneNumber: formData.phoneNumber
      })

      showMessageModal(
        MessageTypes.SUCCESS,
        'Registration Complete',
        'Your details have been submitted successfully!',
        () => {
          hideMessageModal()
          router.push('/scenes/LoginForm')
        },
        { buttonText: 'Proceed' }
      )
    } catch (error) {
      showMessageModal(
        MessageTypes.FAIL,
        'Registration Failure',
        'Failed tp register account, please try again.',
        hideMessageModal,
        { buttonText: 'OK' }
      )
    }
  }

  const fields = [
    { key: 'businessName', label: 'Business Name', type: 'text' },
    { key: 'fullName', label: 'Full Name', type: 'text' },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Male', 'Female', 'Other']
    },
    { key: 'email', label: 'Email Address', type: 'text' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'addressLine1', label: 'Address Line 1', type: 'text' },
    { key: 'addressLine2', label: 'Address Line 2', type: 'text' },
    {
      key: 'businessSector',
      label: 'Business Sector',
      type: 'select',
      options: ['Products and Services', 'Products', 'Services']
    },
    {
      key: 'businessSubSector',
      label: 'Business Sub-Sector',
      type: 'select',
      options: ['Technology', 'Retail', 'Health', 'Finance', 'Other']
    },
    {
      key: 'currency',
      label: 'Currency',
      type: 'select',
      options: ['USD', 'ZAR']
    }
  ]

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Register Your Business</Text>

        {fields.map(field => (
          <View key={field.key} style={styles.fieldContainer}>
            <Text style={styles.label}>{field.label}</Text>
            {field.type === 'select' ? (
              <SelectList
                setSelected={value =>
                  setFormData(prevData => ({
                    ...prevData,
                    [field.key]: value
                  }))
                }
                data={field.options}
                placeholder={`Select ${field.label}`}
                boxStyles={{
                  backgroundColor: '#1E1E1E',
                  borderColor: '#555',
                  borderRadius: 5
                }}
                dropdownStyles={{
                  backgroundColor: '#1E1E1E',
                  borderColor: '#555'
                }}
                inputStyles={{ color: '#fff' }}
              />
            ) : (
              <TextInput
                style={styles.textInput}
                value={formData[field.key]}
                onChangeText={text =>
                  setFormData(prevData => ({
                    ...prevData,
                    [field.key]: text
                  }))
                }
                placeholder={field.label}
                placeholderTextColor='#aaa'
                secureTextEntry={field.type === 'password'}
              />
            )}
          </View>
        ))}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            width: '100%'
          }}
        >
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleFormSubmit}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Message Modal */}
      <MessageModal {...messageModalState} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#121212'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff'
  },
  fieldContainer: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#fff'
  },
  textInput: {
    height: 50,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#1E1E1E',
    color: '#fff'
  },
  cancelButton: {
    width: '50%',
    marginTop: 20,
    backgroundColor: 'crimson',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  submitButton: {
    width: '50%',
    marginTop: 20,
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})

export default RegistrationForm
