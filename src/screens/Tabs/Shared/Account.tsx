import analytics from '@components/analytics'
import { HeaderRight } from '@components/Header'
import Timeline from '@components/Timeline'
import TimelineDefault from '@components/Timeline/Default'
import SegmentedControl from '@react-native-community/segmented-control'
import { TabSharedStackScreenProps } from '@utils/navigation/navigators'
import { useAccountQuery } from '@utils/queryHooks/account'
import { QueryKeyTimeline } from '@utils/queryHooks/timeline'
import { StyleConstants } from '@utils/styles/constants'
import { useTheme } from '@utils/styles/ThemeManager'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useIsFetching } from 'react-query'
import AccountAttachments from './Account/Attachments'
import AccountHeader from './Account/Header'
import AccountInformation from './Account/Information'
import AccountNav from './Account/Nav'

const TabSharedAccount: React.FC<TabSharedStackScreenProps<
  'Tab-Shared-Account'
>> = ({
  route: {
    params: { account }
  },
  navigation
}) => {
  const { t, i18n } = useTranslation('screenTabs')
  const { mode, theme } = useTheme()

  const { data } = useAccountQuery({ id: account.id })

  const scrollY = useSharedValue(0)

  useEffect(() => {
    const updateHeaderRight = () =>
      navigation.setOptions({
        headerRight: () => (
          <HeaderRight
            accessibilityLabel={t('shared.account.actions.accessibilityLabel', {
              user: data?.acct
            })}
            accessibilityHint={t('shared.account.actions.accessibilityHint')}
            content='MoreHorizontal'
            onPress={() => {
              analytics('bottomsheet_open_press', {
                page: 'account'
              })
              // @ts-ignore
              navigation.navigate('Screen-Actions', {
                type: 'account',
                account
              })
            }}
            background
          />
        )
      })
    return updateHeaderRight()
  }, [i18n.language])

  const onScroll = useCallback(({ nativeEvent }) => {
    scrollY.value = nativeEvent.contentOffset.y
  }, [])

  const [queryKey, setQueryKey] = useState<QueryKeyTimeline>([
    'Timeline',
    { page: 'Account_Default', account: account.id }
  ])
  const renderItem = useCallback(
    ({ item }) => <TimelineDefault item={item} queryKey={queryKey} />,
    []
  )
  const isFetchingTimeline = useIsFetching(queryKey)
  const fetchedTimeline = useRef(false)
  useEffect(() => {
    if (!isFetchingTimeline && !fetchedTimeline.current) {
      fetchedTimeline.current = true
    }
  }, [isFetchingTimeline, fetchedTimeline.current])

  const ListHeaderComponent = useMemo(() => {
    return (
      <>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <AccountHeader account={data} />
          <AccountInformation account={data} />
          {fetchedTimeline.current ? (
            <AccountAttachments account={data} />
          ) : null}
        </View>
        <SegmentedControl
          appearance={mode}
          values={[
            t('shared.account.toots.default'),
            t('shared.account.toots.all')
          ]}
          selectedIndex={queryKey[1].page === 'Account_Default' ? 0 : 1}
          onChange={({ nativeEvent }) => {
            switch (nativeEvent.selectedSegmentIndex) {
              case 0:
                setQueryKey([
                  queryKey[0],
                  { ...queryKey[1], page: 'Account_Default' }
                ])
                break
              case 1:
                setQueryKey([
                  queryKey[0],
                  { ...queryKey[1], page: 'Account_All' }
                ])
                break
            }
          }}
          style={styles.segmentsContainer}
        />
      </>
    )
  }, [data, fetchedTimeline.current, queryKey[1].page, i18n.language, mode])

  return (
    <>
      <AccountNav scrollY={scrollY} account={data} />

      <Timeline
        queryKey={queryKey}
        disableRefresh
        customProps={{
          renderItem,
          onScroll,
          ListHeaderComponent
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1
  },
  segmentsContainer: {
    marginTop: StyleConstants.Spacing.M,
    marginHorizontal: StyleConstants.Spacing.Global.PagePadding
  }
})

export default TabSharedAccount
