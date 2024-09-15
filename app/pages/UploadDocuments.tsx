import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker'; // Correct import
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage
import { FIREBASE_APP } from '@/FirebaseConfig'; // Firebase configuration
import { AntDesign } from '@expo/vector-icons'; // For "X" icon

const MAX_FILES = 3;

const UploadDocuments = () => {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false); // To indicate upload progress

  const storage = getStorage(FIREBASE_APP);

  // Handle document picker
  const pickDocument = async () => {
    if (selectedFiles.length < MAX_FILES) {
      try {
        let result = await DocumentPicker.getDocumentAsync({
          type: '*/*', // To allow all document types
          multiple: false, // Allow single document at a time
        });

        console.log('Document Picker Result:', result); // Debugging output

        // Check if the user canceled the selection or if a valid document was selected
        if (result && !result.canceled && result.assets && result.assets.length > 0) {
          console.log('Document selected:', result.assets[0]);
          setSelectedFiles([...selectedFiles, result.assets[0]]); // Append the new document
        } else {
          console.log('Document selection was canceled');
        }
      } catch (error) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to pick the document');
      }
    } else {
      Alert.alert('Max Limit', `You can only select up to ${MAX_FILES} documents.`);
    }
  };

  // Handle image picker
  const pickImage = async () => {
    if (selectedImages.length < MAX_FILES) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
      }
    } else {
      Alert.alert('Max Limit', `You can only select up to ${MAX_FILES} images.`);
    }
  };

  // Upload documents and images to Firebase Storage
  const uploadFiles = async () => {
    try {
      setUploading(true); // Set uploading state

      // Handle document uploads
      for (const file of selectedFiles) {
        const docUri = file.uri;
        const docRef = ref(storage, `documents/${file.name}`);
        const response = await fetch(docUri);
        const blob = await response.blob();
        await uploadBytes(docRef, blob);
        const downloadUrl = await getDownloadURL(docRef);
        console.log('Document uploaded successfully:', downloadUrl);
      }

      // Handle image uploads
      for (const imageUri of selectedImages) {
        const imageRef = ref(storage, `images/${Date.now()}.jpg`);
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        const downloadUrl = await getDownloadURL(imageRef);
        console.log('Image uploaded successfully:', downloadUrl);
      }

      setUploading(false); // Reset uploading state
      Alert.alert('Success', 'Files uploaded successfully.');
    } catch (error) {
      setUploading(false);
      Alert.alert('Upload failed', error.message);
      console.error('Error uploading files:', error);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Remove selected image
  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Documents</Text>

      {/* Button to pick a document */}
      <TouchableOpacity style={styles.button} onPress={pickDocument} disabled={selectedFiles.length >= MAX_FILES}>
        <Text style={styles.buttonText}>Pick a Document</Text>
      </TouchableOpacity>

      {/* Show selected documents */}
      {selectedFiles.map((file, index) => (
        <View key={index} style={styles.fileInfo}>
          <Text style={styles.fileName}>Document Selected: {file.name}</Text>
          <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Button to pick an image */}
      <TouchableOpacity style={styles.button} onPress={pickImage} disabled={selectedImages.length >= MAX_FILES}>
        <Text style={styles.buttonText}>Pick an Image</Text>
      </TouchableOpacity>

      {/* Show selected images in a horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {selectedImages.map((imageUri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity onPress={() => removeImage(index)} style={styles.closeIcon}>
                <AntDesign name="closecircle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* If no file or image is selected, show a placeholder */}
      {selectedFiles.length === 0 && selectedImages.length === 0 && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No document or image selected.</Text>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={uploadFiles} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Upload Files'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UploadDocuments;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#000', // Background color
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 40,
    color: '#fff', // White text
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#28a745', // Green for upload button
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 35,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileInfo: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    color: '#fff', // White text
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  imageContainer: {
    flexDirection: 'row', // Horizontal layout for images
  },
  imageWrapper: {
    position: 'relative', // To place the "X" icon at the top-right corner
    marginRight: 10, // Spacing between images
    borderRadius: 10, // Rounded corners for images
    overflow: 'hidden', // Ensure corners are rounded
  },
  image: {
    width: 100, // Smaller image size
    height: 100,
    borderRadius: 10, // Border radius for rounded edges
  },
  closeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent background for the close icon
    borderRadius: 12, // Make the icon round
  },
  placeholder: {
    marginTop: 30,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#aaa', // Light grey for the placeholder text
    fontSize: 16,
  },
});
