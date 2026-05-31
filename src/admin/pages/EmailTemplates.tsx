import React, { useState, useEffect } from 'react';
import { Mail, Save, Eye, RefreshCw, Check } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmed — #{orderRef}',
    description: 'Sent when a customer places an order',
    variables: ['orderRef', 'customerName', 'items', 'totalAmount', 'shippingAddress'],
  },
  {
    id: 'order-shipped',
    name: 'Order Shipped',
    subject: 'Your Order #{orderRef} Has Been Shipped',
    description: 'Sent when an order is marked as shipped',
    variables: ['orderRef', 'customerName', 'trackingNumber', 'trackingUrl'],
  },
  {
    id: 'order-delivered',
    name: 'Order Delivered',
    subject: 'Your Order #{orderRef} Has Been Delivered',
    description: 'Sent when an order is marked as delivered',
    variables: ['orderRef', 'customerName'],
  },
  {
    id: 'refund-processed',
    name: 'Refund Processed',
    subject: 'Refund Processed for Order #{orderRef}',
    description: 'Sent when a refund is processed',
    variables: ['orderRef', 'customerName', 'refundAmount', 'refundReason'],
  },
];

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('order-confirmation');
  const [customSubject, setCustomSubject] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  // Load saved customizations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('emailTemplateCustomizations');
    if (saved) {
      setCustomSubject(JSON.parse(saved));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage (in production, this would be an API call)
    localStorage.setItem('emailTemplateCustomizations', JSON.stringify(customSubject));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendTest = async () => {
    if (!testEmail || !currentTemplate) return;
    
    setSendingTest(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          templateId: currentTemplate.id,
          email: testEmail,
          customSubject: customSubject[currentTemplate.id],
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTestResult({ success: true, message: 'Test email sent successfully!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to send test email. Check SMTP configuration.' });
    } finally {
      setSendingTest(false);
    }
  };

  const getPreviewHtml = () => {
    if (!currentTemplate) return '';
    
    const sampleData: Record<string, string> = {
      orderRef: 'ZRV-20260531-ABC1',
      customerName: 'Jane Doe',
      items: 'Leather Tote Bag (Black) × 1',
      totalAmount: '₹4,999',
      shippingAddress: '123 Main St, Mumbai 400001',
      trackingNumber: 'AWB123456789',
      trackingUrl: 'https://tracking.example.com/AWB123456789',
      refundAmount: '₹4,999',
      refundReason: 'Customer requested cancellation',
    };

    let subject = customSubject[currentTemplate.id] || currentTemplate.subject;
    currentTemplate.variables.forEach(v => {
      subject = subject.replace(`{${v}}`, sampleData[v] || `{${v}}`);
    });

    return `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5A5A40; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 3px;">ZAREVIELLE</h1>
          <p style="margin: 8px 0 0; font-size: 11px; opacity: 0.7;">Crafted for the everyday extraordinary</p>
        </div>
        <div style="padding: 32px; background: white;">
          <p style="color: #666; font-size: 12px; margin: 0 0 8px;">Subject:</p>
          <h2 style="color: #5A5A40; margin: 0 0 24px; font-size: 18px;">${subject}</h2>
          <div style="background: #FDFBF7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 14px; color: #333;">
              Dear <strong>${sampleData.customerName}</strong>,
            </p>
          </div>
          <p style="color: #666; font-size: 13px; line-height: 1.6;">
            This is a preview of the <strong>${currentTemplate.name}</strong> email template.
            The actual email will contain real order data.
          </p>
          <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Available Variables:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${currentTemplate.variables.map(v => `<code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{${v}}</code>`).join('')}
            </div>
          </div>
        </div>
        <div style="background: #FDFBF7; padding: 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #888;">© 2026 Zarevielle Studio</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-text-dark flex items-center gap-2">
            <Mail size={24} className="text-primary" />
            Email Templates
          </h1>
          <p className="text-sm text-text-dark/60 mt-1">Customize email notifications sent to customers</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saved ? <Check size={16} /> : saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="bg-surface rounded-lg border border-border-tan p-4">
          <h3 className="text-sm font-medium text-text-dark mb-4">Templates</h3>
          <div className="space-y-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-secondary/50 border border-transparent'
                }`}
              >
                <p className="text-sm font-medium text-text-dark">{template.name}</p>
                <p className="text-xs text-text-dark/50 mt-0.5">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {currentTemplate && (
            <>
              {/* Subject Editor */}
              <div className="bg-surface rounded-lg border border-border-tan p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-dark">Edit Subject Line</h3>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      previewMode ? 'bg-primary text-white' : 'bg-secondary text-text-dark hover:bg-secondary/80'
                    }`}
                  >
                    <Eye size={14} />
                    {previewMode ? 'Edit' : 'Preview'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={customSubject[currentTemplate.id] ?? currentTemplate.subject}
                      onChange={(e) => setCustomSubject(prev => ({ ...prev, [currentTemplate.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder={currentTemplate.subject}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1.5">Available Variables</label>
                    <div className="flex flex-wrap gap-2">
                      {currentTemplate.variables.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const current = customSubject[currentTemplate.id] ?? currentTemplate.subject;
                            setCustomSubject(prev => ({ ...prev, [currentTemplate.id]: current + `{${v}}` }));
                          }}
                          className="px-2 py-1 bg-secondary text-text-dark text-xs rounded hover:bg-secondary/80 transition-colors font-mono"
                        >
                          {`{${v}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomSubject(prev => {
                      const newState = { ...prev };
                      delete newState[currentTemplate.id];
                      return newState;
                    })}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset to default
                  </button>
                </div>
              </div>

              {/* Preview */}
              {previewMode && (
                <div className="bg-surface rounded-lg border border-border-tan p-5">
                  <h3 className="text-sm font-medium text-text-dark mb-4">Email Preview</h3>
                  <div 
                    className="border border-border-tan rounded-lg overflow-hidden bg-white"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              )}

              {/* Send Test Email */}
              <div className="bg-surface rounded-lg border border-border-tan p-5">
                <h3 className="text-sm font-medium text-text-dark mb-4">Send Test Email</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2.5 border border-border-tan rounded-md bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={sendingTest || !testEmail}
                    className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                    Send Test
                  </button>
                </div>
                {testResult && (
                  <p className={`mt-3 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;
