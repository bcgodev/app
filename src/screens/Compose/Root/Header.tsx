import {
  getLocalActiveIndex,
  getLocalInstances
} from '@utils/slices/instancesSlice'
import { StyleConstants } from '@utils/styles/constants'
import React, { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import ComposeContext from '../utils/createContext'
import ComposePostingAs from './Header/PostingAs'
import ComposeSpoilerInput from './Header/SpoilerInput'
import ComposeTextInput from './Header/TextInput'

const ComposeRootHeader: React.FC = () => {
  const { composeState } = useContext(ComposeContext)
  const localActiveIndex = useSelector(getLocalActiveIndex)
  const localInstances = useSelector(getLocalInstances)

  return (
    <>
      {localActiveIndex !== null &&
        localInstances.length &&
        localInstances.length > 1 && (
          <View style={styles.postingAs}>
            <ComposePostingAs />
          </View>
        )}
      {composeState.spoiler.active ? <ComposeSpoilerInput /> : null}
      <ComposeTextInput />
    </>
  )
}

const styles = StyleSheet.create({
  postingAs: {
    marginHorizontal: StyleConstants.Spacing.Global.PagePadding,
    marginTop: StyleConstants.Spacing.S
  }
})

export default ComposeRootHeader
