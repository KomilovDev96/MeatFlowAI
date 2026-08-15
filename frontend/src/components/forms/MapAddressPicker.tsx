import { AutoComplete, Input, Spin } from 'antd';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

const markerPin = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const TASHKENT_CENTER: LatLng = { lat: 41.311081, lng: 69.240562 };

type LatLng = { lat: number; lng: number };
type NominatimResult = { display_name: string; lat: string; lon: string };
export type AddressValue = { address: string; latitude: number; longitude: number };

function ClickHandler({ onSelect }: { onSelect: (pos: LatLng) => void }) {
  useMapEvents({ click: (event) => onSelect(event.latlng) });
  return null;
}

function Recenter({ position }: { position: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.lat, position.lng]);
  return null;
}

export function MapAddressPicker({
  value,
  onChange,
}: {
  value?: Partial<AddressValue>;
  onChange: (value: AddressValue) => void;
}) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(value?.address ?? '');
  const [options, setOptions] = useState<{ value: string; result: NominatimResult }[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<LatLng>(
    value?.latitude != null && value?.longitude != null ? { lat: value.latitude, lng: value.longitude } : TASHKENT_CENTER,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const applyAddress = (address: string, pos: LatLng) => {
    setPosition(pos);
    setQuery(address);
    onChange({ address, latitude: pos.lat, longitude: pos.lng });
  };

  const search = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=${i18n.language}&q=${encodeURIComponent(text)}`);
        const data: NominatimResult[] = await res.json();
        setOptions(data.map((item) => ({ value: item.display_name, result: item })));
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const selectSuggestion = (_: string, option: { result: NominatimResult }) => {
    applyAddress(option.result.display_name, { lat: Number(option.result.lat), lng: Number(option.result.lon) });
  };

  const reverseGeocode = async (pos: LatLng) => {
    setPosition(pos);
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&accept-language=${i18n.language}&lat=${pos.lat}&lon=${pos.lng}`);
      const data: NominatimResult = await res.json();
      applyAddress(data.display_name ?? query, pos);
    } catch {
      onChange({ address: query, latitude: pos.lat, longitude: pos.lng });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AutoComplete
        style={{ width: '100%', marginBottom: 8 }}
        options={options}
        value={query}
        onSearch={search}
        onSelect={selectSuggestion}
      >
        <Input placeholder={t('common.searchAddress')} suffix={loading ? <Spin size="small" /> : null} />
      </AutoComplete>
      <div style={{ height: 280, borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={markerPin} />
          <ClickHandler onSelect={reverseGeocode} />
          <Recenter position={position} />
        </MapContainer>
      </div>
    </div>
  );
}
