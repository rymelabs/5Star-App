import React from 'react';
import ConfirmationModal from './ConfirmationModal';

const DEFAULT_MESSAGE = 'Create a free account to follow teams, unlock match alerts, and keep your favorites in sync across devices.';
const DEFAULT_BENEFITS = [
  'Follow clubs and get notified before they play',
  'Receive match reminders and breaking team news',
  'Sync your preferences across every device'
];

const AuthPromptModal = ({
  message = DEFAULT_MESSAGE,
  benefits = DEFAULT_BENEFITS,
  title,
  confirmText,
  cancelText,
  type,
  ...modalProps
}) => {
  const description = (
    <div className="space-y-4 text-sm leading-relaxed text-gray-300">
      <p>{message}</p>
      {benefits?.length ? (
        <ul className="space-y-1 text-gray-200 list-disc list-inside">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  return (
    <ConfirmationModal
      {...modalProps}
      title={title || 'Sign in required'}
      confirmText={confirmText || 'Sign in'}
      cancelText={cancelText || 'Maybe later'}
      type={type || 'info'}
      message={description}
    />
  );
};

export default AuthPromptModal;
