import { useState } from 'react';
import { Wallet, Cloud, Shield, Fingerprint } from 'lucide-react';
import { signInWithGoogle, isGoogleConfigured } from '../lib/driveSync';

interface AuthScreenProps {
  onSignedIn: (token: string) => void;
  onSkip: () => void;
}

export function AuthScreen({ onSignedIn, onSkip }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await signInWithGoogle();
      sessionStorage.setItem('google_access_token', token);
      onSignedIn(token);
    } catch (e: any) {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: 'var(--bg-app, #FDF7EC)' }}>
      <div className="max-w-sm w-full flex flex-col items-center gap-8 animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
            style={{ background: 'var(--bg-header, #1B1914)' }}>
            <Wallet size={36} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter" style={{ color: 'var(--text-primary, #1B1914)' }}>
              Chill-Arai
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary, #A1A1A1)' }}>
              Your money. Your device. Your rules.
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-col gap-3 w-full">
          {[
            { icon: Shield, label: 'Data stays on your device & Drive', sub: 'Zero servers. Zero subscriptions.' },
            { icon: Cloud, label: 'Sync via your own Google Drive', sub: 'Encrypted before upload.' },
            { icon: Fingerprint, label: 'Biometric-locked on return', sub: 'FaceID / TouchID / PIN protected.' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--bg-surface, #FFFFFF)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-icon, #FEF1D5)' }}>
                <Icon size={20} style={{ color: 'var(--text-primary, #1B1914)' }} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary, #1B1914)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary, #A1A1A1)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          {isGoogleConfigured() && (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{ background: 'var(--bg-header, #1B1914)', color: '#FFFFFF' }}
            >
              {loading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          )}
          <button
            onClick={onSkip}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95"
            style={{ background: 'transparent', color: 'var(--text-secondary, #A1A1A1)', border: '1.5px solid var(--text-secondary, #A1A1A1)' }}
          >
            Use Locally (No Sync)
          </button>
        </div>
      </div>
    </div>
  );
}
