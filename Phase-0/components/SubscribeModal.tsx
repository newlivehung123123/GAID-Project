import React, { useState } from 'react';
import { handleSubscription } from '../services/subscriptionService';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    try {
      const result = await handleSubscription(email);
      
      if (result.success) {
        setStatus('success');
        // Clear email field on success
        setEmail('');
        // Trigger success callback for unified notification
        if (onSuccess) {
          onSuccess();
        }
        // Reset after showing success message
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setEmail('');
          setErrorMessage('');
        }, 2500);
      } else {
        setStatus('error');
        setErrorMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again later.');
      console.error('Subscription error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#050505] border border-blue-900/50 shadow-[0_0_50px_rgba(27,61,123,0.4)] rounded-sm p-8 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
        {/* Tech Decoration Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
        
        {/* Scanline Background Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {status === 'success' ? (
          <div className="relative z-10 text-center py-8 animate-pulse">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-green-500 text-green-500 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-orbitron text-2xl text-white font-bold mb-2 tracking-wider">
              LINK ESTABLISHED
            </h3>
            <p className="text-gray-400 font-mono text-sm">
              Thank you for subscribing!
            </p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="mb-6 text-center">
              <h3 className="font-orbitron text-2xl font-bold text-white mb-2 tracking-widest">
                WANT TO STAY INFORMED?
              </h3>
              <div className="h-0.5 w-16 bg-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400 font-mono text-sm leading-relaxed">
                Subscribe to instantly get notified when our new articles on societal impacts of AI are out.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-6">
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorMessage('');
                    }
                  }}
                  placeholder="ENTER_EMAIL_ADDRESS"
                  className="w-full bg-[#111] border border-gray-700 text-white px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono text-sm placeholder-gray-600 transition-all text-center"
                />
              </div>

              {/* Error Message */}
              {status === 'error' && errorMessage && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded text-sm font-mono">
                  {errorMessage}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-900 disabled:cursor-wait text-white font-orbitron font-bold uppercase tracking-[0.2em] py-4 transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500/30 relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {status === 'submitting' ? 'ESTABLISHING CONNECTION...' : 'JOIN OUR COMMUNITY'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
