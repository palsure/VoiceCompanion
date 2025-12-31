#!/bin/bash
# Setup Google Cloud budget alerts to prevent unexpected costs

set -e

PROJECT_ID="hackathon-482302"
BUDGET_AMOUNT="${1:-50}"  # Default $50/month if not specified

echo "💰 Setting Up Budget Alerts"
echo "============================"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Budget Amount: \$${BUDGET_AMOUNT}/month"
echo ""

# Check if billing account is linked
echo "1. Checking billing account..."
BILLING_ACCOUNT=$(gcloud billing projects describe ${PROJECT_ID} --format='value(billingAccountName)' 2>/dev/null || echo "")

if [ -z "$BILLING_ACCOUNT" ]; then
    echo "❌ No billing account linked to project"
    echo ""
    echo "Please link a billing account first:"
    echo "  1. Go to: https://console.cloud.google.com/billing"
    echo "  2. Select your billing account"
    echo "  3. Click 'Link a project' and select ${PROJECT_ID}"
    echo ""
    echo "Or use gcloud:"
    echo "  gcloud billing projects link ${PROJECT_ID} --billing-account=BILLING_ACCOUNT_ID"
    exit 1
fi

BILLING_ACCOUNT_ID=$(echo $BILLING_ACCOUNT | sed 's|.*/||')
echo "✅ Billing account: ${BILLING_ACCOUNT_ID}"
echo ""

# Create budget
BUDGET_ID="voicecompanion-budget-$(date +%s)"
echo "2. Creating budget..."

# Create budget JSON
cat > /tmp/budget.json <<EOF
{
  "displayName": "VoiceCompanion Monthly Budget",
  "budgetFilter": {
    "projects": ["projects/${PROJECT_ID}"],
    "creditTypesTreatment": "INCLUDE_ALL_CREDITS"
  },
  "amount": {
    "specifiedAmount": {
      "currencyCode": "USD",
      "units": "${BUDGET_AMOUNT}"
    }
  },
  "thresholdRules": [
    {
      "thresholdPercent": 0.5,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.75,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.9,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 1.0,
      "spendBasis": "CURRENT_SPEND"
    }
  ],
  "notificationsRule": {
    "monitoringNotificationChannels": [],
    "pubsubTopic": "projects/${PROJECT_ID}/topics/budget-alerts"
  }
}
EOF

# Create Pub/Sub topic for budget alerts (if it doesn't exist)
echo "3. Creating Pub/Sub topic for alerts..."
gcloud pubsub topics create budget-alerts --project=${PROJECT_ID} 2>/dev/null || echo "   Topic already exists"

# Create budget
echo "4. Creating budget..."
gcloud billing budgets create \
  --billing-account=${BILLING_ACCOUNT_ID} \
  --display-name="VoiceCompanion Monthly Budget" \
  --budget-amount=${BUDGET_AMOUNT}USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=75 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100 \
  --projects=${PROJECT_ID} \
  --pubsub-topic=projects/${PROJECT_ID}/topics/budget-alerts \
  2>/dev/null || echo "   Budget may already exist"

echo ""
echo "✅ Budget alerts configured!"
echo ""
echo "📊 Budget Details:"
echo "   - Amount: \$${BUDGET_AMOUNT}/month"
echo "   - Alerts at: 50%, 75%, 90%, 100%"
echo "   - Pub/Sub topic: budget-alerts"
echo ""
echo "📧 To receive email alerts, set up a Cloud Function or use:"
echo "   https://console.cloud.google.com/cloudpubsub/topic/detail/budget-alerts?project=${PROJECT_ID}"
echo ""
echo "💡 Cost Optimization Tips:"
echo "   - Services scale to zero when not in use (min-instances=0)"
echo "   - Only pay for actual request processing time"
echo "   - Monitor usage: gcloud billing budgets list --billing-account=${BILLING_ACCOUNT_ID}"
echo ""

