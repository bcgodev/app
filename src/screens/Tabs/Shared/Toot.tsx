import Timeline from '@components/Timeline'
import TimelineDefault from '@components/Timeline/Default'
import { useNavigation } from '@react-navigation/native'
import { TabSharedStackScreenProps } from '@utils/navigation/navigators'
import { QueryKeyTimeline } from '@utils/queryHooks/timeline'
import { findIndex } from 'lodash'
import React, { useCallback, useEffect, useRef } from 'react'
import { FlatList } from 'react-native'
import { InfiniteQueryObserver, useQueryClient } from 'react-query'

const TabSharedToot: React.FC<TabSharedStackScreenProps<'Tab-Shared-Toot'>> = ({
  route: {
    params: { toot, rootQueryKey }
  }
}) => {
  const queryKey: QueryKeyTimeline = [
    'Timeline',
    { page: 'Toot', toot: toot.id }
  ]

  const flRef = useRef<FlatList>(null)

  const scrolled = useRef(false)
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const observer = new InfiniteQueryObserver(queryClient, { queryKey })
  useEffect(() => {
    const unsubscribe = observer.subscribe(result => {
      if (result.isSuccess) {
        const flattenData = result.data?.pages
          ? // @ts-ignore
            result.data.pages.flatMap(d => [...d.body])
          : []
        // Auto go back when toot page is empty
        if (flattenData.length === 0) {
          navigation.goBack()
        }
        if (!scrolled.current) {
          scrolled.current = true
          const pointer = findIndex(flattenData, ['id', toot.id])
          setTimeout(() => {
            flRef.current?.scrollToIndex({
              index: pointer === -1 ? 0 : pointer,
              viewOffset: 100
            })
          }, 500)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // Toot page auto scroll to selected toot
  const onScrollToIndexFailed = useCallback(error => {
    const offset = error.averageItemLength * error.index
    flRef.current?.scrollToOffset({ offset })
    setTimeout(
      () =>
        flRef.current?.scrollToIndex({ index: error.index, viewOffset: 100 }),
      350
    )
  }, [])

  const renderItem = useCallback(
    ({ item }) => (
      <TimelineDefault
        item={item}
        queryKey={queryKey}
        rootQueryKey={rootQueryKey}
        highlighted={toot.id === item.id}
      />
    ),
    []
  )

  return (
    <Timeline
      flRef={flRef}
      queryKey={queryKey}
      customProps={{ renderItem, onScrollToIndexFailed }}
      disableRefresh
      disableInfinity
    />
  )
}

export default TabSharedToot
