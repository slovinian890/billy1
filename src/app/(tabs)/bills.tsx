import { useCallback, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";

import { EyebrowTitle } from "@/components/EyebrowTitle";
import { ItemRow } from "@/components/ItemRow";
import { BillHeaderCard } from "@/features/bill/BillHeaderCard";
import { ItemSheet, type ItemSheetHandle } from "@/features/bill/ItemSheet";
import { RunningTabBar } from "@/features/bill/RunningTabBar";
import { claimedCount, claimedPeopleForItem, computeBillTotals, splitItems } from "@/features/bill/selectors";
import { YourTotalSheet, type YourTotalSheetHandle } from "@/features/bill/YourTotalSheet";
import { YOU_PARTICIPANT_ID } from "@/lib/mock/fridayDinner";
import { useBillStore } from "@/store/billStore";
import { colors, fonts, spacing } from "@/theme/tokens";

export default function ActiveBillScreen() {
  const bill = useBillStore((s) => s.bill);
  const items = useBillStore((s) => s.items);
  const claims = useBillStore((s) => s.claims);
  const participants = useBillStore((s) => s.participants);

  const itemSheetRef = useRef<ItemSheetHandle>(null);
  const yourTotalSheetRef = useRef<YourTotalSheetHandle>(null);
  const [barHeight, setBarHeight] = useState(140);

  const dateLabel = useMemo(
    () => new Date(`${bill.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    [bill.date]
  );

  const { unclaimed, claimed } = useMemo(() => splitItems(items, claims), [items, claims]);
  const progress = useMemo(() => claimedCount(items, claims), [items, claims]);
  const totals = useMemo(() => computeBillTotals(bill, claims, participants), [bill, claims, participants]);
  const myTotalCents = totals[YOU_PARTICIPANT_ID]?.totalCents ?? 0;

  const openItem = useCallback((itemId: string) => itemSheetRef.current?.open(itemId), []);
  const handleBarLayout = useCallback((event: LayoutChangeEvent) => {
    setBarHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: barHeight + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <EyebrowTitle
          eyebrow={`ACTIVE BILL · ${dateLabel.toUpperCase()}`}
          title={bill.title}
          style={styles.header}
        />

        <BillHeaderCard
          venue={bill.venue}
          totalCents={bill.receiptTotalCents}
          currency={bill.currency}
          claimed={progress.claimed}
          total={progress.total}
        />

        <Text style={styles.sectionTitle}>Still on the table</Text>
        {unclaimed.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Everything's claimed 🎉</Text>
          </View>
        ) : (
          unclaimed.map((item) => (
            <Animated.View key={item.id} layout={LinearTransition.springify()} exiting={FadeOutUp.duration(220)}>
              <ItemRow
                emoji={item.emoji}
                name={item.name}
                priceCents={item.priceCents}
                currency={bill.currency}
                claimedBy={[]}
                onPress={() => openItem(item.id)}
              />
            </Animated.View>
          ))
        )}

        <Text style={[styles.sectionTitle, styles.claimedTitle]}>Claimed</Text>
        {claimed.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Nothing claimed yet — tap an item above.</Text>
          </View>
        ) : (
          claimed.map((item) => (
            <Animated.View
              key={item.id}
              layout={LinearTransition.springify()}
              entering={FadeInDown.springify().damping(16)}
            >
              <ItemRow
                emoji={item.emoji}
                name={item.name}
                priceCents={item.priceCents}
                currency={bill.currency}
                claimedBy={claimedPeopleForItem(claims, participants, item.id)}
                onPress={() => openItem(item.id)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>

      <View style={styles.stickyBar} onLayout={handleBarLayout}>
        <RunningTabBar
          totalCents={myTotalCents}
          currency={bill.currency}
          onDone={() => yourTotalSheetRef.current?.open()}
        />
      </View>

      <ItemSheet ref={itemSheetRef} />
      <YourTotalSheet ref={yourTotalSheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  claimedTitle: {
    marginTop: spacing.lg,
  },
  emptySection: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
