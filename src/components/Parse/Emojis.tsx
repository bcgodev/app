import { StyleConstants } from '@utils/styles/constants'
import { useTheme } from '@utils/styles/ThemeManager'
import React, { useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'
import FastImage from 'react-native-fast-image'

const regexEmoji = new RegExp(/(:[A-Za-z0-9_]+:)/)

export interface Props {
  content: string
  emojis?: Mastodon.Emoji[]
  size?: 'S' | 'M' | 'L'
  fontBold?: boolean
}

const ParseEmojis = React.memo(
  ({ content, emojis, size = 'M', fontBold = false }: Props) => {
    const { mode, theme } = useTheme()
    const styles = useMemo(() => {
      return StyleSheet.create({
        text: {
          color: theme.primary,
          ...StyleConstants.FontStyle[size],
          ...(fontBold && { fontWeight: StyleConstants.Font.Weight.Bold })
        },
        image: {
          width: StyleConstants.Font.Size[size],
          height: StyleConstants.Font.Size[size],
          transform: [{ translateY: size === 'L' ? -3 : -1 }]
        }
      })
    }, [mode])

    return (
      <Text style={styles.text}>
        {emojis ? (
          content
            .split(regexEmoji)
            .filter(f => f)
            .map((str, i) => {
              if (str.match(regexEmoji)) {
                const emojiShortcode = str.split(regexEmoji)[1]
                const emojiIndex = emojis.findIndex(emoji => {
                  return emojiShortcode === `:${emoji.shortcode}:`
                })
                return emojiIndex === -1 ? (
                  <Text key={i}>{emojiShortcode}</Text>
                ) : (
                  <Text key={i}>
                    {/* When emoji starts a paragraph, lineHeight will break */}
                    {i === 0 ? <Text> </Text> : null}
                    <FastImage
                      source={{ uri: emojis[emojiIndex].url }}
                      style={styles.image}
                    />
                  </Text>
                )
              } else {
                return <Text key={i}>{str}</Text>
              }
            })
        ) : (
          <Text>{content}</Text>
        )}
      </Text>
    )
  },
  (prev, next) => prev.content === next.content
)

export default ParseEmojis
