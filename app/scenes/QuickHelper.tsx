import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ImageBackground,
  Alert,
  Image
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Audio } from 'expo-av'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import axios from 'axios'
import { MaterialIcons } from '@expo/vector-icons'
import { useMessageModal } from '@/hooks'
import { MessageTypes } from '@/components/modals/types'
import MessageModal from '@/components/modals/MessageModal'
import { FIREBASE_APP } from '@/FirebaseConfig'

interface Message {
  id: string
  sender: 'user' | 'bot'
  type: 'text' | 'image' | 'document' | 'audio'
  text?: string
  uri?: string
}

const QuickHelper: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const flatListRef = useRef<FlatList>(null)
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const sendMessageToServer = async (message: string) => {
    try {
      const response = await axios.post(
        'https://Quantilytix-Qxlite-AI.hf.space/predict',
        {
          user_question: message
        }
      )

      const botMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        type: 'text',
        text: response.data || "Sorry, I couldn't understand that."
      }

      setMessages(prevMessages => [...prevMessages, botMessage])
    } catch (error) {
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Unable to connect to the server. Please try again later.',
        hideMessageModal,
        { buttonText: 'Close' }
      )
    }
  }

  const sendMessage = () => {
    if (inputText.trim() === '') return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: inputText
    }

    setMessages(prevMessages => [...prevMessages, userMessage])
    sendMessageToServer(inputText)
    setInputText('')
  }

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) {
        showMessageModal(
          MessageTypes.WARNING,
          'Permission Denied',
          'Audio recording permission is required.',
          hideMessageModal,
          { buttonText: 'Close' }
        )
        return
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
    } catch (error) {
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to start recording.',
        hideMessageModal,
        { buttonText: 'Close' }
      )
    }
  }

  const stopRecording = async () => {
    try {
      if (!recording) return

      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()

      const storage = getStorage(FIREBASE_APP)
      const audioRef = ref(storage, `audio/${Date.now()}.m4a`)

      const response = await fetch(uri!)
      const blob = await response.blob()
      await uploadBytes(audioRef, blob)
      const downloadUrl = await getDownloadURL(audioRef)

      const audioMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        type: 'audio',
        uri: downloadUrl
      }

      setMessages(prevMessages => [...prevMessages, audioMessage])
      setRecording(null)
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording.')
    }
  }

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0]
        const uri = imageAsset.uri

        const storage = getStorage(FIREBASE_APP)
        const imageRef = ref(storage, `images/${Date.now()}.jpg`)

        const response = await fetch(uri)
        const blob = await response.blob()
        await uploadBytes(imageRef, blob)
        const downloadUrl = await getDownloadURL(imageRef)

        const imageMessage: Message = {
          id: Date.now().toString(),
          sender: 'user',
          type: 'image',
          uri: downloadUrl
        }

        setMessages(prevMessages => [...prevMessages, imageMessage])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick the image.')
    }
  }

  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({})

      if (result.type === 'success') {
        const uri = result.uri
        const name = result.name

        const storage = getStorage(FIREBASE_APP)
        const docRef = ref(storage, `documents/${name}`)

        const response = await fetch(uri)
        const blob = await response.blob()
        await uploadBytes(docRef, blob)
        const downloadUrl = await getDownloadURL(docRef)

        const documentMessage: Message = {
          id: Date.now().toString(),
          sender: 'user',
          type: 'document',
          uri: downloadUrl,
          text: name
        }

        setMessages(prevMessages => [...prevMessages, documentMessage])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick the document.')
    }
  }

  const renderItem = ({ item }: { item: Message }) => {
    let content
    if (item.type === 'text') {
      content = <Text style={styles.messageText}>{item.text}</Text>
    } else if (item.type === 'image') {
      content = <Image source={{ uri: item.uri }} style={styles.messageImage} />
    } else if (item.type === 'document') {
      content = (
        <TouchableOpacity
          onPress={() => Alert.alert('Document', item.text || 'View Document')}
        >
          <Text style={styles.messageText}>{item.text || 'Document'}</Text>
        </TouchableOpacity>
      )
    } else if (item.type === 'audio') {
      content = (
        <TouchableOpacity
          onPress={() => Alert.alert('Play Audio', 'Audio file clicked')}
        >
          <Text style={styles.messageText}>Play Audio</Text>
        </TouchableOpacity>
      )
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.sender === 'user' ? styles.userMessage : styles.botMessage
        ]}
      >
        {content}
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('@/assets/images/chat-bg.png')} // Replace with your image path
      style={styles.container}
      imageStyle={{
        resizeMode: 'cover', // Ensures the image covers the entire container
        alignSelf: 'center', // Centers the image horizontally
        opacity: 0.2
      }}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContainer}
      />
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder='Type a message...'
            placeholderTextColor='#AAA'
          />
          <TouchableOpacity onPress={startRecording}>
            <MaterialIcons
              name={recording ? 'stop' : 'mic'}
              size={24}
              color='#1E90FF'
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <MaterialIcons name='photo' size={24} color='#1E90FF' />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickDocument}>
            <MaterialIcons name='attach-file' size={24} color='#1E90FF' />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <MaterialIcons name='send' size={24} color='#FFF' />
        </TouchableOpacity>
      </View>
      <MessageModal {...messageModalState} />
    </ImageBackground>
  )
}

export default QuickHelper

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 10
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%'
  },
  userMessage: {
    backgroundColor: '#1E90FF',
    alignSelf: 'flex-end'
  },
  botMessage: {
    backgroundColor: '#333',
    alignSelf: 'flex-start'
  },
  messageText: {
    color: '#FFF'
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    margin: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 10
  },
  input: {
    flex: 1,
    color: '#FFF'
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E90FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10
  }
})
