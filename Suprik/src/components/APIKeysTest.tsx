import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function APIKeysTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testAPIKeys = async () => {
    setTesting(true);
    setResults(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/test-api-keys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to test API keys');
      }

      const data = await response.json();
      setResults(data);

      // Show toast based on results
      const heliusStatus = data.helius.configured && data.helius.valid;
      const alchemyStatus = data.alchemy.configured && data.alchemy.valid;

      if (heliusStatus && alchemyStatus) {
        toast.success('همه API keys معتبر هستند ✅');
      } else if (heliusStatus || alchemyStatus) {
        toast.warning('برخی API keys معتبر نیستند ⚠️');
      } else {
        toast.error('هیچ API key معتبری یافت نشد ❌');
      }
    } catch (error: any) {
      console.error('Test API keys error:', error);
      toast.error('خطا در تست API keys');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (configured: boolean, valid: boolean) => {
    if (!configured) {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
    if (valid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (configured: boolean, valid: boolean, error: string | null) => {
    if (!configured) {
      return 'تنظیم نشده';
    }
    if (valid) {
      return 'معتبر ✅';
    }
    if (error) {
      return `نامعتبر: ${error}`;
    }
    return 'نامعتبر';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">تست API Keys</h3>
          <p className="text-sm text-gray-400 mt-1">
            وضعیت اتصال به شبکه‌های بلاکچین را بررسی کنید
          </p>
        </div>
        <Button
          onClick={testAPIKeys}
          disabled={testing}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              در حال تست...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              تست API Keys
            </>
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-3">
          {/* Helius API (Solana) */}
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(results.helius.configured, results.helius.valid)}
                  <h4 className="font-medium">Helius API (Solana)</h4>
                </div>
                <p className="text-sm text-gray-400">
                  {getStatusText(
                    results.helius.configured,
                    results.helius.valid,
                    results.helius.error
                  )}
                </p>
                {!results.helius.configured && (
                  <p className="text-xs text-gray-500 mt-2">
                    برای چک کردن موجودی Solana و SPL tokens، این API را تنظیم کنید
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Alchemy API (Ethereum) */}
          <Card className="p-4 bg-white/5 border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(results.alchemy.configured, results.alchemy.valid)}
                  <h4 className="font-medium">Alchemy API (Ethereum)</h4>
                </div>
                <p className="text-sm text-gray-400">
                  {getStatusText(
                    results.alchemy.configured,
                    results.alchemy.valid,
                    results.alchemy.error
                  )}
                </p>
                {!results.alchemy.configured && (
                  <p className="text-xs text-gray-500 mt-2">
                    برای چک کردن موجودی Ethereum و ERC-20 tokens، این API را تنظیم کنید
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Help text */}
          <div className="text-xs text-gray-500 bg-white/5 p-3 rounded-lg border border-white/10">
            <p className="mb-2">💡 برای تنظیم API keys:</p>
            <ol className="list-decimal list-inside space-y-1 mr-4">
              <li>به پنل Supabase بروید</li>
              <li>Settings {'>'} Edge Functions {'>'} Secrets</li>
              <li>API keys را اضافه کنید: HELIUS_API_KEY و ALCHEMY_API_KEY</li>
              <li>راهنمای کامل: <code className="text-purple-400">API_KEYS_SETUP.md</code></li>
            </ol>
          </div>
          
          {/* Error specific help */}
          {results && results.alchemy.configured && !results.alchemy.valid && results.alchemy.error?.includes('authenticated') && (
            <div className="text-xs bg-red-500/10 p-4 rounded-lg border border-red-500/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-red-300 font-semibold">❌ خطای احراز هویت Alchemy</p>
                  <p className="text-red-200">API Key شما نادرست است. دلایل محتمل:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-200 mr-4">
                    <li>URL کامل را کپی کرده‌اید (فقط قسمت بعد از /v2/ نیاز است)</li>
                    <li>API Key منقضی شده یا غیرفعال است</li>
                    <li>Secret در Supabase اشتباه ذخیره شده</li>
                  </ul>
                  <div className="bg-red-600/20 p-2 rounded mt-2">
                    <p className="text-red-100 font-semibold mb-2">✅ راه حل قطعی (5 دقیقه):</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-red-100 mr-4 text-[11px]">
                      <li className="leading-relaxed">
                        <a 
                          href="https://dashboard.alchemy.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline font-bold"
                        >
                          به Alchemy Dashboard بروید
                        </a> و App خود را باز کنید
                      </li>
                      <li className="leading-relaxed">
                        روی <strong>API Key</strong> کلیک کنید
                      </li>
                      <li className="leading-relaxed">
                        <strong className="text-yellow-200">فقط قسمت بعد از /v2/ را کپی کنید:</strong>
                        <div className="bg-black/40 p-1 rounded mt-0.5 font-mono text-[10px]">
                          ❌ https://...v2/abc123<br/>
                          ✅ abc123def456...
                        </div>
                      </li>
                      <li className="leading-relaxed">
                        <a 
                          href="https://supabase.com/dashboard" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline font-bold"
                        >
                          به Supabase بروید
                        </a> → Settings → Edge Functions → Secrets
                      </li>
                      <li className="leading-relaxed">
                        ALCHEMY_API_KEY قبلی را <strong>Delete</strong> کنید (🗑️)
                      </li>
                      <li className="leading-relaxed">
                        <strong>Add New Secret</strong> با همین نام بسازید
                      </li>
                      <li className="leading-relaxed">
                        <strong>5 دقیقه صبر کنید</strong> و دوباره تست کنید
                      </li>
                    </ol>
                  </div>
                  <Button
                    onClick={() => window.open('https://dashboard.alchemy.com', '_blank')}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-xs"
                    size="sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    باز کردن Alchemy Dashboard
                  </Button>
                  <p className="text-red-200 mt-2 text-center text-[10px]">
                    📖 <code className="bg-black/30 px-1 rounded">FIX_ALCHEMY_ERROR.txt</code>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {results && results.helius.configured && !results.helius.valid && (
            <div className="text-xs bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold">⚠️ خطای احراز هویت Helius</p>
                  <p className="text-yellow-200 mt-1">API Key شما نادرست است. به Helius.dev بروید و API Key جدید بگیرید.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
