import { StyleConstants } from '@utils/styles/constants'
import React, { createRef, useEffect } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import AccountInformationAccount from './Information/Account'
import AccountInformationActions from './Information/Actions'
import AccountInformationAvatar from './Information/Avatar'
import AccountInformationCreated from './Information/Created'
import AccountInformationFields from './Information/Fields'
import AccountInformationName from './Information/Name'
import AccountInformationNotes from './Information/Notes'
import AccountInformationStats from './Information/Stats'
import AccountInformationSwitch from './Information/Switch'

export interface Props {
  account: Mastodon.Account | undefined
  ownAccount?: boolean
}

const AccountInformation: React.FC<Props> = ({
  account,
  ownAccount = false
}) => {
  const shimmerNameRef = createRef<any>()
  const shimmerAccountRef = createRef<any>()
  const shimmerCreatedRef = createRef<any>()
  const shimmerStatsRef = createRef<any>()
  useEffect(() => {
    const informationAnimated = Animated.stagger(400, [
      Animated.parallel([
        shimmerNameRef.current?.getAnimated(),
        shimmerAccountRef.current?.getAnimated(),
        shimmerCreatedRef.current?.getAnimated(),
        shimmerStatsRef.current?.ref1.getAnimated(),
        shimmerStatsRef.current?.ref2.getAnimated(),
        shimmerStatsRef.current?.ref3.getAnimated()
      ])
    ])
    Animated.loop(informationAnimated).start()
  }, [])

  return (
    <View style={styles.base}>
      {/* <Text>Moved or not: {account.moved}</Text> */}
      <View style={styles.avatarAndActions}>
        <AccountInformationAvatar account={account} />
        <View style={styles.actions}>
          {ownAccount ? (
            <AccountInformationSwitch />
          ) : (
            <AccountInformationActions account={account} />
          )}
        </View>
      </View>

      <AccountInformationName ref={shimmerNameRef} account={account} />

      <AccountInformationAccount
        ref={shimmerAccountRef}
        account={account}
        ownAccount={ownAccount}
      />

      {!ownAccount ? (
        <>
          {account?.fields && account.fields.length > 0 ? (
            <AccountInformationFields account={account} />
          ) : null}
          {account?.note &&
          account.note.length > 0 &&
          account.note !== '<p></p>' ? (
            // Empty notes might generate empty p tag
            <AccountInformationNotes account={account} />
          ) : null}
          <AccountInformationCreated
            ref={shimmerCreatedRef}
            account={account}
          />
        </>
      ) : null}

      <AccountInformationStats ref={shimmerStatsRef} account={account} />
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    marginTop: -StyleConstants.Spacing.Global.PagePadding * 3,
    padding: StyleConstants.Spacing.Global.PagePadding
  },
  avatarAndActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actions: {
    alignSelf: 'flex-end',
    flexDirection: 'row'
  }
})

export default React.memo(
  AccountInformation,
  (_, next) => next.account === undefined
)
