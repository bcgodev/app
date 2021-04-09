import analytics from '@components/analytics'
import haptics from '@components/haptics'
import { HeaderCenter, HeaderLeft, HeaderRight } from '@components/Header'
import { useActionSheet } from '@expo/react-native-action-sheet'
import CameraRoll from '@react-native-community/cameraroll'
import { StackScreenProps } from '@react-navigation/stack'
import { findIndex } from 'lodash'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PermissionsAndroid,
  Platform,
  Share,
  StatusBar,
  View
} from 'react-native'
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context'
import ImageViewer from './ImageViewer/Root'

const saveImage = async (
  image: Nav.RootStackParamList['Screen-ImagesViewer']['imageUrls'][0]
) => {
  if (Platform.OS === 'ios') {
    CameraRoll.save(image.url)
      .then(() => haptics('Success'))
      .catch(() => {
        if (image.remote_url) {
          CameraRoll.save(image.remote_url)
            .then(() => haptics('Success'))
            .catch(() => haptics('Error'))
        } else {
          haptics('Error')
        }
      })
  } else if (Platform.OS === 'android') {
    const hasAndroidPermission = async () => {
      const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE

      const hasPermission = await PermissionsAndroid.check(permission)
      if (hasPermission) {
        return true
      }

      const status = await PermissionsAndroid.request(permission)
      return status === 'granted'
    }

    if (!(await hasAndroidPermission())) {
      return
    }
  }
}

const HeaderComponent = React.memo(
  ({
    navigation,
    currentIndex,
    imageUrls
  }: {
    navigation: ScreenImagesViewerProp['navigation']
    currentIndex: number
    imageUrls: Nav.RootStackParamList['Screen-ImagesViewer']['imageUrls']
  }) => {
    const insets = useSafeAreaInsets()
    const { t } = useTranslation('screenImageViewer')
    const { showActionSheetWithOptions } = useActionSheet()

    const onPress = useCallback(() => {
      analytics('imageviewer_more_press')
      showActionSheetWithOptions(
        {
          options: [
            t('content.options.save'),
            t('content.options.share'),
            t('content.options.cancel')
          ],
          cancelButtonIndex: 2
        },
        async buttonIndex => {
          switch (buttonIndex) {
            case 0:
              analytics('imageviewer_more_save_press')
              saveImage(imageUrls[currentIndex])
              break
            case 1:
              analytics('imageviewer_more_share_press')
              switch (Platform.OS) {
                case 'ios':
                  Share.share({ url: imageUrls[currentIndex].url })
                case 'android':
                  Share.share({ message: imageUrls[currentIndex].url })
              }
              break
          }
        }
      )
    }, [currentIndex])

    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: insets.top
        }}
      >
        <HeaderLeft
          content='X'
          native={false}
          background
          onPress={() => navigation.goBack()}
        />
        <HeaderCenter
          inverted
          content={`${currentIndex + 1} / ${imageUrls.length}`}
        />
        <HeaderRight
          accessibilityLabel={t('content.actions.accessibilityLabel')}
          accessibilityHint={t('content.actions.accessibilityHint')}
          content='MoreHorizontal'
          native={false}
          background
          onPress={onPress}
        />
      </View>
    )
  },
  (prev, next) => prev.currentIndex === next.currentIndex
)

export type ScreenImagesViewerProp = StackScreenProps<
  Nav.RootStackParamList,
  'Screen-ImagesViewer'
>

const ScreenImagesViewer = ({
  route: {
    params: { imageUrls, id }
  },
  navigation
}: ScreenImagesViewerProp) => {
  if (imageUrls.length === 0) {
    return null
  }

  const initialIndex = findIndex(imageUrls, ['id', id])
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor='rgb(0,0,0)' />
      <ImageViewer
        images={imageUrls}
        imageIndex={initialIndex}
        onImageIndexChange={index => setCurrentIndex(index)}
        onRequestClose={() => navigation.goBack()}
        onLongPress={saveImage}
        HeaderComponent={() => (
          <HeaderComponent
            navigation={navigation}
            currentIndex={currentIndex}
            imageUrls={imageUrls}
          />
        )}
      />
    </SafeAreaProvider>
  )
}

export default ScreenImagesViewer
