import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import type { FeedPost } from "@/lib/social";
import { timeAgo } from "@/lib/timeAgo";
import { avatarColorForId, colors, fonts, radii, spacing } from "@/theme/tokens";

interface PostCardProps {
  post: FeedPost;
  taggedNames: string[];
  onToggleLike: () => void;
  onOpenComments: () => void;
  /** Only passed for the signed-in user's own posts — shows a delete button. */
  onDelete?: () => void;
}

export function PostCard({ post, taggedNames, onToggleLike, onOpenComments, onDelete }: PostCardProps) {
  return (
    <Card variant="white" style={styles.card}>
      <View style={styles.header}>
        <Avatar
          name={post.author.name}
          color={avatarColorForId(post.author.id)}
          imageUrl={post.author.avatarUrl}
          size={36}
        />
        <View style={styles.headerText}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.author.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            @{post.author.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
        {onDelete && (
          <Pressable
            onPress={onDelete}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete post"
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.photoWrap}>
        <Image source={{ uri: post.photoUrl }} style={styles.photo} contentFit="cover" />
        {post.amountCents != null && (
          <View style={styles.flexBadge}>
            <MoneyText cents={post.amountCents} size={15} color={colors.white} emphasis />
            {post.venue ? <Text style={styles.flexVenue}> · {post.venue}</Text> : null}
          </View>
        )}
      </View>

      {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

      {taggedNames.length > 0 && (
        <Text style={styles.tagged}>with {taggedNames.join(", ")}</Text>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onToggleLike} style={styles.actionButton} accessibilityRole="button">
          <Ionicons
            name={post.likedByMe ? "heart" : "heart-outline"}
            size={22}
            color={post.likedByMe ? colors.bordo : colors.textSecondary}
          />
          <Text style={styles.actionLabel}>{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={onOpenComments} style={styles.actionButton} accessibilityRole="button">
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>{post.commentCount}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  authorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14.5,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  photoWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    aspectRatio: 1,
    backgroundColor: colors.softPanel,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  flexBadge: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18,14,13,0.72)",
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  flexVenue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textPrimary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  tagged: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
