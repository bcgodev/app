import { HeaderLeft, HeaderRight } from '@components/Header'
import { toast } from '@root/components/toast'
import { store } from '@root/store'
import layoutAnimation from '@root/utils/styles/layoutAnimation'
import formatText from '@screens/Shared/Compose/formatText'
import ComposeRoot from '@screens/Shared/Compose/Root'
import { getLocalAccountPreferences } from '@utils/slices/instancesSlice'
import { StyleConstants } from '@utils/styles/constants'
import { useTheme } from '@utils/styles/ThemeManager'
import React, {
  createContext,
  Dispatch,
  useCallback,
  useEffect,
  useReducer,
  useState
} from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { useQueryClient } from 'react-query'
import ComposeEditAttachment from './Compose/EditAttachment'
import ComposeEditAttachmentRoot from './Compose/EditAttachment/Root'
import composeInitialState from './Compose/utils/initialState'
import composeParseState from './Compose/utils/parseState'
import composeSend from './Compose/utils/post'
import composeReducer from './Compose/utils/reducer'
import { ComposeAction, ComposeState } from './Compose/utils/types'

const Stack = createNativeStackNavigator()

type ContextType = {
  composeState: ComposeState
  composeDispatch: Dispatch<ComposeAction>
}
export const ComposeContext = createContext<ContextType>({} as ContextType)

export interface Props {
  route: {
    params:
      | {
          type?: 'reply' | 'conversation' | 'edit'
          incomingStatus: Mastodon.Status
          visibilityLock?: boolean
        }
      | undefined
  }
  navigation: any
}

const Compose: React.FC<Props> = ({ route: { params }, navigation }) => {
  const { theme } = useTheme()
  const queryClient = useQueryClient()

  const [hasKeyboard, setHasKeyboard] = useState(false)
  useEffect(() => {
    Keyboard.addListener('keyboardWillShow', _keyboardDidShow)
    Keyboard.addListener('keyboardWillHide', _keyboardDidHide)

    // cleanup function
    return () => {
      Keyboard.removeListener('keyboardWillShow', _keyboardDidShow)
      Keyboard.removeListener('keyboardWillHide', _keyboardDidHide)
    }
  }, [])
  const _keyboardDidShow = () => {
    setHasKeyboard(true)
  }
  const _keyboardDidHide = () => {
    setHasKeyboard(false)
  }

  const [composeState, composeDispatch] = useReducer(
    composeReducer,
    params?.type && params?.incomingStatus
      ? composeParseState({
          type: params.type,
          incomingStatus: params.incomingStatus,
          visibilityLock: params.visibilityLock
        })
      : {
          ...composeInitialState,
          visibility: getLocalAccountPreferences(store.getState())[
            'posting:default:visibility'
          ] as ComposeState['visibility']
        }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    switch (params?.type) {
      case 'edit':
        if (params.incomingStatus.spoiler_text) {
          formatText({
            textInput: 'spoiler',
            composeDispatch,
            content: params.incomingStatus.spoiler_text,
            disableDebounce: true
          })
        }
        formatText({
          textInput: 'text',
          composeDispatch,
          content: params.incomingStatus.text!,
          disableDebounce: true
        })
        break
      case 'reply':
        const actualStatus =
          params.incomingStatus.reblog || params.incomingStatus
        const allMentions = actualStatus.mentions.map(
          mention => `@${mention.acct}`
        )
        let replyPlaceholder = allMentions.join(' ')
        if (replyPlaceholder.length === 0) {
          replyPlaceholder = `@${actualStatus.account.acct} `
        } else {
          replyPlaceholder = replyPlaceholder + ' '
        }
        formatText({
          textInput: 'text',
          composeDispatch,
          content: replyPlaceholder,
          disableDebounce: true
        })
        break
      case 'conversation':
        formatText({
          textInput: 'text',
          composeDispatch,
          content: `@${params.incomingStatus.account.acct} `,
          disableDebounce: true
        })
        break
    }
  }, [params?.type])

  const totalTextCount =
    (composeState.spoiler.active ? composeState.spoiler.count : 0) +
    composeState.text.count

  const postButtonText = {
    conversation: '回复私信',
    reply: '发布回复',
    edit: '发嘟嘟'
  }

  const headerLeft = useCallback(
    () => (
      <HeaderLeft
        type='text'
        content='退出编辑'
        onPress={() =>
          Alert.alert('确认取消编辑？', '', [
            {
              text: '退出编辑',
              style: 'destructive',
              onPress: () => navigation.goBack()
            },
            { text: '继续编辑', style: 'cancel' }
          ])
        }
      />
    ),
    []
  )
  const headerCenter = useCallback(
    () => (
      <Text
        style={[
          styles.count,
          {
            color: totalTextCount > 500 ? theme.red : theme.secondary
          }
        ]}
      >
        {totalTextCount} / 500
      </Text>
    ),
    [totalTextCount]
  )
  const headerRight = useCallback(
    () => (
      <HeaderRight
        type='text'
        content={params?.type ? postButtonText[params.type] : '发嘟嘟'}
        onPress={() => {
          layoutAnimation()
          setIsSubmitting(true)
          composeSend(params, composeState)
            .then(() => {
              queryClient.invalidateQueries(['Following'])
              navigation.goBack()
              toast({ type: 'success', content: '发布成功' })
            })
            .catch(() => {
              setIsSubmitting(false)
              Alert.alert('发布失败', '', [
                {
                  text: '返回重试'
                }
              ])
            })
        }}
        loading={isSubmitting}
        disabled={composeState.text.raw.length < 1 || totalTextCount > 500}
      />
    ),
    [isSubmitting, composeState.text.raw, totalTextCount]
  )

  return (
    <KeyboardAvoidingView behavior='padding' style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={hasKeyboard ? ['left', 'right'] : ['left', 'right', 'bottom']}
      >
        <ComposeContext.Provider value={{ composeState, composeDispatch }}>
          <Stack.Navigator>
            <Stack.Screen
              name='Screen-Shared-Compose-Root'
              component={ComposeRoot}
              options={{ headerLeft, headerCenter, headerRight }}
            />
            <Stack.Screen
              name='Screen-Shared-Compose-EditAttachment'
              component={ComposeEditAttachment}
              options={{ stackPresentation: 'modal' }}
            />
          </Stack.Navigator>
        </ComposeContext.Provider>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  count: {
    textAlign: 'center',
    ...StyleConstants.FontStyle.M
  }
})

export default Compose
