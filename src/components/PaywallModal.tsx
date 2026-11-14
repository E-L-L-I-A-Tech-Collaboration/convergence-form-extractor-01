import React from 'react';
import { X, Check, Crown, RefreshCw } from 'lucide-react';
import { SUBSCRIPTION_PLANS, TRIAL_COPY } from '../billing/plans';
import type { SubscriptionState } from '../billing/useSubscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sub: SubscriptionState;
  /**
   * Hard-gate mode: rendered as the app's subscription screen with no
   * way to dismiss it (used when the Android app has no active
   * subscription). Hides the close button.
   */
  blocking?: boolean;
}

function formatPrice(
  sub: SubscriptionState,
  itemId: string,
  fallback: string,
): string {
  const detail = sub.details[itemId];
  if (detail?.price) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: detail.price.currency,
      }).format(Number(detail.price.value));
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Mind Forge Premium paywall (ported from the EqualiF.I. Planner).
 *
 * Inside the Google Play app this drives Play Billing through the
 * Digital Goods API. On the open web it explains the subscription and
 * points to the Android app; the web app itself stays ungated.
 *
 * Offer: 7-day free trial, then $14.99/month. The trial is an
 * introductory offer configured in Play Console, not code.
 */
export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  sub,
  blocking,
}) => {
  if (!isOpen) return null;

  const inPlay = sub.status === 'free' || sub.status === 'premium';

  return (
    <div className="modal-backdrop">
      <div className="paywall-card">
        <div className="paywall-header">
          {!blocking && (
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn paywall-close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
          <div className="paywall-title-row">
            <Crown size={24} />
            <h2 className="paywall-title">Mind Forge Premium</h2>
          </div>
          <p className="paywall-subtitle">
            {blocking
              ? 'Mind Forge requires an active subscription in the Android app. Start your free trial to continue.'
              : 'Unlock the full creativity studio — guided exercises, diagnostics, live cognitive metrics, and the Co-Creative Muse.'}
          </p>
          <p className="paywall-trial">{TRIAL_COPY}</p>
        </div>

        <div className="paywall-body">
          {sub.status === 'premium' ? (
            <div className="paywall-premium">
              <Check size={20} className="paywall-premium-icon" />
              <div>
                <p className="paywall-premium-title">You&apos;re Premium.</p>
                <p className="paywall-premium-text">
                  Your Google Play subscription is active. Manage or cancel it
                  anytime in Google Play &gt; Subscriptions.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="paywall-plans">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div key={plan.itemId} className="paywall-plan">
                    <div className="paywall-plan-name">{plan.name}</div>
                    <div className="paywall-price">
                      {formatPrice(sub, plan.itemId, plan.fallbackPrice)}
                      <span className="paywall-period">{plan.periodLabel}</span>
                    </div>
                    <p className="paywall-blurb">{plan.blurb}</p>
                    <button
                      type="button"
                      disabled={!inPlay || sub.purchasingItemId !== null}
                      onClick={() => void sub.purchase(plan.itemId)}
                      className="btn-primary paywall-cta"
                    >
                      {sub.purchasingItemId === plan.itemId
                        ? 'Opening Google Play…'
                        : inPlay
                          ? 'Start 7-day free trial'
                          : 'Available in the Android app'}
                    </button>
                  </div>
                ))}
              </div>

              {!inPlay && (
                <p className="paywall-note">
                  Subscriptions are sold through Google Play inside the
                  Mind Forge Android app. This web version stays open so you
                  can explore the studio first.
                </p>
              )}

              <button
                type="button"
                onClick={() => void sub.refresh()}
                className="paywall-restore"
              >
                <RefreshCw size={14} /> Restore purchase
              </button>

              {sub.error && (
                <p className="paywall-error">{sub.error}</p>
              )}

              <p className="paywall-fineprint">
                {TRIAL_COPY}. Auto-renews until cancelled. Payment is charged
                to your Google Play account; manage or cancel anytime in
                Google Play subscriptions. Breathing and emotional-regulation
                content is wellness content, not medical treatment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
