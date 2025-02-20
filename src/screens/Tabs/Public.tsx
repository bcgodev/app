import analytics from '@components/analytics'
import { HeaderRight } from '@components/Header'
import Timeline from '@components/Timeline'
import TimelineDefault from '@components/Timeline/Default'
import SegmentedControl from '@react-native-community/segmented-control'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  ScreenTabsScreenProps,
  TabPublicStackParamList
} from '@utils/navigation/navigators'
import { QueryKeyTimeline } from '@utils/queryHooks/timeline'
import { useTheme } from '@utils/styles/ThemeManager'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, StyleSheet } from 'react-native'
import { TabView } from 'react-native-tab-view'
import TabSharedRoot from './Shared/Root'

const Stack = createNativeStackNavigator<TabPublicStackParamList>()

const TabPublic = React.memo(
  ({ navigation }: ScreenTabsScreenProps<'Tab-Public'>) => {
    const { t, i18n } = useTranslation('screenTabs')
    const { mode } = useTheme()

    const [segment, setSegment] = useState(0)
    const pages: {
      title: string
      key: App.Pages
    }[] = [
      {
        title: t('tabs.public.segments.left'),
        key: 'LocalPublic'
      },
      {
        title: t('tabs.public.segments.right'),
        key: 'Local'
      }
    ]
    const screenOptionsRoot = useMemo(
      () => ({
        headerTitle: () => (
          <SegmentedControl
            appearance={mode}
            values={pages.map(p => p.title)}
            selectedIndex={segment}
            onChange={({ nativeEvent }) =>
              setSegment(nativeEvent.selectedSegmentIndex)
            }
            style={styles.segmentsContainer}
          />
        ),
        headerRight: () => (
          <HeaderRight
            accessibilityLabel={t('common.search.accessibilityLabel')}
            accessibilityHint={t('common.search.accessibilityHint')}
            content='Search'
            onPress={() => {
              analytics('search_tap', { page: pages[segment].key })
              navigation.navigate('Tab-Public', {
                screen: 'Tab-Shared-Search',
                params: { text: undefined }
              })
            }}
          />
        )
      }),
      [mode, segment, i18n.language]
    )

    const routes = pages.map(p => ({ key: p.key }))

    const renderScene = useCallback(
      ({
        route: { key: page }
      }: {
        route: {
          key: App.Pages
        }
      }) => {
        const queryKey: QueryKeyTimeline = ['Timeline', { page }]
        const renderItem = ({ item }: any) => (
          <TimelineDefault item={item} queryKey={queryKey} />
        )
        return <Timeline queryKey={queryKey} customProps={{ renderItem }} />
      },
      []
    )
    const children = useCallback(
      () => (
        // @ts-ignore
        <TabView
          lazy
          swipeEnabled
          renderScene={renderScene}
          renderTabBar={() => null}
          onIndexChange={index => setSegment(index)}
          navigationState={{ index: segment, routes }}
          initialLayout={{ width: Dimensions.get('screen').width }}
        />
      ),
      [segment]
    )

    return (
      <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen
          name='Tab-Public-Root'
          options={screenOptionsRoot}
          children={children}
        />
        {TabSharedRoot({ Stack })}
      </Stack.Navigator>
    )
  },
  () => true
)

const styles = StyleSheet.create({
  segmentsContainer: {
    flexBasis: '65%'
  }
})

export default TabPublic
