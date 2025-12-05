'use client';

export default function WorkflowSteps() {
  const steps = [
    {
      number: 1,
      title: 'Onboard Customer',
      description: 'Create customer accounts in Metronome and Stripe, establish initial subscription and credit allocation',
    },
    {
      number: 2,
      title: 'Manage Subscription',
      description: 'Handle tier upgrades and downgrades with automatic prorating and credit adjustments',
    },
    {
      number: 3,
      title: 'Process Payments',
      description: 'Manage invoices, payment methods, and payment processing through Stripe integration',
    },
    {
      number: 4,
      title: 'Monitor & Webhooks',
      description: 'Track subscription status, process webhook events, and monitor billing operations',
    },
  ];

  return (
    <div className="bg-white rounded border border-gray-200 p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Billing Workflow Overview</h2>
        <p className="text-sm text-gray-600">
          Complete lifecycle of customer billing management. Follow these steps in order for new customers.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="relative p-4 border border-gray-200 rounded hover:border-gray-300 transition-colors"
          >
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute -right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                →
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded flex items-center justify-center text-sm font-medium">
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
