import React, { useContext, useState, useEffect } from 'react'
import { Box, Flex, Button, Text, Pressable } from '@react-native-material/core'
import { StyleSheet, ScrollView, View } from 'react-native'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll
} from 'firebase/storage'
import { storage, auth } from '@/FirebaseConfig'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons'
import { SegmentedButtons } from 'react-native-paper'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'
import FormAppBar from '@/components/FormAppBar'

export default function Documents () {
  const [viewMode, setViewMode] = useState('upload')
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const MAX_FILES = 3

  useEffect(() => {
    if (viewMode === 'view') {
      fetchDocuments()
    }
  }, [viewMode])

  const getIconByType = type => {
    switch (type) {
      case 'pdf':
        return <AntDesign name='pdffile1' size={24} color='#e74c3c' />
      case 'docx':
      case 'doc':
        return <FontAwesome name='file-word-o' size={24} color='#3498db' />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <MaterialIcons name='image' size={24} color='#2ecc71' />
      case 'xlsx':
      case 'xls':
        return <FontAwesome name='file-excel-o' size={24} color='#27ae60' />
      default:
        return (
          <MaterialIcons name='insert-drive-file' size={24} color='#7f8c8d' />
        )
    }
  }

  const extractFileType = name => {
    const parts = name.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'file'
  }

  const pickDocument = async () => {
    if (selectedFiles.length < MAX_FILES) {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' })
        if (result && !result.canceled) {
          setSelectedFiles([...selectedFiles, result])
        }
      } catch (error) {
        showMessageModal(
          MessageTypes.FAIL,
          'Error',
          'Failed to pick the document.',
          hideMessageModal
        )
      }
    } else {
      showMessageModal(
        MessageTypes.WARNING,
        'Limit Reached',
        `You can only select up to ${MAX_FILES} documents.`,
        hideMessageModal
      )
    }
  }

  const pickImage = async () => {
    if (selectedFiles.length < MAX_FILES) {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1
        })
        if (!result.canceled && result.assets?.length > 0) {
          setSelectedFiles([...selectedFiles, result])
        } else {
          showMessageModal(
            MessageTypes.WARNING,
            'No Image Selected',
            'Image selection was cancelled or invalid.',
            hideMessageModal
          )
        }
      } catch (error) {
        showMessageModal(
          MessageTypes.FAIL,
          'Error',
          'Failed to pick image.',
          hideMessageModal
        )
      }
    } else {
      showMessageModal(
        MessageTypes.WARNING,
        'Limit Reached',
        `You can only select up to ${MAX_FILES} items.`,
        hideMessageModal
      )
    }
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      showMessageModal(
        MessageTypes.WARNING,
        'No Files',
        'Please select files or images to upload.',
        hideMessageModal
      )
      return
    }

    setUploading(true)
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      for (const file of selectedFiles) {
        const fileContent = file.assets?.[0] || file.output?.[0]
        if (!fileContent?.uri) continue

        const fileUri = fileContent.uri.startsWith('file://')
          ? fileContent.uri
          : `file://${fileContent.uri}`
        const response = await fetch(fileUri)
        const blob = await response.blob()

        const fileName =
          fileContent.name || fileContent.fileName || `document_${Date.now()}`
        const storageRef = ref(storage, `Users/${userId}/documents/${fileName}`)

        const uploadTask = uploadBytesResumable(storageRef, blob)
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            error => reject(error),
            () => resolve(null)
          )
        })
      }

      showMessageModal(
        MessageTypes.SUCCESS,
        'Upload Successful',
        `${selectedFiles.length} file(s) uploaded successfully.`,
        hideMessageModal
      )
      setSelectedFiles([])
      fetchDocuments()
    } catch (error: any) {
      console.error('Upload error:', error)
      const message =
        error?.message ||
        error?.code ||
        'An unknown error occurred while uploading.'
      showMessageModal(
        MessageTypes.FAIL,
        'Upload Error',
        message,
        hideMessageModal
      )
    } finally {
      setUploading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const folderRef = ref(storage, `Users/${userId}/documents`)
      const result = await listAll(folderRef)

      const urls = await Promise.all(
        result.items.map(async item => ({
          name: item.name,
          type: extractFileType(item.name),
          url: await getDownloadURL(item),
          uploadedOn: new Date().toLocaleDateString()
        }))
      )

      setUploadedDocuments(urls)
    } catch (error) {
      console.error('Error fetching documents:', error)
      showMessageModal(
        MessageTypes.FAIL,
        'Fetch Error',
        'Failed to fetch documents.',
        hideMessageModal
      )
    }
  }

  return (
    <Flex
      fill
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title={'Manage Documents'} />
      <SegmentedButtons
        value={viewMode}
        onValueChange={val => setViewMode(val)}
        buttons={[
          {
            value: 'upload',
            label: 'Upload',
            icon: 'layers-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              viewMode === 'upload'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          },
          {
            value: 'view',
            label: 'View',
            icon: 'account-outline',
            uncheckedColor: activeColors.grey[900],
            style:
              viewMode === 'view'
                ? { backgroundColor: 'deepskyblue', borderColor: 'transparent' }
                : {
                    backgroundColor: activeColors.blueAccent[100],
                    borderColor: 'transparent'
                  }
          }
        ]}
        style={{ marginVertical: 10 }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {viewMode === 'upload' ? (
          <Box>
            <Text style={styles.heading}>Upload Documents</Text>
            <Flex
              direction='row'
              justify='around'
              style={{ gap: 5, marginBottom: 5 }}
            >
              <Button
                title='Choose File'
                onPress={pickDocument}
                style={styles.uploadButton}
              />
              <Button
                title='Pick Image'
                onPress={pickImage}
                style={styles.uploadButton}
              />
            </Flex>
            {selectedFiles.map((file, index) => {
              const fileContent = file.assets?.[0] || file.output?.[0]
              if (!fileContent) return null
              const fileName =
                fileContent.name || fileContent.fileName || 'Unnamed File'
              return (
                <Pressable key={index} style={styles.documentItem}>
                  <View style={styles.documentRow}>
                    {getIconByType(extractFileType(fileName))}
                    <View style={styles.documentDetailsContainer}>
                      <Text style={styles.documentTitle}>
                        {fileName.replace(/\.[^/.]+$/, '')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )
            })}
            <Button
              title='Upload'
              onPress={uploadFiles}
              style={styles.uploadButton}
              disabled={selectedFiles.length === 0 || uploading}
            />
          </Box>
        ) : (
          <Box>
            <Text style={styles.heading}>View Documents</Text>
            {uploadedDocuments.map((doc, index) => (
              <Pressable key={index} style={styles.documentItem}>
                <View style={styles.documentRow}>
                  {getIconByType(doc.type)}
                  <View style={styles.documentDetailsContainer}>
                    <Text style={styles.documentTitle}>{doc.name}</Text>
                    <Text style={styles.documentDetails}>
                      Uploaded on: {doc.uploadedOn}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </Box>
        )}
      </ScrollView>
      <MessageModal {...messageModalState} />
    </Flex>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  content: {
    padding: 15
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'white'
  },
  uploadButton: {
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: 'deepskyblue'
  },
  documentItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  documentDetailsContainer: {
    marginLeft: 10
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000'
  },
  documentDetails: {
    fontSize: 14,
    color: '#666'
  }
})
