import React, { useState, useContext, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  Modal,
  TouchableOpacity
} from 'react-native'
import { Flex, Button, Pressable, Text } from '@react-native-material/core'
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { SelectList } from 'react-native-dropdown-select-list'
import FormAppBar from '@/components/FormAppBar'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'
import { db, auth } from '@/FirebaseConfig'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'

export default function TeamMembersForm () {
  const { theme } = useContext(ThemeContext)
  const activeColors = colors[theme.mode]
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()

  const [members, setMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredMembers, setFilteredMembers] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const membersPerPage = 5 // Show 5 members per page

  const user = auth.currentUser

  useEffect(() => {
    if (user) {
      fetchMembers()
    }
  }, [user])

  const fetchMembers = async () => {
    if (!user) return
    try {
      const teamMembersRef = collection(db, `Users/${user.uid}/team_members`)
      const snapshot = await getDocs(teamMembersRef)
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMembers(membersList)
      setFilteredMembers(membersList)
    } catch (error) {
      console.error('Error fetching team members from Firebase:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to fetch team members.',
        hideMessageModal
      )
    }
  }

  const handleSearch = useCallback(
    query => {
      setSearchQuery(query)
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredMembers(filtered)
    },
    [members]
  )

  const validateInputs = () => {
    if (
      !newMemberName ||
      !newMemberRole ||
      !newMemberEmail ||
      !newMemberPhone
    ) {
      setAddModalVisible(false)
      showMessageModal(
        MessageTypes.WARNING,
        'Missing Information',
        'Please fill all required fields for the team member!',
        hideMessageModal
      )
      return false
    }
    return true
  }

  const handleAddNew = async () => {
    if (!validateInputs() || !user) return

    try {
      await addDoc(collection(db, `Users/${user.uid}/team_members`), {
        name: newMemberName,
        role: newMemberRole,
        email: newMemberEmail,
        phone: newMemberPhone
      })
      await fetchMembers()
      setAddModalVisible(false)
      setNewMemberName('')
      setNewMemberRole('')
      setNewMemberEmail('')
      setNewMemberPhone('')
      showMessageModal(
        MessageTypes.SUCCESS,
        'Added',
        'The team member has been added successfully.',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error adding team member:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to add new team member.',
        hideMessageModal
      )
    }
  }

  const handleEdit = async () => {
    if (!selectedMember || !user) return

    try {
      const memberRef = doc(
        db,
        `Users/${user.uid}/team_members`,
        selectedMember.id
      )
      await updateDoc(memberRef, selectedMember)
      await fetchMembers()
      setEditModalVisible(false)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Updated',
        'The team member has been updated successfully.',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error updating team member:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to update team member.',
        hideMessageModal
      )
    }
  }

  const handleDelete = async id => {
    if (!user) return

    try {
      const memberRef = doc(db, `Users/${user.uid}/team_members`, id)
      await deleteDoc(memberRef)
      await fetchMembers()
      showMessageModal(
        MessageTypes.SUCCESS,
        'Deleted',
        'The team member has been deleted successfully.',
        hideMessageModal
      )
    } catch (error) {
      console.error('Error deleting team member:', error)
      showMessageModal(
        MessageTypes.WARNING,
        'Error',
        'Failed to delete team member.',
        hideMessageModal
      )
    }
  }
  // 🔹 Paginate Members
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  )
  return (
    <Flex
      fill
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <FormAppBar title={'Team Member'} backTarget='/profile' />
      {/* Search Bar */}
      <Flex direction='column' justify='center' style={styles.searchContainer}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: activeColors.grey[200] }
          ]}
        >
          <MaterialIcons
            name='search'
            size={24}
            color={activeColors.grey[600]}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder='Search team members'
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: activeColors.grey[700] }]}
          />
        </View>
      </Flex>

      {/* List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {paginatedMembers.map(member => (
          <Pressable
            key={member.id}
            style={[
              styles.listItem,
              {
                backgroundColor: activeColors.primary[300],
                borderColor: activeColors.grey[400]
              }
            ]}
            onPress={() => {
              setSelectedMember({ ...member })
              setEditModalVisible(true)
            }}
          >
            <FontAwesome5
              name='user-circle'
              size={32}
              color={'deepskyblue'}
              style={styles.icon}
            />
            <View style={styles.listItemContent}>
              <Text
                style={[styles.listItemName, { color: activeColors.grey[900] }]}
              >
                {member.name}
              </Text>
              <Text
                style={[styles.listItemRole, { color: activeColors.grey[800] }]}
              >
                {member.role}
              </Text>
            </View>
            <View style={styles.contactDetails}>
              <Text
                style={[
                  styles.listItemPhone,
                  { color: activeColors.grey[700] }
                ]}
              >
                {member.phone}
              </Text>
              <Text
                style={[
                  styles.listItemEmail,
                  { color: activeColors.grey[600] }
                ]}
              >
                {member.email}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Add New Member Button */}
      <Button
        title='Add New Member'
        style={[styles.addNewButton, { backgroundColor: 'deepskyblue' }]}
        onPress={() => setAddModalVisible(true)}
      />
      <MessageModal {...messageModalState} />

      {/* Add New Member Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: activeColors.primary[200] }
            ]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAddModalVisible(false)}
            >
              <MaterialIcons name='close' size={24} color='crimson' />
            </TouchableOpacity>
            <Text
              style={[
                styles.modalTitle,
                { color: theme.mode === 'dark' ? '#fff' : '#000' }
              ]}
            >
              Add New Team Member
            </Text>
            <TextInput
              placeholder='Full Name'
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />

            <TextInput
              placeholder='Member Role'
              value={newMemberRole}
              onChangeText={setNewMemberRole}
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder='Email'
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType='email-address'
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <TextInput
              placeholder='Phone Number'
              value={newMemberPhone}
              onChangeText={setNewMemberPhone}
              keyboardType='phone-pad'
              placeholderTextColor={theme.mode === 'light' ? '#888' : '#fff'} // <-- Ensure white placeholder text in dark mode
              style={[
                styles.modalInput,
                {
                  backgroundColor:
                    theme.mode === 'light' ? '#f2f2f2' : '#3A3A3A',
                  color: theme.mode === 'light' ? '#000' : '#fff'
                }
              ]}
            />
            <Button
              title='Add Member'
              onPress={handleAddNew}
              style={styles.addButton}
            />
          </View>
        </View>
      </Modal>
      {/* Edit Member Modal */}
      {selectedMember && (
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
                { backgroundColor: activeColors.primary[200] }
              ]}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <MaterialIcons name='close' size={24} color='crimson' />
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.mode === 'dark' ? '#fff' : '#000' }
                ]}
              >
                Edit Team Member
              </Text>
              <TextInput
                placeholder='Full Name'
                value={selectedMember.name}
                onChangeText={text =>
                  setSelectedMember(prev => ({ ...prev, name: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Role'
                value={selectedMember.role}
                onChangeText={text =>
                  setSelectedMember(prev => ({ ...prev, role: text }))
                }
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Email'
                value={selectedMember.email}
                onChangeText={text =>
                  setSelectedMember(prev => ({ ...prev, email: text }))
                }
                keyboardType='email-address'
                style={[
                  styles.modalInput,
                  {
                    backgroundColor:
                      theme.mode === 'light' ? '#f2f2f2' : '#1E1E1E',
                    color: theme.mode === 'light' ? '#000' : '#fff'
                  }
                ]}
              />
              <TextInput
                placeholder='Phone Number'
                value={selectedMember.phone}
                onChangeText={text =>
                  setSelectedMember(prev => ({ ...prev, phone: text }))
                }
                keyboardType='phone-pad'
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
                justify='between'
                style={styles.modalButtons}
              >
                <Button
                  title='Delete'
                  onPress={() => {
                    setEditModalVisible(false)
                    showMessageModal(
                      MessageTypes.DANGEROUS_DECISION,
                      'Confirm Action',
                      'The team member details will be permanently deleted.',
                      () => {
                        handleDelete(selectedMember.id)
                      },
                      {
                        buttonText: 'Delete',
                        altButtonText: 'Cancel',
                        onReject: handleProceed
                      }
                    )
                  }}
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
    </Flex>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10
  },
  searchContainer: {
    marginVertical: 10
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  searchIcon: {
    marginRight: 5
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    width: 220
  },
  listContainer: {
    padding: 10
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1
  },
  icon: {
    marginRight: 20
  },
  listItemContent: {
    flex: 1
  },
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  listItemRole: {
    fontSize: 14,
    fontStyle: 'italic'
  },
  contactDetails: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  listItemPhone: {
    fontSize: 14
  },
  listItemEmail: {
    fontSize: 14
  },
  addNewButton: {
    marginTop: 10,
    borderRadius: 10
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
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10, // Ensures the entire area around the icon is clickable
    zIndex: 1 // Ensures it's on top of other elements
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    padding: 10,
    marginVertical: 8
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
    marginLeft: 5,
    backgroundColor: 'deepskyblue'
  }
})
