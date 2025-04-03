import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native'
import { db, auth } from '@/FirebaseConfig'
import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { deleteUser, onAuthStateChanged } from 'firebase/auth'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import Animated from 'react-native-reanimated'
import MessageModal from '@/components/modals/MessageModal'
import { MessageTypes } from '@/components/modals/types'
import { useMessageModal } from '@/hooks'

interface User {
  fullName: string
  userRole: string
  businessName: string
  email: string
  location: string
  workers: number
  businessSector: string
  currency: string
}

const Profile: React.FC = () => {
  const { theme } = useContext(ThemeContext) // Access theme and updater from ThemeContext
  const activeColors = colors[theme.mode] // Get active colors from theme
  const { messageModalState, showMessageModal, hideMessageModal } =
    useMessageModal()
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [teamMemberCount, setTeamMemberCount] = useState<number>(0)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async authUser => {
      if (authUser) {
        setCurrentUser(authUser)
        const userId = authUser.uid

        try {
          // Fetch the user's details from Firestore
          const userDocRef = doc(db, 'Users', userId)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data() as User
            setUserDetails(userData)

            // Fetch the number of team members in the team_members collection
            const teamMembersRef = collection(
              db,
              `system_users/${userId}/team_members`
            )
            const teamMembersSnapshot = await getDocs(teamMembersRef)
            setTeamMemberCount(teamMembersSnapshot.size)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    })

    // Cleanup on component unmount
    return () => unsubscribeAuth()
  }, [])

  const handleDeleteAccount = async () => {
    showMessageModal(
      MessageTypes.DANGEROUS_DECISION,
      'Account Deletion',
      'You are about to delete your account. This is irreversible. Do you wish to continue?',
      deleteAccount,
      {
        onReject: hideMessageModal,
        buttonText: 'Proceed',
        altButtonText: 'Cancel'
      }
    )
  }

  const deleteAccount = async () => {
    if (!currentUser) return

    try {
      setLoading(true)

      // Delete user data from Firestore
      const userDocRef = doc(db, 'system_users', currentUser.uid)
      await deleteDoc(userDocRef)

      // Delete Firebase authentication account
      await deleteUser(currentUser)
      showMessageModal(
        MessageTypes.SUCCESS,
        'Account Deleted',
        'Your account has been deleted successfully.',
        hideMessageModal
      )
    } catch (error) {
      showMessageModal(
        MessageTypes.FAIL,
        'Delete Error',
        'Failed to delete account.',
        hideMessageModal
      )
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View
        style={[styles.loader, { backgroundColor: activeColors.primary[200] }]}
      >
        <ActivityIndicator size='large' color='#4CAF50' />
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: activeColors.primary[200] }]}
    >
      <View>
        <View style={styles.glassCard}>
          {userDetails ? (
            <>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.text}>
                Business Sector: {userDetails.businessSector}
              </Text>
              <Text style={styles.text}>
                Business Name: {userDetails.businessName}
              </Text>
              <Text style={styles.text}>Name: {userDetails.fullName}</Text>
              <Text style={styles.text}>User Role: {userDetails.userRole}</Text>
              <Text style={styles.text}>Email: {userDetails.email}</Text>
              <Text style={styles.text}>Location: {userDetails.location}</Text>
              <Text style={styles.text}>Team Members: {teamMemberCount}</Text>
              <Text style={styles.text}>Currency: {userDetails.currency}</Text>

              {/* Delete Account Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.text}>No User Data Found</Text>
          )}
        </View>
        <MessageModal {...messageModalState} />
      </View>
    </View>
  )
}

export default Profile
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
    flex: 1
  },
  glassCard: {
    width: 300,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#000',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center'
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButton: {
    backgroundColor: '#FF4C4C',
    padding: 10,
    marginTop: 20,
    borderRadius: 5,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
