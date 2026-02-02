import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Divider,
  HelperText,
  List,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import {
  useCreateChecklistItem,
  useEventAttendance,
  useEventById,
  useEventChecklist,
  useEventRealtime,
  useUpdateArrival,
  useUpdateChecklistItem,
  useUpdateRsvp,
} from '@/features/events/events-queries';
import { useProfilesByIds } from '@/features/profiles/profiles-queries';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

const arrivalLabels = {
  not_sure: 'Not sure',
  on_the_way: 'On the way',
  arrived: 'Arrived',
  late: 'Running late',
} as const;

type ArrivalKey = keyof typeof arrivalLabels;

const checklistIconByState = {
  open: 'checkbox-blank-circle-outline',
  done: 'checkbox-marked-circle-outline',
  blocked: 'alert-circle-outline',
} as const;

const checklistNextState = {
  open: 'done',
  done: 'blocked',
  blocked: 'open',
} as const;

function formatEventTime(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt);
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(start);
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);

  if (!endsAt) {
    return `${dateLabel} · ${timeLabel}`;
  }

  const end = new Date(endsAt);
  const endTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(end);

  return `${dateLabel} · ${timeLabel}–${endTime}`;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const { user, isLoading: authLoading } = useSupabaseSession();

  const eventQuery = useEventById(eventId);
  const attendanceQuery = useEventAttendance(eventId);
  const checklistQuery = useEventChecklist(eventId);
  useEventRealtime(eventId);
  const updateRsvp = useUpdateRsvp();
  const updateArrival = useUpdateArrival();
  const updateChecklistItem = useUpdateChecklistItem();
  const createChecklistItem = useCreateChecklistItem();

  const attendanceUserIds = useMemo(
    () => (attendanceQuery.data ?? []).map((member) => member.user_id),
    [attendanceQuery.data]
  );
  const profilesQuery = useProfilesByIds(attendanceUserIds);
  const profileById = useMemo(
    () => new Map((profilesQuery.data ?? []).map((profile) => [profile.id, profile])),
    [profilesQuery.data]
  );

  const currentAttendance = (attendanceQuery.data ?? []).find((row) => row.user_id === user?.id);
  const [etaInput, setEtaInput] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!currentAttendance) return;
    setEtaInput(currentAttendance.eta_minutes ? String(currentAttendance.eta_minutes) : '');
  }, [currentAttendance?.eta_minutes]);

  const etaMinutes = etaInput.trim() ? Number(etaInput) : null;
  const etaError = etaInput.trim().length > 0 && (Number.isNaN(etaMinutes) || etaMinutes! < 0);

  const isLoading = authLoading || eventQuery.isLoading;
  const canInteract = Boolean(user && eventQuery.data);

  const arrivalBoard = (attendanceQuery.data ?? []).map((member) => {
    const profile = profileById.get(member.user_id);
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
    const displayName =
      member.user_id === user?.id
        ? 'You'
        : profile?.display_name || fullName || profile?.email?.split('@')[0];

    return {
      id: member.id,
      name: displayName ?? `Member ${member.user_id.slice(0, 4).toUpperCase()}`,
      status: arrivalLabels[member.arrival] ?? 'Not sure',
      eta:
        member.arrival === 'arrived'
          ? 'Here'
          : member.eta_minutes
            ? `${member.eta_minutes} min`
            : '—',
    };
  });

  const checklist = (checklistQuery.data ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    detail: item.note ?? item.state.replace('_', ' '),
    icon: checklistIconByState[item.state] ?? checklistIconByState.open,
    state: item.state,
  }));

  const handleRsvp = (rsvp: 'yes' | 'no' | 'maybe') => {
    if (!user || !eventQuery.data) return;
    setStatus(null);
    updateRsvp.mutate(
      { eventId: eventQuery.data.id, userId: user.id, rsvp },
      {
        onError: (error) => {
          setStatus(error instanceof Error ? error.message : 'Unable to update RSVP.');
        },
      }
    );
  };

  const handleArrival = (arrival: 'not_sure' | 'on_the_way' | 'arrived' | 'late') => {
    if (!user || !eventQuery.data || etaError) return;
    setStatus(null);
    updateArrival.mutate(
      {
        eventId: eventQuery.data.id,
        userId: user.id,
        arrival,
        etaMinutes,
      },
      {
        onError: (error) => {
          setStatus(error instanceof Error ? error.message : 'Unable to update arrival.');
        },
      }
    );
  };

  const handleChecklistPress = (itemId: string, currentState: 'open' | 'done' | 'blocked') => {
    if (!user || !eventQuery.data) return;
    updateChecklistItem.mutate({
      eventId: eventQuery.data.id,
      itemId,
      state: checklistNextState[currentState],
    });
  };

  const handleAddChecklistItem = async () => {
    if (!user || !eventQuery.data || newItemLabel.trim().length === 0) return;
    setStatus(null);
    try {
      await createChecklistItem.mutateAsync({
        eventId: eventQuery.data.id,
        userId: user.id,
        label: newItemLabel.trim(),
        note: newItemNote.trim() ? newItemNote.trim() : null,
      });
      setNewItemLabel('');
      setNewItemNote('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to add checklist item.');
    }
  };

  return (
    <View style={styles.screen}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={eventQuery.data?.title ?? 'Event'} subtitle="Details & RSVP" />
        {eventQuery.data ? (
          <Appbar.Action
            icon="pencil"
            onPress={() => router.push(`/event/edit/${eventQuery.data?.id}`)}
          />
        ) : null}
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <Surface elevation={1} style={styles.surface}>
          <Text variant="titleMedium">Event details</Text>
          {isLoading ? (
            <ActivityIndicator />
          ) : eventQuery.data ? (
            <>
              <Text variant="bodyLarge">{eventQuery.data.title}</Text>
              <Text variant="bodySmall" style={styles.caption}>
                {eventQuery.data.pod?.name ?? 'Your pod'} ·{' '}
                {formatEventTime(eventQuery.data.starts_at, eventQuery.data.ends_at)}
              </Text>
              <Text variant="bodySmall" style={styles.caption}>
                {eventQuery.data.location_text ?? 'Location TBD'}
              </Text>
              {eventQuery.data.description ? (
                <Text variant="bodyMedium">{eventQuery.data.description}</Text>
              ) : null}
            </>
          ) : (
            <Text variant="bodyMedium">You don&apos;t have access to this event.</Text>
          )}
        </Surface>

        <Surface elevation={1} style={styles.surface}>
          <Text variant="titleMedium">RSVP</Text>
          <View style={styles.row}>
            <Button
              mode="contained"
              disabled={!canInteract}
              onPress={() => handleRsvp('yes')}>
              I&apos;m in
            </Button>
            <Button mode="outlined" disabled={!canInteract} onPress={() => handleRsvp('maybe')}>
              Maybe
            </Button>
            <Button mode="outlined" disabled={!canInteract} onPress={() => handleRsvp('no')}>
              Can&apos;t make it
            </Button>
          </View>
          {status ? (
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              {status}
            </Text>
          ) : null}
        </Surface>

        <Surface elevation={1} style={styles.surface}>
          <Text variant="titleMedium">Arrival status</Text>
          <TextInput
            mode="outlined"
            label="ETA minutes (optional)"
            value={etaInput}
            onChangeText={setEtaInput}
            keyboardType="numeric"
            style={styles.input}
          />
          <HelperText type="error" visible={etaError}>
            Enter a valid number of minutes.
          </HelperText>
          <View style={styles.row}>
            {Object.entries(arrivalLabels).map(([value, label]) => (
              <Chip
                key={value}
                selected={currentAttendance?.arrival === value}
                onPress={() => handleArrival(value as ArrivalKey)}
                style={styles.chip}>
                {label}
              </Chip>
            ))}
          </View>
          <Divider style={styles.divider} />
          {attendanceQuery.isLoading ? (
            <ActivityIndicator />
          ) : arrivalBoard.length === 0 ? (
            <Text variant="bodyMedium">No arrivals shared yet.</Text>
          ) : (
            arrivalBoard.map((member) => (
              <View key={member.id} style={styles.arrivalRow}>
                <Text variant="bodyMedium">{member.name}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {member.status}
                </Text>
                <Chip compact mode="outlined">
                  {member.eta}
                </Chip>
              </View>
            ))
          )}
        </Surface>

        <Surface elevation={1} style={styles.surface}>
          <Text variant="titleMedium">Checklist</Text>
          {checklistQuery.isLoading ? (
            <ActivityIndicator />
          ) : checklist.length === 0 ? (
            <Text variant="bodyMedium">Checklist is empty.</Text>
          ) : (
            checklist.map((item) => (
              <List.Item
                key={item.id}
                title={item.label}
                description={item.detail}
                left={(props) => <List.Icon {...props} icon={item.icon} />}
                onPress={
                  canInteract
                    ? () => handleChecklistPress(item.id, item.state)
                    : undefined
                }
              />
            ))
          )}
          <Divider style={styles.divider} />
          <TextInput
            mode="outlined"
            label="New checklist item"
            value={newItemLabel}
            onChangeText={setNewItemLabel}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Note (optional)"
            value={newItemNote}
            onChangeText={setNewItemNote}
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleAddChecklistItem}
            disabled={!canInteract || newItemLabel.trim().length === 0 || createChecklistItem.isPending}>
            Add item
          </Button>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  surface: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'transparent',
  },
  divider: {
    marginTop: 8,
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  caption: {
    opacity: 0.7,
  },
});
