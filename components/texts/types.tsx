import { ReactNode } from 'react'
import { StyleProp, TextStyle } from 'react-native'
export type StyledTextProps = {
  children: ReactNode
  small?: boolean
  big?: boolean
  bold?: boolean
  style?: StyleProp<TextStyle>
}
