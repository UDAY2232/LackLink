import React, { useState } from 'react';
import { User, Bell, Shield, CreditCard, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value,
    }));
    toast.success('Notification preferences updated');
  };

  const settingSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        {
          label: 'Profile Information',
          description: 'Update your personal information',
          action: 'Edit Profile',
          href: '/profile',
        },
        {
          label: 'Email Address',
          description: user?.email,
          action: 'Change Email',
        },
        {
          label: 'Password',
          description: 'Change your password',
          action: 'Update Password',
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Email Notifications',
          description: 'Receive order updates and promotions via email',
          toggle: true,
          value: notifications.email,
          onChange: (value: boolean) => handleNotificationChange('email', value),
        },
        {
          label: 'Push Notifications',
          description: 'Get notified about order status changes',
          toggle: true,
          value: notifications.push,
          onChange: (value: boolean) => handleNotificationChange('push', value),
        },
        {
          label: 'SMS Notifications',
          description: 'Receive delivery updates via SMS',
          toggle: true,
          value: notifications.sms,
          onChange: (value: boolean) => handleNotificationChange('sms', value),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          label: 'Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          action: 'Enable 2FA',
        },
        {
          label: 'Login Activity',
          description: 'See where you\'re logged in',
          action: 'View Activity',
        },
        {
          label: 'Data Export',
          description: 'Download your account data',
          action: 'Export Data',
        },
      ],
    },
    {
      title: 'Payment & Billing',
      icon: CreditCard,
      items: [
        {
          label: 'Payment Methods',
          description: 'Manage your saved payment methods',
          action: 'Manage Cards',
        },
        {
          label: 'Billing History',
          description: 'View your order history and receipts',
          action: 'View History',
          href: '/orders',
        },
        {
          label: 'Addresses',
          description: 'Manage your shipping addresses',
          action: 'Edit Addresses',
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-8">
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                <section.icon className="h-6 w-6 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>

                    <div className="ml-4">
                      {item.toggle ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={item.value}
                            onChange={(e) => item.onChange?.(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                      ) : (
                        <button
                          onClick={() => {
                            if (item.href) {
                              window.location.href = item.href;
                            } else {
                              toast.info('Feature coming soon!');
                            }
                          }}
                          className="text-sm font-medium text-black hover:text-gray-700 transition-colors"
                        >
                          {item.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden"
        >
          <div className="bg-red-50 px-6 py-4 border-b border-red-200">
            <div className="flex items-center space-x-3">
              <Trash2 className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => toast.error('Account deletion is not available in demo')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;