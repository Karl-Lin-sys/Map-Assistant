import { useState, useRef, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { ChatInterface } from "./components/ChatInterface";
import { ApiKeyPopup } from "./components/ApiKeyPopup";
import { ChatMessage, MapViewport, PlaceMarker } from "./types";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [viewport, setViewport] = useState<MapViewport>({
    lat: 37.7749, // SF Default
    lng: -122.4194,
    zoom: 12,
  });
  const [markers, setMarkers] = useState<PlaceMarker[]>([]);

  // Track viewport changes without triggering re-renders that break map UX
  const currentViewport = useRef(viewport);
  useEffect(() => {
    currentViewport.current = viewport;
  }, [viewport]);

  if (!hasValidKey) {
    return <ApiKeyPopup onSuccess={() => window.location.reload()} />;
  }

  const handleSendMessage = async (input: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ text: input }],
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: messages.map(m => ({ role: m.role, parts: m.parts })),
          message: input,
          currentViewport: currentViewport.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      // Process function calls
      let hasUpdateViewport = false;
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((fc: any) => {
          if (fc.name === 'updateMapViewport') {
            const { lat, lng, zoom, title } = fc.args;
            if (lat !== undefined && lng !== undefined) {
               setViewport({ lat, lng, zoom: zoom || 14 });
               hasUpdateViewport = true;
               if (title) {
                  // Only keep the most recent markers from this interaction so it doesn't get cluttered
                  setMarkers([{ id: Date.now().toString(), lat, lng, title }]);
               }
            }
          }
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          parts: [{ text: data.text }],
          isSearching: data.hasSearchGrounding,
          functionCalls: data.functionCalls
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "model",
          parts: [{ text: `Error: ${err.message}. Please make sure the server is fully running.` }],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setMarkers([]);
  };

  return (
    <div className="flex h-screen w-full bg-neutral-100 overflow-hidden font-sans">
      <ChatInterface
        messages={messages}
        isThinking={isThinking}
        onSendMessage={handleSendMessage}
        onClear={handleClear}
      />
      
      <div className="flex-1 relative h-full">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            center={{ lat: viewport.lat, lng: viewport.lng }}
            zoom={viewport.zoom}
            onCameraChanged={(ev) => setViewport({ lat: ev.detail.center.lat, lng: ev.detail.center.lng, zoom: ev.detail.zoom })}
            mapId="AI_STUDIO_MAP"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
            disableDefaultUI={false}
          >
            {markers.map((marker) => (
              <AdvancedMarker key={marker.id} position={{ lat: marker.lat, lng: marker.lng }} title={marker.title}>
                <Pin background="#ea4335" glyphColor="#fff" borderColor="#c5221f" />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
