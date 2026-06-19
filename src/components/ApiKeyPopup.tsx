import { useState } from 'react';

interface ApiKeyPopupProps {
  onSuccess: () => void;
}

export function ApiKeyPopup({ onSuccess }: ApiKeyPopupProps) {
  // If we reach this component, we don't have a valid key in the env
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-neutral-900 bg-opacity-70 p-4">
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 w-full text-slate-900">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Google Maps Activation</h2>
        
        <p className="text-sm mb-4 leading-relaxed text-slate-700">
          This interactive map-based chatbot requires a Google Maps Platform API Key to render the maps.
        </p>

        <ol className="list-decimal pl-5 text-sm mb-6 space-y-2 text-slate-700">
          <li>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Get a Maps API Key here
            </a>.
          </li>
          <li>
            Open the <strong>Settings</strong> (⚙️ gear icon, top-right).
          </li>
          <li>
            Go to <strong>Secrets</strong>.
          </li>
          <li>
            Add a new secret named <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded font-mono text-xs">GOOGLE_MAPS_PLATFORM_KEY</code>.
          </li>
          <li>
            Paste your key and press <strong>Enter</strong> to save.
          </li>
        </ol>

        <p className="text-xs text-slate-500 mt-2 p-3 bg-slate-50 rounded-lg italic">
          Note: This app will automatically rebuild and show the map once the key is saved.
        </p>
      </div>
    </div>
  );
}
