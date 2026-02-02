import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  HelperText,
  List,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useEventById, useUpdateEvent } from '@/features/events/events-queries';
import { useSupabaseSession } from '@/hooks/use-supabase-session';

function toInputDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toIsoString(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Select a time';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function EditEventScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : '';
  const { user, isLoading: authLoading } = useSupabaseSession();
  const eventQuery = useEventById(eventId);
  const updateEvent = useUpdateEvent();
  const [hasLoaded, setHasLoaded] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!eventQuery.data || hasLoaded) return;
    setTitle(eventQuery.data.title ?? '');
    setDescription(eventQuery.data.description ?? '');
    setLocation(eventQuery.data.location_text ?? '');
    setStartsAt(toInputDateTime(new Date(eventQuery.data.starts_at)));
    setEndsAt(
      eventQuery.data.ends_at ? toInputDateTime(new Date(eventQuery.data.ends_at)) : ''
    );
    setHasLoaded(true);
  }, [eventQuery.data, hasLoaded]);

  const titleError = title.trim().length === 0;
  const startsAtIso = toIsoString(startsAt);
  const endsAtIso = endsAt ? toIsoString(endsAt) : null;
  const startsAtError = !startsAtIso;
  const endsAtInvalid = Boolean(endsAt && !endsAtIso);
  const endsAtBeforeStart =
    Boolean(endsAtIso && startsAtIso) && new Date(endsAtIso) < new Date(startsAtIso);
  const endsAtError = endsAtInvalid || endsAtBeforeStart;
  const isWeb = Platform.OS === 'web';

  const handleStartChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartsAt(toInputDateTime(selectedDate));
    }
  };

  const handleEndChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndsAt(toInputDateTime(selectedDate));
    }
  };

  const changeCount = useMemo(() => {
    if (!eventQuery.data) return 0;
    let changes = 0;
    if (title.trim() && title.trim() !== eventQuery.data.title) changes += 1;
    if (normalizeText(description) !== (eventQuery.data.description ?? null)) changes += 1;
    if (normalizeText(location) !== (eventQuery.data.location_text ?? null)) changes += 1;
    if (startsAtIso && startsAtIso !== eventQuery.data.starts_at) changes += 1;
    if ((endsAtIso ?? null) !== (eventQuery.data.ends_at ?? null)) changes += 1;
    return changes;
  }, [
    description,
    endsAtIso,
    eventQuery.data,
    location,
    startsAtIso,
    title,
  ]);

  const handleSubmit = async () => {
    if (!user || !eventQuery.data || titleError || startsAtError || endsAtError) return;

    const payload = {
      eventId: eventQuery.data.id,
      userId: user.id,
      title: title.trim() !== eventQuery.data.title ? title.trim() : undefined,
      description:
        normalizeText(description) !== (eventQuery.data.description ?? null)
          ? normalizeText(description)
          : undefined,
      locationText:
        normalizeText(location) !== (eventQuery.data.location_text ?? null)
          ? normalizeText(location)
          : undefined,
      startsAt: startsAtIso !== eventQuery.data.starts_at ? startsAtIso ?? undefined : undefined,
      endsAt: (endsAtIso ?? null) !== (eventQuery.data.ends_at ?? null) ? endsAtIso : undefined,
    };

    if (
      typeof payload.title === 'undefined' &&
      typeof payload.description === 'undefined' &&
      typeof payload.locationText === 'undefined' &&
      typeof payload.startsAt === 'undefined' &&
      typeof payload.endsAt === 'undefined'
    ) {
      setStatus('No changes to save.');
      return;
    }

    setStatus(null);

    try {
      await updateEvent.mutateAsync(payload);
      setStatus('Event updated.');
      router.replace(`/event/${eventQuery.data.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update event.');
    }
  };

  const isLoading = authLoading || eventQuery.isLoading;

  return (
    <View style={styles.screen}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit event" subtitle="Update schedule & details" />
      </Appbar.Header>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Surface elevation={1} style={styles.surface}>
            {isLoading ? (
              <Text variant="bodyMedium">Loading event...</Text>
            ) : !eventQuery.data ? (
              <Text variant="bodyMedium">You don&apos;t have access to this event.</Text>
            ) : (
              <>
                <TextInput
                  mode="outlined"
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
                <HelperText type="error" visible={titleError}>
                  Event title is required.
                </HelperText>
                <TextInput
                  mode="outlined"
                  label="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Location (optional)"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                />
                {isWeb ? (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Starts at (YYYY-MM-DDTHH:mm)"
                      value={startsAt}
                      onChangeText={setStartsAt}
                      style={styles.input}
                    />
                    <HelperText type="error" visible={startsAtError}>
                      Enter a valid start time (example: 2026-02-02T18:30).
                    </HelperText>
                    <TextInput
                      mode="outlined"
                      label="Ends at (optional)"
                      value={endsAt}
                      onChangeText={setEndsAt}
                      style={styles.input}
                    />
                    <HelperText type="error" visible={endsAtInvalid}>
                      Enter a valid end time (example: 2026-02-02T20:30).
                    </HelperText>
                    <HelperText type="error" visible={endsAtBeforeStart}>
                      End time must be after the start time.
                    </HelperText>
                  </>
                ) : (
                  <>
                    <List.Item
                      title="Starts at"
                      description={formatDateTimeLabel(startsAt)}
                      right={() => (
                        <Button mode="outlined" onPress={() => setShowStartPicker(true)}>
                          Pick
                        </Button>
                      )}
                    />
                    <List.Item
                      title="Ends at"
                      description={endsAt ? formatDateTimeLabel(endsAt) : 'Optional'}
                      right={() => (
                        <Button mode="outlined" onPress={() => setShowEndPicker(true)}>
                          Pick
                        </Button>
                      )}
                    />
                    {startsAtError ? (
                      <HelperText type="error" visible={startsAtError}>
                        Select a valid start time.
                      </HelperText>
                    ) : null}
                    {endsAtInvalid ? (
                      <HelperText type="error" visible={endsAtInvalid}>
                        Select a valid end time.
                      </HelperText>
                    ) : null}
                    {endsAtBeforeStart ? (
                      <HelperText type="error" visible={endsAtBeforeStart}>
                        End time must be after the start time.
                      </HelperText>
                    ) : null}
                    {showStartPicker ? (
                      <DateTimePicker
                        value={startsAtIso ? new Date(startsAtIso) : new Date()}
                        mode="datetime"
                        onChange={handleStartChange}
                      />
                    ) : null}
                    {showEndPicker ? (
                      <DateTimePicker
                        value={endsAtIso ? new Date(endsAtIso) : new Date()}
                        mode="datetime"
                        onChange={handleEndChange}
                      />
                    ) : null}
                  </>
                )}
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={
                    !user ||
                    !eventQuery.data ||
                    titleError ||
                    startsAtError ||
                    endsAtError ||
                    updateEvent.isPending ||
                    changeCount === 0
                  }>
                  Save changes
                </Button>
                {status ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                    {status}
                  </Text>
                ) : null}
              </>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboard: {
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
  input: {
    backgroundColor: 'transparent',
  },
});
