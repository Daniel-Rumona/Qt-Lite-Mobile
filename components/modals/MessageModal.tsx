import React, { useContext } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import StyledText from '../texts/StyledText'
import StyledButton from '../buttons/StyledButton'
import {
  MessageTypes,
  MessageIconNameType,
  MessageThemeColorType,
  MessageModalProps
} from './types'
import { ThemeContext } from '@/context/ThemeContext'
import { colors } from '@/config/theme'
import { Platform } from 'react-native'

const MessageModal = ({
  messageModalVisible,
  messageType,
  headerText,
  messageText,
  buttonText,
  altButtonText,
  onDismiss,
  onProceed,
  onReject = () => {},
  isLoading,
  isProceeding,
  isRejecting
}: MessageModalProps) => {
  const { theme } = useContext(ThemeContext) // Access theme context
  const activeColors = colors[theme.mode] // Get current theme colors
  let messageIconName: MessageIconNameType,
    messageThemeColor: MessageThemeColorType = ''

  switch (messageType) {
    case MessageTypes.FAIL:
      messageIconName = 'close'
      messageThemeColor = activeColors.redAccent[200]
      break
    case MessageTypes.SUCCESS:
      messageIconName = 'check'
      messageThemeColor = activeColors.greenAccent[200]
      break
    case MessageTypes.WARNING:
      messageIconName = 'alert-circle-outline'
      messageThemeColor = activeColors.redAccent[500]
      break
    case MessageTypes.DECISION:
      messageIconName = 'alert-circle-check-outline'
      messageThemeColor = activeColors.grey[200]
      break
    case MessageTypes.DANGEROUS_DECISION:
      messageIconName = 'alert-circle-check-outline'
      messageThemeColor = activeColors.redAccent[200]
      break

    default:
      messageIconName = 'information'
      messageThemeColor = activeColors.blueAccent[200]
      break
  }

  return (
    <Modal
      animationType='slide'
      visible={messageModalVisible}
      transparent={true}
    >
      <Pressable onPress={onDismiss} style={styles.container}>
        {isLoading && <ActivityIndicator size={70} color={'#fff'} />}
        {!isLoading && (
          <View style={[styles.modalView]}>
            <View
              style={[styles.modalIcon, { backgroundColor: messageThemeColor }]}
            >
              <MaterialCommunityIcons
                name={messageIconName}
                size={75}
                color='#fff'
              />
            </View>
            <View style={styles.modalContent}>
              <StyledText bold big style={styles.headerText}>
                {headerText || `HEADER`}
              </StyledText>
              <StyledText style={styles.messageText}>
                {messageText || `MESSAGE`}
              </StyledText>
              {messageType === MessageTypes.DECISION ||
              messageType === MessageTypes.DANGEROUS_DECISION ? (
                <View style={styles.decisionRow}>
                  <StyledButton
                    style={[
                      styles.decisionButton
                      // { backgroundColor: "crimson" }
                    ]}
                    onPress={onReject}
                    isLoading={isRejecting}
                  >
                    {altButtonText || (
                      <>
                        NO <MaterialCommunityIcons name='close' size={16} />
                      </>
                    )}
                  </StyledButton>
                  <StyledButton
                    style={[
                      styles.decisionButton,
                      { backgroundColor: messageThemeColor }
                    ]}
                    onPress={onProceed}
                    isLoading={isProceeding}
                  >
                    {buttonText || (
                      <>
                        YES <MaterialCommunityIcons name='check' size={16} />
                      </>
                    )}
                  </StyledButton>
                </View>
              ) : (
                <StyledButton
                  style={{ backgroundColor: messageThemeColor }}
                  onPress={onProceed}
                  isLoading={isProceeding}
                >
                  {buttonText || `OKAY`}
                  <MaterialCommunityIcons name='close' size={16} />
                </StyledButton>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7'
  },
  modalView: {
    backgroundColor: '#fff',
    width: '100%',
    alignItems: 'center',
    paddingTop: 45,
    borderRadius: 15
  },
  modalIcon: {
    backgroundColor: '#000',
    height: 100,
    width: 100,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -50
  },
  modalContent: { width: '100%', alignItems: 'center', padding: 20 },
  headerText: { textAlign: 'center', marginBottom: 10 },
  messageText: { textAlign: 'center', marginBottom: 20 },
  decisionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around'
  },
  decisionButton: { width: 'auto' }
})

export default MessageModal
