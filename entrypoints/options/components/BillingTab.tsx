import React, { useEffect, useState } from 'react';
import { Card, Stack, Text, TextInput, Button, Group, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { loadSettings, saveSettings } from '@modules/unlock';
import type { Settings } from '@shared/types/settings';
import { IconBrandTelegram, IconCreditCard, IconRefresh } from '@tabler/icons-react';

const PAYMENTS_BASE_URL = 'https://autofil-payments.vercel.app';

type LicenseStatus = {
  plan: 'free' | 'pro';
  slotsTotal: number;
  slotsUsed: number;
  isActiveForClient?: boolean;
};

export default function BillingTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await loadSettings();
      setSettings(data);
      if (data.billingEmail) {
        void fetchStatus(data.billingEmail, data);
      }
    })();
  }, []);

  const fetchStatus = async (email: string, currentSettings?: Settings) => {
    if (!email) return;
    const settingsToUse = currentSettings || settings;
    if (!settingsToUse) return;
    
    setLoadingStatus(true);
    try {
      const params = new URLSearchParams({ email });
      if (settingsToUse.clientId) {
        params.append('clientId', settingsToUse.clientId);
      }
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/license/status?${params.toString()}`);
      if (!res.ok) {
        throw new Error('STATUS_ERROR');
      }
      const json = (await res.json()) as LicenseStatus;
      setStatus(json);

      // Auto-downgrade if clientId is not active but device thinks it's Pro
      if (
        settingsToUse.clientId &&
        json.isActiveForClient === false &&
        settingsToUse.plan === 'pro'
      ) {
        const downgraded: Settings = { ...settingsToUse, plan: 'free' };
        setSettings(downgraded);
        await saveSettings({ plan: 'free' });
        notifications.show({
          message: t('billing.licenseRevoked'),
          color: 'orange',
        });
      }
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

  const handleStartTelegramPayment = async () => {
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
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/telegram/cryptobot/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: settings.clientId,
          email,
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
        isActiveForClient: true,
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

  const handleDeactivate = async () => {
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

    setDeactivating(true);
    try {
      const res = await fetch(`${PAYMENTS_BASE_URL}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          clientId: settings.clientId,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        notifications.show({ message: t('billing.deactivateError'), color: 'red' });
        return;
      }

      const downgraded: Settings = {
        ...settings,
        plan: 'free',
      };
      setSettings(downgraded);
      setStatus({
        plan: (json.plan as 'free' | 'pro') ?? 'free',
        slotsTotal: json.slotsTotal ?? 0,
        slotsUsed: json.slotsUsed ?? 0,
        isActiveForClient: false,
      });
      await saveSettings({ plan: 'free' });

      notifications.show({ message: t('billing.deactivated'), color: 'green' });
    } catch (error) {
      console.error(error);
      notifications.show({ message: t('billing.deactivateError'), color: 'red' });
    } finally {
      setDeactivating(false);
    }
  };

  if (!settings) {
    return <Text>{t('common.loading')}</Text>;
  }

  // Badge reflects this device's plan, not just license presence.
  const isPro = settings.plan === 'pro';
  const isActiveHere = status?.isActiveForClient === true;

  return (
    <Stack gap="md" style={{ width: '100%' }}>
      <Card withBorder padding="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4} style={{ flex: 1 }}>
              <Text fw={600} size="lg">
                {t('billing.title')}
              </Text>
              <Text size="xs" c="dimmed">
                {t('billing.emailLinkedHint')}
              </Text>
            </Stack>
            <Group gap="xs">
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={() => {
                  if (settings.billingEmail) void fetchStatus(settings.billingEmail, settings);
                }}
                loading={loadingStatus}
              >
                {t('billing.refreshStatus')}
              </Button>
              <Badge color={isPro ? 'green' : 'gray'} variant="filled">
                {isPro ? t('billing.statusPro') : t('billing.statusFree')}
              </Badge>
            </Group>
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
              if (email && settings) {
                void fetchStatus(email, settings);
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

          <Group wrap="wrap" gap="xs">
            <Button
              onClick={handleStartCheckout}
              loading={loadingCheckout}
              leftSection={<IconCreditCard size={18} />}
            >
              {t('billing.payWithCard')}
            </Button>
            <Button
              variant="outline"
              onClick={handleStartTelegramPayment}
              loading={loadingCheckout}
              leftSection={<IconBrandTelegram size={18} />}
            >
              {t('billing.payWithTelegram')}
            </Button>
            {isActiveHere ? (
              <Button
                variant="light"
                color="red"
                onClick={handleDeactivate}
                loading={deactivating}
              >
                {t('billing.deactivateThisDevice')}
              </Button>
            ) : (
              <Button variant="light" onClick={handleActivate} loading={activating}>
                {t('billing.activateThisDevice')}
              </Button>
            )}
          </Group>

          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('billing.hint')}
            </Text>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}


