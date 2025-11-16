import React, { useEffect, useState } from 'react';
import { Card, Stack, Text, TextInput, Button, Group, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { loadSettings, saveSettings } from '@modules/unlock';
import type { Settings } from '@shared/types/settings';

const PAYMENTS_BASE_URL = 'https://autofil-payments.vercel.app';

type LicenseStatus = {
  plan: 'free' | 'pro';
  slotsTotal: number;
  slotsUsed: number;
};

export default function BillingTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await loadSettings();
      setSettings(data);
      if (data.billingEmail) {
        void fetchStatus(data.billingEmail);
      }
    })();
  }, []);

  const fetchStatus = async (email: string) => {
    if (!email) return;
    setLoadingStatus(true);
    try {
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/license/status?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        throw new Error('STATUS_ERROR');
      }
      const json = (await res.json()) as LicenseStatus;
      setStatus(json);
    } catch (error) {
      console.error(error);
      notifications.show({ message: t('billing.statusError'), color: 'red' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleStartCheckout = async () => {
    if (!settings) return;
    const email = settings.billingEmail?.trim();
    if (!email) {
      notifications.show({ message: t('billing.emailRequired'), color: 'red' });
      return;
    }
    if (!settings.clientId) {
      notifications.show({ message: t('billing.clientIdMissing'), color: 'red' });
      return;
    }

    setLoadingCheckout(true);
    try {
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: settings.clientId,
          email,
          quantity: 1,
        }),
      });

      if (!res.ok) {
        throw new Error('CHECKOUT_ERROR');
      }

      const json = (await res.json()) as { url?: string };
      if (!json.url) {
        throw new Error('NO_URL');
      }

      window.open(json.url, '_blank', 'noopener,noreferrer');
      notifications.show({ message: t('billing.checkoutOpened'), color: 'green' });
    } catch (error) {
      console.error(error);
      notifications.show({ message: t('billing.checkoutError'), color: 'red' });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleActivate = async () => {
    if (!settings) return;
    const email = settings.billingEmail?.trim();
    if (!email) {
      notifications.show({ message: t('billing.emailRequired'), color: 'red' });
      return;
    }
    if (!settings.clientId) {
      notifications.show({ message: t('billing.clientIdMissing'), color: 'red' });
      return;
    }

    setActivating(true);
    try {
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/license/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          clientId: settings.clientId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const code = json?.error as string | undefined;

        // On these errors, this device is definitely not Pro → downgrade local plan if needed
        if (code === 'LICENSE_NOT_FOUND' || code === 'LICENSE_SLOTS_EXCEEDED' || code === 'LICENSE_NOT_PRO') {
          if (settings.plan !== 'free') {
            const downgraded: Settings = { ...settings, plan: 'free' };
            setSettings(downgraded);
            void saveSettings({ plan: 'free' });
          }
        }

        if (code === 'LICENSE_NOT_FOUND') {
          notifications.show({ message: t('billing.notFound'), color: 'red' });
        } else if (code === 'LICENSE_SLOTS_EXCEEDED') {
          notifications.show({ message: t('billing.slotsExceeded'), color: 'red' });
        } else if (code === 'LICENSE_NOT_PRO') {
          notifications.show({ message: t('billing.notPro'), color: 'red' });
        } else {
          notifications.show({ message: t('billing.activateError'), color: 'red' });
        }
        return;
      }

      const nextPlan = (json.plan as 'free' | 'pro') ?? 'free';
      const updated: Settings = {
        ...settings,
        plan: nextPlan,
        billingEmail: email,
      };
      setSettings(updated);
      setStatus({
        plan: nextPlan,
        slotsTotal: json.slotsTotal ?? 0,
        slotsUsed: json.slotsUsed ?? 0,
      });
      await saveSettings({ plan: nextPlan, billingEmail: email });

      notifications.show({ message: t('billing.activated'), color: 'green' });
    } catch (error) {
      console.error(error);
      notifications.show({ message: t('billing.activateError'), color: 'red' });
    } finally {
      setActivating(false);
    }
  };

  if (!settings) {
    return <Text>{t('common.loading')}</Text>;
  }

  // Badge reflects this device's plan, not just license presence.
  const isPro = settings.plan === 'pro';

  return (
    <Stack gap="md" style={{ width: '100%'}}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600} size="lg">
              {t('billing.title')}
            </Text>
            <Badge color={isPro ? 'green' : 'gray'} variant="filled">
              {isPro ? t('billing.statusPro') : t('billing.statusFree')}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed">
            {t('billing.description')}
          </Text>

          <TextInput
            label={t('billing.emailLabel')}
            placeholder={t('billing.emailPlaceholder')}
            value={settings.billingEmail ?? ''}
            onChange={(e) => {
              const email = e.currentTarget.value;
              setSettings({ ...settings, billingEmail: email });
            }}
            onBlur={(e) => {
              const email = e.currentTarget.value.trim();
              void saveSettings({ billingEmail: email || undefined });
              if (email) {
                void fetchStatus(email);
              }
            }}
          />

          <TextInput
            label={t('billing.clientIdLabel')}
            value={settings.clientId ?? ''}
            readOnly
          />

          {status && (
            <Text size="sm">
              {t('billing.slotsInfo', {
                total: status.slotsTotal,
                used: status.slotsUsed,
              })}
            </Text>
          )}

          <Group>
            <Button onClick={handleStartCheckout} loading={loadingCheckout}>
              {t('billing.payWithCard')}
            </Button>
            <Button variant="light" onClick={handleActivate} loading={activating}>
              {t('billing.activateThisDevice')}
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                if (settings.billingEmail) void fetchStatus(settings.billingEmail);
              }}
              loading={loadingStatus}
            >
              {t('billing.refreshStatus')}
            </Button>
          </Group>

          <Text size="xs" c="dimmed">
            {t('billing.hint')}
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}


